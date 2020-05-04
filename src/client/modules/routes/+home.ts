import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {SharedModule} from '@modules/shared';
import { HomeComponent } from '@components';

@NgModule({
    imports: [
        SharedModule,
        RouterModule.forChild(
            [
                {path: '', pathMatch: 'full', component: HomeComponent},
                {path: '**', redirectTo: '/'}
            ]
        )
    ],
    declarations: [
        HomeComponent
    ]
})
export class HomeLazyModule {}
