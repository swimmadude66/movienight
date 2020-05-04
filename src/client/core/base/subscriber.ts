import {OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs';

// Base class for anything using subscriptions
export class Subscriber implements OnDestroy {

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
