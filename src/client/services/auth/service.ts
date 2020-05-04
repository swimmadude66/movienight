import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, ReplaySubject} from 'rxjs';
import {tap, switchMap} from 'rxjs/operators';

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
        private _http: HttpClient
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

    observedLoggedIn(): Observable<AuthState> {
        return this.isLoggedIn()
        .pipe(
            switchMap(_ => this._authSubject)
        );
    }
}
