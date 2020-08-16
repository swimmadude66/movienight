import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { S3 } from 'aws-sdk';
import { LoggingService } from './logger';
import { VideoInfo } from '../models/videos';
import { UploadParams } from '../models/storage';

export interface FileMetadata {
    FileSize: number;
    FileName: string;
}

export type UploadInfo = Partial<VideoInfo> & FileMetadata;

export class StorageService {

    private _s3: S3;

    constructor(
        private _logger: LoggingService,
        private _bucketName: string,
        s3AccessKeyId: string,
        s3SecretKey: string,
        s3Region: string
    ) {
        this._s3 = new S3({
            accessKeyId: s3AccessKeyId,
            secretAccessKey: s3SecretKey,
            region: s3Region
        });
    }

    getUploadUrl(fields: {key: string, [field: string]: string}): Observable<UploadParams>  {
        const fileLoc = `s3:/${this._bucketName}/${fields.key}`;
        return Observable.create(obs => {
            this._s3.createPresignedPost({
                Bucket: this._bucketName,
                Fields: fields
            }, (err, data) => {
                if (err) {
                    this._logger.logError(err, 'Error creating presigned URL');
                    return obs.error({Status: 500, Message: 'Could not create upload url'})
                }
                obs.next({fileLocation: fileLoc, ...data});
                return obs.complete();
            });
        }).pipe(
            catchError(err => {
                if (err.Status && err.Message) {
                    return throwError(err);
                }
                this._logger.logError(err, 'Error getting presigned upload url');
                return throwError({Status: 500, Message: 'Could not register upload'});
            })
        );
    }

    getDownloadUrl(key: string): Observable<{Url: string}> {
        return Observable.create(obs => {
            this._s3.getSignedUrl('getObject', {
                Bucket: this._bucketName,
                Key: key,
                Expires: 6 * 60 * 60, // 6 hours
            }, (err, url) => {
                if (err) {
                    this._logger.logError(err);
                    return obs.error({Status: 400, Message: 'Could not get video Url'});
                }
                obs.next({Url: url});
                return obs.complete();
            });
        }) as Observable<{Url: string}>;
    }
}
