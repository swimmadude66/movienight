import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {SharedModule} from '@modules/shared';
import { VideoUploadComponent } from '@components';

@NgModule({
    imports: [
        SharedModule,
        RouterModule.forChild(
            [
                {path: 'upload', component: VideoUploadComponent},
                {path: '**', redirectTo: '/'}
            ]
        )
    ],
    declarations: [
        VideoUploadComponent
    ]
})
export class VideosLazyModule {}
