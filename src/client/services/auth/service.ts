import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, ReplaySubject} from 'rxjs';
import {tap, switchMap} from 'rxjs/operators';
import { BrowserStorageService } from '@services/caching';
import { Params } from '@angular/router';

export interface AuthState {
    Valid: boolean;
    Admin: boolean;
    Username?: string;
}

interface LoginResponse {
    Username: string;
    UserId: string;
    Admin: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private _authSubject: ReplaySubject<AuthState> = new ReplaySubject<AuthState>(1);

    constructor(
        private _http: HttpClient,
        private _store: BrowserStorageService
    ) {}

    login(username: string, password: string): Observable<LoginResponse> {
        return this._http.post<LoginResponse>('/api/auth/login', {Username: username, Password: password})
        .pipe(
            tap(res => this._authSubject.next({Valid: true, Admin: res.Admin, Username: res.Username}))
        );
    }

    signup(username: string, password: string): Observable<LoginResponse> {
        return this._http.post<void>('/api/auth/signup', {Username: username, Password: password})
        .pipe(
            switchMap(
                _ => this.login(username, password)
            ),
            tap(res => this._authSubject.next({Valid: true, Admin: res.Admin, Username: res.Username}))
        )
    }

    isLoggedIn(): Observable<AuthState> {
        return this._http.get<AuthState>('/api/auth/valid')
        .pipe(
            tap(response => this._authSubject.next(response))
        );
    }

    logOut(): Observable<any> {
        return this._http.post<void>('/api/auth/logout', {})
        .pipe(
            tap(_ => this._authSubject.next({Valid: false, Admin: false, Username: null}))
        );
    }

    storeDeepLink(path: string, queryString?: string) {
        let params = {};
        if (queryString && queryString.length) {
            if (queryString[0] === '?') {
                queryString = queryString.slice(1);
            }
            const paramParts = queryString.split('&').filter(p => !!p && p.length);
            params = paramParts.reduce((prev, curr) => {
                const kv = curr.split('=', 2);
                let key;
                let value;
                if (kv.length < 1) {
                    return prev;
                } 
                key = kv[0];
                if (kv.length === 1) {
                    value = true;
                } else {
                    value = kv[1];
                }
                if (!(key in prev)) {
                    prev[key] = value;
                } else {
                    if (!Array.isArray(prev[key])) {
                        prev[key] = [prev[key]];
                    }
                    prev[key].push(value);
                }
                return prev;
            }, {});
        }
        this._store.setSession('_deepLink', JSON.stringify({path, params}));
    }

    getDeepLink(): {path: string, params: Params} {
        const stored = this._store.getSession('_deepLink');
        if (!stored || !stored.length) {
            return {path: '/', params: {}};
        }
        try {
            return JSON.parse(stored);
        } catch (e) {
            return {path: '/', params: {}};
        }
    }

    clearDeepLink() {
        this._store.removeSession('_deepLink');
    }

    observedLoggedIn(): Observable<AuthState> {
        return this.isLoggedIn()
        .pipe(
            switchMap(_ => this._authSubject)
        );
    }
}
