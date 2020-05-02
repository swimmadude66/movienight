import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription, BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import * as socketio from 'socket.io-client';
import { AuthService } from '@services/auth/service';
import { ToastService } from '@services/toasts/service';

@Injectable({
    providedIn: 'root'
})
export class SocketService implements OnDestroy {
 
    private _subscriptions: Subscription[] = [];
    private _socket: SocketIOClient.Socket;
    private _connected: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    constructor(
        private _http: HttpClient,
        private _auth: AuthService,

        private _toast: ToastService,
    ) {
        this._addSubscription(
            this._auth.observedLoggedIn()
            .pipe(
                distinctUntilChanged()
            )
            .subscribe(
                isLoggedIn => {
                    if (isLoggedIn) {
                        // connect to socket
                        this._connect();
                    } else {
                        // disconnect from socket if present
                        this._disconnect();
                    }
                }
            )
        );
    }

    ngOnDestroy() {
        this._subscriptions.forEach(s => {
            if (s && s.unsubscribe) {
                try {
                    s.unsubscribe();
                } catch (e) {
                    // do nothing
                }
            }
        });

        this._disconnect();
    }

    on(event: string, handler: (...data: any[]) => void): void {
        if (!this._socket) {
            return;
        }
        this._socket.on(event, handler);
    }

    once(event: string, handler: (...data: any[]) => void): void {
        if (!this._socket) {
            return;
        }
        this._socket.once(event, handler);
    }

    off(event: string, handler?: Function): void {
        if (!this._socket) {
            return;
        }
        this._socket.off(event, handler);
    }

    observeConnected(): Observable<boolean> {
        return this._connected;
    }

    private _connect(): void {
        if (this._socket) {
            return; // already connected
        }
        const socket = socketio({
            transports: ['websocket']
        });
        socket.once('id', (socketId) => {
            this._addSubscription(
                this._http.post('/api/notifications/connect', {socketId: socketId})
                .subscribe(
                    _ => {
                        this._socket = socket;
                        this._connected.next(true);
                        this._socket.on('message', (data) => {
                            console.log('message received!', data);
                            this._toast.success(data.Message);
                        });
                    },
                    err => {
                        console.error(err);
                    }
                )
            );
        });        
    }

    private _disconnect(): void {
        if (!this._socket) {
            return; // no socket to disconnect
        }
        this._socket.removeAllListeners();
        this._socket.close();
        this._socket = null;
        this._connected.next(false);
    }

    private _addSubscription(sub: Subscription) {
        this._subscriptions.push(sub);
    }
}