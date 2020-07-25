import {Component, OnInit, ChangeDetectorRef} from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel } from '@angular/router';
import {distinctUntilChanged} from 'rxjs/operators';
import {Animations} from '@core/animations/';
import {SubscriberComponent} from '@core/base/subscriber';
import {Toast} from '@models/shared/toast';
import {ConnectionService, ToastService, WebviewService} from '@services/';

@Component({
    selector: 'app',
    templateUrl: 'template.html',
    styleUrls: ['./styles.scss'],
    animations: [
        Animations.slideInTop,
        Animations.toast
    ]
})
export class AppComponent extends SubscriberComponent implements OnInit {

    online: boolean = true; // default to true to avoid banner-flicker
    inWebView: boolean = false;
    toasts: Toast[] = [];
    navLoad: boolean;

    constructor(
        private _connection: ConnectionService,
        private _toast: ToastService,
        private _changeDetection: ChangeDetectorRef,
        private _webviewSerice: WebviewService,
        private _router: Router,
    ) {
        super();
    }

    ngOnInit() {
        this.inWebView = this._webviewSerice.isWebview();

        this.addSubscription(
            this._connection.observeOnline()
            .pipe(
                distinctUntilChanged()
            )
            .subscribe(
                isOnline => this.online = isOnline
            )
        );

        this.addSubscription(
            this._toast.observeToasts()
            .subscribe(
                t => {
                    const existing = this.toasts.findIndex(et => et.id === t.id);
                    if (existing < 0) {
                        if (this.toasts && this.toasts.length >= 3) {
                            this.toasts.shift();
                        }
                        this.toasts.push(t);
                        this._changeDetection.detectChanges();
                    }
                }
            )
        );

        this.addSubscription(
            this._router.events
            .subscribe(
                evt => {
                    if (evt instanceof NavigationStart) {
                        this.navLoad = true;
                    } else if (evt instanceof NavigationEnd) {
                        this.navLoad = false;
                    }
                }
            )
        );
    }

    reapToast(toastId: string, dismissed: boolean) {
        const burnt = this.toasts.findIndex(t => t.id === toastId);
        if (burnt >= 0){
            this.toasts.splice(burnt, 1);
            this._changeDetection.detectChanges();
        }
    }
}
