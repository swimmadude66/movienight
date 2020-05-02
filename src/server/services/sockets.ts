import * as socketio from 'socket.io';
import * as socketRedis from 'socket.io-redis';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Server } from 'http';
import { SocketStoreService } from './socket-store';
import { LoggingService } from './logger';

type SocketServer = socketio.Server;
type RedisAdapter = socketRedis.RedisAdapter;

export class SocketService {

    private _io: SocketServer;

    constructor(
        server: Server,
        private _socketStore: SocketStoreService,
        private _logger: LoggingService,
        redisHost: string = 'localhost',
        redisPort: number = 6379
    ) {
        this._io = socketio(server, {
            adapter: socketRedis({host: redisHost, port: redisPort}),
            transports: ['websocket'],
            cookie: false
        });
        this._initListener();
    }

    isValidSocket(socketId: string): Observable<boolean> {
        return this._getAllSocketIds()
        .pipe(
            map(clients => clients.indexOf(socketId) >= 0)
        );
    }

    sendEvent(target: string, event: string, data?: any): void {
        this._io.to(target).emit(event, data);
    }

    disconnectSocket(socketId: string): Observable<any> {
        return Observable.create(obs => {
            (this._io.of('/').adapter as RedisAdapter).remoteDisconnect(
                socketId, 
                true, 
                (err) => {
                    if (err) {
                        return obs.error({Status: 400, Message: 'Unknown socket'})
                    }
                    obs.next(true);
                    return obs.complete();
                }
            );
        })
    }

    private _initListener() {
        this._io.on('connect', (socket) => {
            console.log('socket connected', socket.id);
            socket.emit('id', socket.id);

            socket.on('reconnect_attempt', () => {
                socket['io'].opts.transports = ['websocket'];
            });

            socket.on('disconnect', () => {
                this._socketStore.disconnectSocket(socket.id);
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

    private _getAllSocketIds(): Observable<string[]> {
        return Observable.create(obs => {
            this._io.clients((err, clients) => {
                if (err) {
                    this._logger.logError(err);
                    return obs.error({Status: 500, Message: 'Could not get clients'});
                }
                obs.next(clients);
                return obs.complete();
            });
        });
    }
}