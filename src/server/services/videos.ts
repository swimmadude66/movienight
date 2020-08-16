import { v4 as uuid } from 'uuid';
import { Observable, throwError, of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { DatabaseService } from './db';
import { StorageService, UploadInfo } from './storage';
import { LoggingService } from './logger';
import { VideoInfo } from '../models/videos';
import { UploadParams } from '../models/storage';

export class VideosService {

    constructor(
        private _db: DatabaseService,
        private _storage: StorageService,
        private _logger: LoggingService
    ) {
    }

    getVideos(ownerId: string): Observable<VideoInfo[]> {
        const q = 'Select * from `videos` WHERE `Owner`=? AND `Complete`=1;'
        return this._db.query<VideoInfo[]>(q, [ownerId])
        .pipe(
            map(results => {
                return results || [];
            }),
            catchError(err => {
                if (err.Status && err.Message) {
                    return throwError(err);
                }
                this._logger.logError(err, 'Error getting presigned upload url');
                return throwError({Status: 500, Message: 'Could not register upload'});
            })
        );
    }

    createVideoUpload(ownerId: string, vidInfo: UploadInfo): Observable<{Upload: UploadParams, VideoId: string}> {
        const videoId = uuid();
        const uploadFields = {
            key: `videos/${videoId}`,
            'Content-Type': vidInfo.Format,
            'Content-Length': '' + vidInfo.FileSize,
        };
        return this._storage.getUploadUrl(uploadFields)
        .pipe(
            switchMap(uploadInfo => {
                const exp = new Date(new Date().valueOf() + 60 * 60 * 1000); // 1 hr from now
                const q = 'Insert into `videos`'
                + ' (`VideoId`, `Title`, `Length`, `FileLocation`, `Format`, `Owner`, `Expires`, `Complete`)'
                + ' VALUES (?,?,?,?,?,?,?,0);';
                return this._db.query(
                    q,
                    [videoId, vidInfo.Title, vidInfo.Length, uploadInfo.fileLocation, vidInfo.Format, ownerId, exp]
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
                return this._storage.getDownloadUrl(cleanKey);
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
            }),
            catchError(err => {
                if (err.Status && err.Message) {
                    return throwError(err);
                }
                this._logger.logError(err, 'Error getting presigned upload url');
                return throwError({Status: 500, Message: 'Could not register upload'});
            })
        );
    }
}
