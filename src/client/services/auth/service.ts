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

    login(email: string, password: string): Observable<any> {
        return this._http.post<void>('/api/auth/login', {Email: email, Password: password})
        .pipe(
            tap(_ => this._authSubject.next(true))
        );
    }

    signup(email: string, password: string): Observable<any> {
        return this._http.post<void>('/api/auth/signup', {Email: email, Password: password})
        .pipe(
            switchMap(
                _ => this.login(email, password)
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
