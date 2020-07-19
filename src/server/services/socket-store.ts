import * as cluster from 'cluster';
import { Observable, of } from 'rxjs';

export interface SocketUser {
    userId: string;
    username: string
}

interface UserSocketMap {
    [userId: string]: string[];
}

interface SocketUserMap {
    [socketId: string]: SocketUser;
}

interface MapState {
    userSockets: UserSocketMap;
    socketUser: SocketUserMap;
}

export class SocketStoreService {

    private _userSockets: UserSocketMap =  {}; // map user to socket ids
    private _socketUser: SocketUserMap = {}; // map socketIds to user

    constructor () {
        if (cluster.isMaster) {
            cluster.on('message', (worker, message, handle) => {
                if (message && 'key' in message) {
                    switch (message.key) {
                        case 'connect': {
                            this._masterConnect(message.socketId, message.userId, message.username);
                            this._masterUpdateState();
                            break;
                        } case 'disconnectSocket': {
                            this._masterDisconnectSocket(message.socketId);
                            this._masterUpdateState();
                            break;
                        } case 'disconnectUser': {
                            this._masterDisconnectUser(message.userId);
                            this._masterUpdateState();
                            break;
                        } case 'getSockets': {
                            const state = this._masterGet();
                            worker.send({key: 'socketMaps', ...state});
                            break;
                        } default: {
                            break;
                        }
                    }
                }
            });
        } else {
            cluster.worker.on('message', (message, handle) => {
                if (message && 'key' in message) {
                    switch (message.key) {
                        case 'socketMaps': {
                            this._userSockets = {...(message as MapState).userSockets};
                            this._socketUser = {...(message as MapState).socketUser};
                            break;
                        } default: {
                            break;
                        }
                    }
                }
            });

            process.send({key: 'getSockets'}); // get initial state
        }
    }

    connect(socketId: string, userId: string, username) {
        if (cluster.isMaster) {
            this._masterConnect(socketId, userId, username);
        } else {
            this._workerConnect(socketId, userId, username);
        }
    }

    disconnectSocket(socketId: string) {
        if (cluster.isMaster) {
            this._masterDisconnectSocket(socketId);
        } else {
            this._workerDisconnectSocket(socketId);
        }
    }

    disconnectUser(userId: string) {
        if (cluster.isMaster) {
            this._masterDisconnectUser(userId);
        } else {
            this._workerDisconnectUser(userId);
        }
    }

    getSockets(userId: string): Observable<string[]> {
        return of(this._userSockets[userId] || []);
    }

    getUserBySocket(socketId: string): Observable<SocketUser> {
        return of(this._socketUser[socketId]); // userId or null
    }

    private _masterUpdateState(): void {
        const state = this._masterGet();
        Object.keys(cluster.workers).forEach(wid => {
            const w = cluster.workers[wid];
            w.send({key: 'socketMaps', ...state})
        })
    }

    private _masterGet(): MapState {
        return {
            userSockets: this._userSockets,
            socketUser: this._socketUser
        }
    }

    private _masterConnect(socketId: string, userId: string, username: string): void {
        this._socketUser[socketId] = {userId, username};
        const currentSockets = this._userSockets[userId] || [];
        if (!currentSockets.length || currentSockets.indexOf(socketId) < 0) {
            currentSockets.push(socketId);
            this._userSockets[userId] = currentSockets;
        }
    }

    private _masterDisconnectSocket(socketId: string) {
        const user = this._socketUser[socketId];
        delete this._socketUser[socketId];
        if (user && user.userId && user.userId.length) {
            const remainingSockets = (this._userSockets[user.userId] || [])
                .filter(s => s!== socketId);
            if (remainingSockets.length) {
                this._userSockets[user.userId] = remainingSockets;
            } else {
                delete this._userSockets[user.userId];
            }
        }
    }

    private _masterDisconnectUser(userId: string) {
        const sockets = this._userSockets[userId] || [];
        sockets.forEach(s => {
            this._masterDisconnectSocket(s);
        });
        delete this._userSockets[userId];
    }

    private _workerConnect(socketId: string, userId: string, username): void {
        process.send({key: 'connect', socketId, userId, username});
    }

    private _workerDisconnectSocket(socketId: string) {
        process.send({key: 'disconnectSocket', socketId});
    }

    private _workerDisconnectUser(userId: string) {
        process.send({key: 'disconnectUser', userId})
    }
}
