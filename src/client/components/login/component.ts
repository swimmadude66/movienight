import {Component} from '@angular/core';
import {FormGroup, Validators, FormControl} from '@angular/forms';
import {Router} from '@angular/router';
import {SubscriberComponent} from '@core/index';
import {AuthService} from '@services/index';

@Component({
    selector: 'login',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class LoginComponent extends SubscriberComponent {

    serverError: string;

    formControls = {
        username: new FormControl('', [Validators.required]),
        password: new FormControl('', [Validators.required])
    };

    form: FormGroup = new FormGroup(this.formControls);

    constructor(
        private _router: Router,
        private _auth: AuthService
    ) {
        super();
    }

    login(): void {
        this.serverError = null;
        if (!this.form.valid) {
            return;
        }
        this.addSubscription(
            this._auth.login(this.form.get('username').value, this.form.get('password').value)
            .subscribe(
                _ => {
                    this.form.reset();
                    this._router.navigate(['/']);
                },
                err => this.serverError = 'Could not login at this time'
            )
        );

    }

}
