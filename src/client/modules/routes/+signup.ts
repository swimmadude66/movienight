import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {SharedModule} from '@modules/shared';
import {SignupComponent} from '@components/signup/component';

@NgModule({
    imports: [
        SharedModule,
        RouterModule.forChild(
            [
                {path: '', pathMatch: 'full', component: SignupComponent},
                {path: '**', redirectTo: '/'}
            ]
        )
    ],
    declarations: [
        SignupComponent
    ]
})
export class SignupLazyModule {}
