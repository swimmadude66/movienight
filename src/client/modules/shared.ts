import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {ShortenTextPipe, FloorNumberPipe} from '@pipes/';
import {AltTextDirective, ExternalLinkDirective} from '@directives/';
import {InputGroupComponent, ToastComponent, SpinnerComponent, LoadingSpinnerComponent, FileReaderComponent} from '@components/';

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
        AltTextDirective,
        ExternalLinkDirective,
        SpinnerComponent,
        LoadingSpinnerComponent,
        FileReaderComponent,
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
        AltTextDirective,
        ExternalLinkDirective,
        SpinnerComponent,
        LoadingSpinnerComponent,
        FileReaderComponent,
    ]
})
export class SharedModule {}
