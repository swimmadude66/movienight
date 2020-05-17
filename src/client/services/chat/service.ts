import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject } from 'rxjs';
import { map, distinctUntilChanged, switchMap, first } from 'rxjs/operators';
import { HttpCacheService } from '@services/caching';
import { Subscriber } from '@core/';
import { SocketService } from '@services/socket/service';
import { ChatMessage } from '@models';

@Injectable({
    providedIn: 'root'
})
export class ChatService extends Subscriber {

    private _socketId: string;
    private _messageSubject: ReplaySubject<ChatMessage> = new ReplaySubject<ChatMessage>(25);

    constructor(
        // private _http: HttpClient,
        // private _cache: HttpCacheService,
        private _socket: SocketService
    ) {
        super();

        this.addSubscription(
            this._socket.observeSocketId()
            .pipe(
                distinctUntilChanged()
            )
            .subscribe(
                id => {
                    this._socketId = id;
                    if (id && id.length) {
                        this._initListener();
                    }
                }
            )
        );
    }

    observeMessages(): Observable<ChatMessage> {
        return this._socket.observeSocketId()
        .pipe(
            first(sid => !!sid && sid.length > 0),
            switchMap(_ => this._messageSubject)
        );
    }

    sendMessage(message: string, theatreId: string) {
        if (this._socketId) {
            this._socket.emit('chat', {Message: message, TheatreId: theatreId});
        }
    }

    private _initListener() {
        this._socket.on('chat_message', (data) => {
            this._messageSubject.next({key: 'chat_message', ...data});
        })
    }
}