import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject } from 'rxjs';
import { map, distinctUntilChanged, timeout, switchMap, first } from 'rxjs/operators';
import { HttpCacheService } from '@services/caching';
import { TheatreInfo, VideoInfo } from '@models/theatre';
import { SubscriberComponent } from '@core/';
import { SocketService } from '@services/socket/service';

@Injectable({
    providedIn: 'root'
})
export class TheatreService extends SubscriberComponent {

    private _socketId: string;

    private _theatreEvents: ReplaySubject<{key: string, data: any}> = new ReplaySubject<{key: string, data: any}>(10);

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

    observeEvents(): Observable<{key: string, data: any}> {
        return this._socket.observeSocketId()
        .pipe(
            first(sid => !!sid && sid.length > 0),
            switchMap(_ => this._theatreEvents)
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
        return this._socket.observeSocketId()
        .pipe(
            first(sid => !!sid && sid.length > 0),
            timeout(2000), // 2s timeout to get first connection
            switchMap(socketId =>
                this._http.post<{Theatre: TheatreInfo}>(
                    `/api/theatres/${theatreId}/join`,
                    {Access: access, SocketId: socketId}
                )
            ),
            map(res => res.Theatre)
        );
    }

    leaveTheatre(theatreId: string): Observable<any> {
        return this._http.delete(`/api/theatres/${theatreId}/leave`)
    }

    createTheatre(name: string): Observable<TheatreInfo> {
        this._cache.invalidateCache(`my_theatres`);
        return this._http.post<{Theatre: TheatreInfo}>('/api/theatres', {Name: name})
        .pipe(
            map(t => t.Theatre)
        );
    }

    changeVideo(theatreId: string, video: VideoInfo): Observable<any> {
        return this._http.post(
            `/api/theatres/${theatreId}/changevideo`,
            video
        );
    }

    startMovie(theatreId: string): Observable<any> {
        return this._http.post(`/api/theatres/${theatreId}/start`, {});
    }

    stopMovie(theatreId: string): Observable<any> {
        return this._http.post(`/api/theatres/${theatreId}/stop`, {});
    }

    private _initListener() {
        const theatreEvents = [
            'theatre_welcome',
            'video_changed',
            'start_playing',
            'stop_playing'
        ]
       this._pipeEvents(theatreEvents);
    }

    private _pipeEvents(keys: string[]) {
        keys.forEach(k => {
            this._socket.on(k, (data) => this._theatreEvents.next({key: k, data}));
        })
    }
}
