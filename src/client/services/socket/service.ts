import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import * as socketio from 'socket.io-client';
import { AuthService } from '@services/auth/service';
import { SubscriberComponent } from '@core';

@Injectable({
    providedIn: 'root'
})
export class SocketService extends SubscriberComponent implements OnDestroy {

    private _socket: SocketIOClient.Socket;
    private _socketIdSubject: BehaviorSubject<string> = new BehaviorSubject<string>(null);

    private _connecting: boolean;

    constructor(
        private _http: HttpClient,
        private _auth: AuthService,
    ) {
        super();
        this.addSubscription(
            this._auth.observedLoggedIn()
            .pipe(
                distinctUntilChanged()
            )
            .subscribe(
                authState => {
                    if (authState.Valid) {
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
        super.ngOnDestroy();
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

    emit(event: string, data: any): void {
        if (!this._socket) {
            return;
        }
        this._socket.emit(event, data);
    }

    getSocketId(): string {
        return this._socketIdSubject.value;
    }

    observeSocketId(): Observable<string> {
        return this._socketIdSubject;
    }

    private _connect(): void {
        if (this._connecting) {
            return;
        }
        this._connecting = true;
        if (this._socket) {
            this._connecting = false;
            return; // already connected
        }
        const socket = socketio({
            transports: ['websocket']
        });
        socket.once('connect', () => {
            this.addSubscription(
                this._http.post('/api/sockets/connect', {SocketId: socket.id})
                .subscribe(
                    _ => {
                        this._socket = socket;
                        this._socketIdSubject.next(socket.id);
                        this._connecting = false;
                    },
                    err => {
                        this._socket = null;
                        this._socketIdSubject.next(null);
                        this._connecting = false;
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
        this._socketIdSubject.next(null);
    }
}
