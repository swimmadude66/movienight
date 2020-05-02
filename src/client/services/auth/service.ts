import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, ReplaySubject} from 'rxjs';
import {tap, switchMap} from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private _authSubject: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);

    constructor(
        private _http: HttpClient
    ) {}

    login(username: string, password: string): Observable<any> {
        return this._http.post<void>('/api/auth/login', {Username: username, Password: password})
        .pipe(
            tap(_ => this._authSubject.next(true))
        );
    }

    signup(username: string, password: string): Observable<any> {
        return this._http.post<void>('/api/auth/signup', {Username: username, Password: password})
        .pipe(
            switchMap(
                _ => this.login(username, password)
            ),
            tap(_ => this._authSubject.next(true))
        )
    }


    isLoggedIn(): Observable<boolean> {
        return this._http.get<boolean>('/api/auth/valid')
        .pipe(
            tap(valid => this._authSubject.next(valid))
        );
    }

    logOut(): Observable<any> {
        return this._http.post<void>('/api/auth/logout', {})
        .pipe(
            tap(_ => this._authSubject.next(true))
        );
    }

    observedLoggedIn(): Observable<boolean> {
        return this.isLoggedIn()
        .pipe(
            switchMap(_ => this._authSubject)
        );
    }
}
