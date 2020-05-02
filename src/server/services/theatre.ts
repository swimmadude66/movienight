import { Observable, throwError, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { v4 as uuid } from 'uuid'
import { randomBytes } from 'crypto';
import { TheatreInfo, VideoInfo } from '../models/theatre';
import { DatabaseService } from './db';
import { SocketService, SocketNamespace } from './sockets';
import { LoggingService } from './logger';
import { SocketStoreService } from './socket-store';

export class TheatreService {

    private _io: SocketNamespace;

    constructor(
        private _db: DatabaseService,
        private _socket: SocketService,
        private _socketStore: SocketStoreService,
        private _logger: LoggingService
    ) {
        this._io = this._socket.createNameSpace('/theatre');
        this._initListener();
    }

    createTheatre(name: string, userId: string): Observable<TheatreInfo> {
        const theatreId = uuid().replace(/\-/g, '');
        // poor mans b64url
        const access = randomBytes(12)
            .toString('base64')
            .replace('+', '-')
            .replace('/', '_')
            .replace(/=*$/g, '');
        return this._db.query(
            'Insert into `theatres`'
            + ' (`TheatreId`, `Access`, `Name`, `Host`)'
            + ' VALUES(?,?,?,?);',
            [theatreId, access, name, userId]
        ).pipe(
            catchError(err => {
                this._logger.logError(err);
                return throwError({Status: 500, Message: 'Could not create theatre'});
            }),
            map(_ => {
                const theatre: TheatreInfo = {
                    Active: true,
                    TheatreId: theatreId,
                    Host: userId,
                    Name: name,
                    Access: access,
                };
                return theatre;
            })
        );
    }

    getTheatreInfo(theatreId: string, access: string): Observable<TheatreInfo> {
        return this._db.query<(TheatreInfo&VideoInfo)[]>(
            'Select * from `theatres` t'
            + ' LEFT join `videos` v ON t.`VideoId` = v.`VideoId`'
            + ' WHERE t.`Active`=1 AND t.`TheatreId`=? AND t.`Access`=? LIMIT 1;',
            [theatreId, access]
        ).pipe(
            catchError(err => {
                this._logger.logError(err);
                return throwError({Status: 500, Message: 'Could not lookup theatre'});
            }),
            switchMap(results => {
                if (!results || results.length !== 1) {
                    return throwError({Status: 404, Message: 'Could not find theatre'});
                }
                const theatreRow = results[0];
                const theatre: TheatreInfo = {
                    TheatreId: theatreId,
                    Name: theatreRow.Name,
                    Host: theatreRow.Host,
                    Access: theatreRow.Access,
                    Active: true,
                    StartTime: theatreRow.StartTime
                };
                if (theatreRow.VideoId) {
                    const video: VideoInfo = {
                        VideoId: theatreRow.VideoId,
                        Title: theatreRow.Title,
                        FileLocation: theatreRow.FileLocation,
                        Format: theatreRow.Format,
                        Length: theatreRow.Length
                    };
                    theatre.Video = video;
                }
                return of(theatre);
            })
        );
    }

    private _initListener() {
        this._io.on('connect', (socket) => {
            console.log('socket connected to theatre space', socket.id);
            socket.emit('id', socket.id);

            socket.on('reconnect_attempt', () => {
                socket['io'].opts.transports = ['websocket'];
            });

            socket.use((packet, next) => {
                this._socketStore.getUserBySocket(socket.id)
                .subscribe(
                    user => {
                        if (!user) {
                            return next(new Error('Unauthorized'));
                        }
                        return next();
                    },
                    err => {
                        this._logger.logError(err, 'Error verifying socket');
                        return next(new Error('Unauthorized'));
                    }
                );
            });
        });
    }
}