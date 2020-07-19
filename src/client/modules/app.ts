import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {BrowserModule, BrowserTransferStateModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SharedModule} from '@modules/shared';
import {IsLoggedInGuard, NotLoggedInGuard, IsAdminGuard} from '@guards/'
import {AppComponent, AppHeaderComponent} from '@components/';

@NgModule({
    bootstrap: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        SharedModule,
        BrowserTransferStateModule,
        RouterModule.forRoot(
            [
                {path: 'login', canLoad: [NotLoggedInGuard], canActivateChild: [NotLoggedInGuard], loadChildren: './routes/+login#LoginLazyModule'},
                {path: 'signup', canLoad: [NotLoggedInGuard], canActivateChild: [NotLoggedInGuard], loadChildren: './routes/+signup#SignupLazyModule'},
                {path: 'theatres', canLoad: [IsLoggedInGuard], canActivateChild: [IsLoggedInGuard], loadChildren: './routes/+theatres#TheatresLazyModule'},
                {path: 'videos', canLoad: [IsAdminGuard], canActivateChild: [IsAdminGuard], loadChildren: './routes/+videos#VideosLazyModule'},
                {path: '', canLoad: [IsLoggedInGuard], canActivateChild: [IsLoggedInGuard], loadChildren: './routes/+home#HomeLazyModule'},
                {path: '**', redirectTo: '/'}
            ]
        )
    ],
    declarations: [
        AppComponent,
        AppHeaderComponent,
    ]
})
export class AppModule {}
