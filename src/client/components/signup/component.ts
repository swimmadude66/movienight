import {Component} from '@angular/core';
import {FormBuilder, FormGroup, Validators, FormControl} from '@angular/forms';
import {Router} from '@angular/router';
import {Subscriber, PasswordValidation} from '@core/';
import {AuthService} from '@services/';

@Component({
    selector: 'signup',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class SignupComponent extends Subscriber {

    form: FormGroup;
    error: string;

    formControls = {
        username: new FormControl('', [Validators.required]),
        password: new FormControl('', [Validators.required]),
        confirmPassword: new FormControl('', [Validators.required])
    };

    constructor(
        private _fb: FormBuilder,
        private _router: Router,
        private _auth: AuthService
    ) {
        super();
        this.form = this._fb.group(this.formControls,
        {
            validator: PasswordValidation.matchPassword
        });
    }

    signup(): void {
        this.error = null;
        if (!this.form.valid) {
            return;
        }
        this.addSubscription(
            this._auth.signup(this.form.get('username').value, this.form.get('password').value)
            .subscribe(
                _ => {
                    this.form.reset();
                    const next = this._auth.getDeepLink();
                    if (next) {
                        this._auth.clearDeepLink()
                        this._router.navigate([next.path], {queryParams: next.params});
                    } else {
                        this._router.navigate(['/']);
                    }
                },
                err => this.error = 'Could not signup at this time'
            )
        );

    }

}
