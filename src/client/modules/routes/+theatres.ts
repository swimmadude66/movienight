import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {SharedModule} from '@modules/shared';
import { TheatreComponent, VideoPlayerComponent, ChatComponent, VideoSelectorComponent } from '@components';
import { TheatreResolver } from '@resolvers';

@NgModule({
    imports: [
        SharedModule,
        RouterModule.forChild(
            [
                {path: ':theatreId', resolve: {theatre: TheatreResolver}, component: TheatreComponent},
                {path: '**', redirectTo: '/'}
            ]
        )
    ],
    declarations: [
        TheatreComponent,
        VideoPlayerComponent,
        ChatComponent,
        VideoSelectorComponent,
    ]
})
export class TheatresLazyModule {}
