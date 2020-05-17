import { S3, AWSError } from 'aws-sdk';
import { v4 as uuid } from 'uuid';
import { DatabaseService } from './db';
import { LoggingService } from './logger';
import { VideoInfo } from '../models/theatre';
import { Observable, throwError, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';

export interface FileMetadata {
    FileSize: number;
    FileName: string;
}

export type UploadInfo = Partial<VideoInfo> & FileMetadata;

export class StorageService {

    private _s3: S3;

    constructor(
        private _logger: LoggingService,
        private _db: DatabaseService,
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

    createVideoUpload(ownerId: string, vidInfo: UploadInfo): Observable<{Upload: S3.PresignedPost, VideoId: string}> {
        const videoId = uuid();
        return Observable.create(obs => {
            this._s3.createPresignedPost({
                Bucket: this._bucketName,
                Fields: {
                    key: `videos/${videoId}`,
                    'Content-type': vidInfo.Format,
                    'Content-Length': vidInfo.FileSize,

                }
            }, (err, data) => {
                if (err) {
                    this._logger.logError(err);
                    return obs.error({Status: 500, Message: 'Could not create upload url'})
                }
                obs.next(data);
                return obs.complete();
            });
        }).pipe(
            switchMap(uploadInfo => {
                console.log('got upload info', uploadInfo);
                const exp = new Date(new Date().valueOf() + 60 * 60 * 1000); // 1 hr from now
                const q = 'Insert into `videos`'
                + ' (`VideoId`, `Title`, `Length`, `FileLocation`, `Format`, `Owner`, `Expires`, `Complete`)'
                + ' VALUES (?,?,?,?,?,?,?,0);';
                return this._db.query(
                    q,
                    [videoId, vidInfo.Title, vidInfo.Length, `s3:/${this._bucketName}/videos/${videoId}`, vidInfo.Format, ownerId, exp]
                ).pipe(
                    catchError(err => {
                        if (err.Status) {
                            return throwError(err);
                        }
                        this._logger.logError(err);
                        if (err.code) {
                            if (err.code === 'ER_DUP_ENTRY') {
                                return throwError({Status: 400, Message: 'Video with that title already exists'});
                            }
                        }
                        return throwError({Status: 500, Message: 'Could not save video'});
                    }),
                    map(_ => {
                        console.log('Created video record');
                        return {Upload: uploadInfo, VideoId: videoId};
                    })
                )
            })
        );
    }

    completeVideoUpload(ownerId: string, videoId: string): Observable<any> {
        const now = new Date();
        const q = 'Update `videos` SET `Complete`=1 '
        + ' WHERE `VideoId`=? AND `Owner`=? AND `Expires` >= ? LIMIT 1;';
        return this._db.query(q, [videoId, ownerId, now])
        .pipe(
            catchError(err => {
                this._logger.logError(err);
                return throwError({Status: 500, Message: 'Could not mark video upload as complete'});
            }),
            switchMap(result => {
                if (result.affectedRows !== 1) {
                    return throwError({Status: 400, Message: 'Video upload could not be marked as complete'});
                }
                return of({VideoId: videoId});
            })
        );
    }

    getVideoUrl(videoId: string): Observable<{Url: string}> {
        return this._getVideoInfo(videoId)
        .pipe(
            switchMap(vidInfo => {
                if (!vidInfo || !vidInfo.FileLocation || !/^s3:/.test(vidInfo.FileLocation)) {
                    return throwError({Status: 400, Message: 'Could not find video file'});
                }
                const cleanKey = vidInfo.FileLocation.replace(/^s3:\/(.+?)\//, '');
                return Observable.create(obs => {
                    this._s3.getSignedUrl('getObject', {
                        Bucket: this._bucketName,
                        Key: cleanKey
                    }, (err, url) => {
                        if (err) {
                            this._logger.logError(err);
                            return obs.error({Status: 400, Message: 'Could not get video Url'});
                        }
                        obs.next({Url: url});
                        return obs.complete();
                    });
                }) as Observable<{Url: string}>;;
            })
        );
    }

    private _getVideoInfo(videoId: string): Observable<VideoInfo> {
        const q = 'Select * from `videos` WHERE `Complete`=1 AND `VideoId`=? LIMIT 1;'
        return this._db.query<VideoInfo[]>(q, [videoId])
        .pipe(
            switchMap(results => {
                if (!results || results.length < 1) {
                    return throwError({Status: 404, Message: 'Video not found'});
                }
                return of(results[0]);
            })
        );
    }

}
