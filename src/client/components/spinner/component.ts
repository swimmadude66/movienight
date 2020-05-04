import { Component, Attribute } from '@angular/core';

@Component({
    selector: 'spinner',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class SpinnerComponent {

    color: 'main' | 'white' | 'black' = 'white';

    constructor(
        @Attribute('color') private _color: string = 'white'
    ) {
        if (!this._color || ['white', 'black', 'main'].indexOf(this._color) < 0) {
            this.color = 'white';
        } else {
            this.color = this._color as any;
        }
    }
}
