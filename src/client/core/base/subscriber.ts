import {OnDestroy, Component} from '@angular/core';
import {Subscription} from 'rxjs';

// Base class for anything using subscriptions
@Component({
    selector: 'base-subscriber',
    template: ''
})
export class SubscriberComponent implements OnDestroy {

    private _subscriptions: Subscription[] = [];

    constructor() {}

    ngOnDestroy() {
        this.clearSubscriptions();
    }

    protected addSubscription(subscription: Subscription): void {
        this._subscriptions.push(subscription);
    }

    protected clearSubscriptions() {
        this._subscriptions.forEach(s => {
            if (s.unsubscribe) {
                s.unsubscribe();
            }
        });
        this._subscriptions = [];
    }
}
