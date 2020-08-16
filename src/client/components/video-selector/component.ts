import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { SubscriberComponent } from '@core';
import { VideoService, TheatreService, ToastService } from '@services';
import { TheatreInfo, VideoInfo } from '@models';

@Component({
    selector: 'video-selector',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class VideoSelectorComponent extends SubscriberComponent implements OnInit {

    @Input() theatreInfo: TheatreInfo;
    @Output() selectedVideo: EventEmitter<VideoInfo> = new EventEmitter<VideoInfo>();

    loading: boolean;
    videos: VideoInfo[] = [];

    constructor(
        private _video: VideoService,
        private _theatreService: TheatreService,
        private _toast: ToastService,
    ) {
        super();
    }

    ngOnInit() {
        this.getAvailableVideos();
    }

    getAvailableVideos() {
        if (this.loading) {
            return;
        }
        this.loading = true;
        this.addSubscription(
            this._video.getVideos()
            .subscribe(
                videos => {
                    this.videos = videos;
                    this.loading = false;
                },
                err => {
                    console.error(err);
                    this.videos = [];
                    this.loading = false;
                }
            )
        );
    }

    selectVideo(video: VideoInfo) {
        if (this.loading) {
            return;
        }
        this.loading = true;
        this.addSubscription(
            this._theatreService.changeVideo(
                this.theatreInfo.TheatreId,
                video
            ).subscribe(
                _ => {
                    this.selectedVideo.emit(video);
                    this._toast.success('Video changed');
                    this.loading = false;
                },
                err => {
                    console.error(err);
                    this._toast.error('Could not change video');
                    this.loading = false;
                }
            )
        )
    }
}
