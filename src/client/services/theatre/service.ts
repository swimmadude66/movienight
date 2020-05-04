import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { HttpCacheService } from '@services/caching';
import { TheatreInfo } from '@models/theatre';
import { Subscriber } from '@core/';
import { SocketService } from '@services/socket/service';

@Injectable({
    providedIn: 'root'
})
export class TheatreService extends Subscriber {

    private _socketId: string;

    constructor(
        private _http: HttpClient,
        private _cache: HttpCacheService,
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

    getOwnedTheatres(): Observable<TheatreInfo[]> {
        return this._cache.cacheRequest(
            `my_theatres`,
            this._http.get<{Theatres: TheatreInfo[]}>('/api/theatres'),
            {cacheTime: 30 * 1000}
        ).pipe(
            map(res => res.Theatres)
        );
    }

    joinTheatre(theatreId: string, access: string): Observable<TheatreInfo> {
        return this._http.post<{Theatre: TheatreInfo}>(
            `/api/theatres/join/${theatreId}`,
            {Access: access, SocketId: this._socketId}
        ).pipe(
            map(res => res.Theatre)
        );
    }

    createTheatre(name: string): Observable<TheatreInfo> {
        this._cache.invalidateCache(`my_theatres`);
        return this._http.post<{Theatre: TheatreInfo}>('/api/theatres', {Name: name})
        .pipe(
            map(t => t.Theatre)
        );
    }

    private _initListener() {
        this._socket.on('theatre_welcome', (data) => {
            console.log(data);
        });

        this._socket.on('user_join', (data) => {
            console.log(data);
        });
    }
}