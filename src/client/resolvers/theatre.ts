import { Injectable } from '@angular/core';
import { Resolve, Router, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, empty } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TheatreService, AuthService } from '@services';
import { TheatreInfo } from '@models/theatre';

@Injectable({
    providedIn: 'root'
})
export class TheatreResolver implements Resolve<TheatreInfo> {

    constructor(
        private _router: Router,
        private _theatre: TheatreService,
        private _auth: AuthService
    ) {}

    resolve(route: ActivatedRouteSnapshot): Observable<TheatreInfo> {
        const theatreId = route.paramMap.get('theatreId');
        const access = route.queryParamMap.get('a');
        if (!theatreId || !access || !theatreId.length || !access.length) {
            this._router.navigate(['/']); // invalid invite link
            return empty();
        }
        return this._auth.isLoggedIn()
        .pipe(
            switchMap(
                authState => {
                    if (!authState.Valid) {
                        this._router.navigate(['/login']); // not logged in
                        return empty();
                    } else {
                        return this._theatre.joinTheatre(theatreId, access)
                    }
                }
            )
        );
    }
}
