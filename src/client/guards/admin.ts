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
} from '@angular/router';
import {Observable} from 'rxjs';
import {tap, map} from 'rxjs/operators';
import {AuthService} from '@services/';

@Injectable({
    providedIn: 'root'
})
export class IsAdminGuard implements CanLoad, CanActivate, CanActivateChild {
    loggedIn: boolean;

    constructor(
        private _router: Router,
        private _auth: AuthService
    ) {}

    canLoad(route: Route, segments: UrlSegment[]): Observable<boolean> {
        return this._isAdmin();
    }
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this._isAdmin();
    }
    canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this._isAdmin();
    }

    private _isAdmin(): Observable<boolean> {
        const target = location.pathname;
        const query = location.search || '';
        return this._auth.isLoggedIn()
        .pipe(
            tap(authState => {
                this.loggedIn = authState.Valid;
                if (!authState.Valid) {
                    this._auth.storeDeepLink(target, query);
                    return this._router.navigate(['/login']);
                }
                if (!authState.Admin) {
                    return this._router.navigate(['/']); // deny entry
                }
            }),
            map(authState => authState.Valid && authState.Admin)
        );
    }
}
