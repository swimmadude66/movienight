import {Component, OnInit} from '@angular/core'
import { Router } from '@angular/router';
import { Subscriber } from '@core/base/subscriber';
import { AuthService } from '@services/auth/service';

@Component({
    selector: 'app-header',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class AppHeaderComponent extends Subscriber implements OnInit{

    isLoggedIn: boolean = false;
    isAdmin: boolean = false;
    username: string;

    constructor(
        private _auth: AuthService,
        private _router: Router
    ) {
        super();
    }

    ngOnInit() {
        this.addSubscription(
            this._auth.observedLoggedIn()
            .subscribe(
                res => {
                    this.isLoggedIn = res.Valid;
                    this.isAdmin = res.Admin;
                    this.username = res.Username;
                }
            )
        );
    }

    logOut() {
        this.addSubscription(
            this._auth.logOut()
            .subscribe(
                _ => this._router.navigate(['/login']),
                err => this._router.navigate(['/login']),
            )
        );
    }
}