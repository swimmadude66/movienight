import {Component, OnInit} from '@angular/core';
import { FormGroup, AbstractControl, FormControl, Validators } from '@angular/forms';
import { distinctUntilChanged } from 'rxjs/operators';
import { SubscriberComponent } from '@core/';
import { AuthService, TheatreService } from '@services/';
import { TheatreInfo } from '@models/theatre';

@Component({
    selector: 'home',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class HomeComponent extends SubscriberComponent implements OnInit {

    isLoading: boolean = false;
    isAdmin: boolean = false;
    creating: boolean = false;

    theatres: TheatreInfo[] = [];

    formControls: {[controlName: string]: AbstractControl} = {
        Name: new FormControl('', [Validators.required])
        // leaving this in case we want more controls later
    };

    theatreForm: FormGroup = new FormGroup(this.formControls);

    constructor(
        private _auth: AuthService,
        private _theatre: TheatreService,
    ) {
        super();
    }

    ngOnInit() {
        this.addSubscription(
            this._auth.observedLoggedIn()
            .pipe(
                distinctUntilChanged((x,y) => x.Admin === y.Admin)
            )
            .subscribe(
                authState => {
                    this.isAdmin = authState.Admin;
                    if (authState.Admin) {
                        this.getTheatres();
                    }
                }
            )
        );
    }

    getTheatres() {
        this.addSubscription(
            this._theatre.getOwnedTheatres()
            .subscribe(
                theatres => this.theatres = theatres,
                err => console.error(err)
            )
        );
    }

    startCreate() {
        this.theatreForm.reset();
        this.creating = true;
    }

    submitCreate() {
        if (this.theatreForm.invalid) {
            return;
        }
        this.isLoading = true;
        const name = this.formControls.Name.value;
        this.addSubscription(
            this._theatre.createTheatre(name)
            .subscribe(
                theatre => {
                    this.theatres.push(theatre);
                    this.creating = false;
                    this.theatreForm.reset();
                    this.isLoading = false;
                },
                err => {
                    console.error(err);
                    this.isLoading = false;
                }
            )
        );
    }
}
