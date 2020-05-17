import { Component, Attribute, Input } from '@angular/core';

@Component({
    selector: 'spinner',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class SpinnerComponent {

    @Input('color') color: 'main' | 'white' | 'black' = 'white';

    constructor(
    ) {
    }
}
