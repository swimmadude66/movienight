import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {ShortenTextPipe, FloorNumberPipe, DurationPipe} from '@pipes/';
import {AltTextDirective, ExternalLinkDirective} from '@directives/';
import {InputGroupComponent, ToastComponent, SpinnerComponent, LoadingSpinnerComponent, FileReaderComponent} from '@components/';
import { SubscriberComponent } from '@core';

@NgModule({
    imports:[
        RouterModule,
        CommonModule,
        ReactiveFormsModule,
        HttpClientModule,
    ],
    declarations: [
        InputGroupComponent,
        ToastComponent,
        ShortenTextPipe,
        FloorNumberPipe,
        DurationPipe,
        AltTextDirective,
        ExternalLinkDirective,
        SpinnerComponent,
        LoadingSpinnerComponent,
        FileReaderComponent,
        SubscriberComponent,
    ],
    exports: [
        //imports
        RouterModule,
        CommonModule,
        ReactiveFormsModule,
        HttpClientModule,
        // declarations
        InputGroupComponent,
        ToastComponent,
        ShortenTextPipe,
        FloorNumberPipe,
        DurationPipe,
        AltTextDirective,
        ExternalLinkDirective,
        SpinnerComponent,
        LoadingSpinnerComponent,
        FileReaderComponent,
        SubscriberComponent,
    ]
})
export class SharedModule {}
