import { Observable, throwError, of } from 'rxjs';
import { map, switchMap, catchError, tap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid'
import { randomBytes } from 'crypto';
import { TheatreInfo, VideoInfo } from '../models/theatre';
import { DatabaseService } from './db';
import { SocketService, SocketNamespace } from './sockets';
import { LoggingService } from './logger';
import { SocketStoreService } from './socket-store';
import { RedisAdapter } from 'socket.io-redis';

export class TheatreService {

    private _io: SocketNamespace;

    constructor(
        private _db: DatabaseService,
        private _socket: SocketService,
        private _socketStore: SocketStoreService,
        private _logger: LoggingService
    ) {
        // this._io = this._socket.createNameSpace('/theatre');
        // this._initListener();
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

    joinTheatre(theatreId: string, access: string, userId: string, socketId: string): Observable<TheatreInfo> {
        // validate socket
        return this._socketStore.getSockets(userId)
        .pipe(
            switchMap(sockets => {
                if (!sockets || !sockets.length || sockets.indexOf(socketId) < 0) {
                    return throwError({Status: 400, Message: 'Invalid Credentials'});
                }
                return this.getTheatreInfo(theatreId, access)
            }),
            switchMap(theatre => {
                theatre.IsHost = theatre.Host === userId;
                return this._socket.remoteJoin(socketId, theatreId)
                .pipe(
                    map(_ => theatre)
                );
            }),
            tap(theatre => {
                delete theatre.IsHost;
                this._socket.sendEvent(socketId, 'theatre_welcome', theatre);
                this._socket.getRoomOccupants(theatreId)
                .subscribe(
                    occ => {
                        this._socket.sendEvent(theatreId, 'user_join', {UserCount: occ.length});
                    },
                    err => {
                        this._logger.logError(err);
                    }
                )
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
                const theatre = this._mapDBReponseToTheatre(results[0]);
                return of(theatre);
            })
        );
    }

    getOwnTheatres(hostId: string): Observable<TheatreInfo[]> {
        return this._db.query<(TheatreInfo&VideoInfo)[]>(
            'Select * from `theatres` t'
            + ' LEFT join `videos` v ON t.`VideoId` = v.`VideoId`'
            + ' WHERE t.`Active`=1 AND t.`Host`=?;',
            [hostId]
        ).pipe(
            catchError(err => {
                this._logger.logError(err);
                return throwError({Status: 500, Message: 'Could not lookup your theatres'});
            }),
            switchMap(results => {
                if (!results || results.length !== 1) {
                    return throwError({Status: 404, Message: 'Could not find theatre'});
                }
                const theatres = results.map(r => this._mapDBReponseToTheatre(r));
                return of(theatres);
            })
        );
    }

    // private _initListener() {
    //     this._io.on('connect', (socket) => {
    //         console.log('socket connected to theatre space', socket.id);
    //         socket.emit('id', socket.id);

    //         socket.on('reconnect_attempt', () => {
    //             socket['io'].opts.transports = ['websocket'];
    //         });

    //         socket.use((packet, next) => {
    //             this._socketStore.getUserBySocket(socket.id)
    //             .subscribe(
    //                 user => {
    //                     if (!user) {
    //                         return next(new Error('Unauthorized'));
    //                     }
    //                     return next();
    //                 },
    //                 err => {
    //                     this._logger.logError(err, 'Error verifying socket');
    //                     return next(new Error('Unauthorized'));
    //                 }
    //             );
    //         });
    //     });
    // }

    private _mapDBReponseToTheatre(theatreRow: TheatreInfo&VideoInfo): TheatreInfo {
        const theatre: TheatreInfo = {
            TheatreId: theatreRow.TheatreId,
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
        return theatre;
    }
}