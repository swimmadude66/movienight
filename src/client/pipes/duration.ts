import { PipeTransform, Pipe } from '@angular/core';

@Pipe({
    name: 'duration',
    pure: true
})
export class DurationPipe implements PipeTransform {

    transform(input: number | string) {
        let inputNum = +input;
        if (isNaN(inputNum)) {
            return input;
        }
        inputNum = Math.floor(inputNum);
        if (inputNum < 60) {
            return `00:${this.to2digits(inputNum)}`;
        }
        const minutes = Math.floor(inputNum / 60);
        const seconds = inputNum % 60;
        if (minutes < 60) {
            return `${this.to2digits(minutes)}:${this.to2digits(seconds)}`;
        }
        const hours = Math.floor(minutes / 60);
        return `${hours}:${this.to2digits(minutes % 60)}:${this.to2digits(seconds)}`;
    }

    private to2digits(num: number): string {
        const fullnum = '0' + Math.ceil(num);
        return fullnum.slice(fullnum.length - 2);
    }
}
