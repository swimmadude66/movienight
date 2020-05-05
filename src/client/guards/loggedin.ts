import {Injectable} from '@angular/core';
import {
    CanLoad, 
    CanActivate, 
    CanActivateChild, 
    Router, 
    Route, 
    ActivatedRouteSnapshot, 
    RouterStateSnapshot,
    UrlSegment,
    Params
} from '@angular/router';
import {Observable} from 'rxjs';
import {tap, map} from 'rxjs/operators';
import {AuthService} from '@services/';

@Injectable({
    providedIn: 'root'
})
export class IsLoggedInGuard implements CanLoad, CanActivate, CanActivateChild {
    loggedIn: boolean;

    constructor(
        private _router: Router,
        private _auth: AuthService
    ) {}

    canLoad(route: Route, segments: UrlSegment[]): Observable<boolean> {
        return this._isLoggedIn();
    }
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this._isLoggedIn();
    }
    canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this._isLoggedIn();
    }

    private _isLoggedIn(): Observable<boolean> {
        const target = location.pathname;
        const query = location.search || '';
        return this._auth.isLoggedIn()
        .pipe(
            map(authState => authState.Valid),
            tap(isLoggedIn => {
                this.loggedIn = isLoggedIn;
                if (!isLoggedIn) {
                    this._auth.storeDeepLink(target, query);
                    return this._router.navigate(['/login']);
                }
            })
        );
    }
}
