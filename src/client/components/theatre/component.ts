import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SubscriberComponent } from '@core/';
import { TheatreInfo, VideoInfo } from '@models/';
import { TheatreService, VideoService, ToastService } from '@services/';
import { VideoPlayerComponent } from '@components/player/component';

@Component({
    selector: 'theatre',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class TheatreComponent extends SubscriberComponent implements OnInit, OnDestroy {

    @ViewChild('screen') set screen(s : ElementRef<VideoPlayerComponent> | VideoPlayerComponent) {
        if (s) {
            if (s['nativeElement']) {
                this._screen = s['nativeElement'];
            } else {
                this._screen = s as VideoPlayerComponent;
            }
        }
    }

    video: VideoInfo;

    isLoading: boolean = false;
    theatre: TheatreInfo;
    isSelectingVideo: boolean = false;

    private _ready: boolean = false;

    private _screen: VideoPlayerComponent;

    constructor(
        private _theatre: TheatreService,
        private _video: VideoService,
        private _toast: ToastService,
        private _route: ActivatedRoute,
    ) {
        super();
    }

    ngOnInit() {
        this.theatre = this._route.snapshot.data.theatre;
        if (this.theatre) {
            if (this.theatre.Video && this.theatre.Video.VideoId) {
                this.addSubscription(
                    this._video.getVideoUrl(this.theatre.Video.VideoId)
                    .subscribe(
                        response => {
                            this.video = {
                                ...this.theatre.Video,
                                Url: response.Url
                            }
                        },
                        err => {
                            console.error(err);
                        }
                    )
                );
            }
            this.addSubscription(
                this._theatre.observeEvents()
                .subscribe(event => {
                    this._handleTheatreEvent(event);
                })
            );
        }

    }

    ngOnDestroy() {
        super.ngOnDestroy();
        this._theatre.leaveTheatre(this.theatre.TheatreId);
    }

    getInviteLink(): string {
        if (!this.theatre.IsHost) {
            return;
        }
        return `${location.protocol}://${location.host}/theatres/${this.theatre.TheatreId}?a=${this.theatre.Access}`;
    }

    playMovie() {
        // TODO:
        // - set a 2 second timeout/countdown?
        this._screen.play();
    }

    playerReady(ready: boolean) {
        this._ready = ready;
        if (ready && !this._screen.playing) {
            this._playWhenReady();
        }
    }

    // playerResumed(resumed: boolean) {
    //     if (resumed) {
    //         if (!this.playing) {
    //             this._playWhenReady();
    //         }
    //     } else {
    //         this.playing = false;
    //     }
    // }

    playerEnded() {
        console.log('video ended');
    }

    // Host events
    broadcastStart(video: VideoInfo) {
        this.addSubscription(
            this._theatre.startMovie(this.theatre.TheatreId)
            .subscribe(
                _ => _,
                err => {
                    console.error(err);
                    if (this._screen) {
                        this._screen.starting = false;
                    }
                }
            )
        );

    }

    broadcastStop(video: VideoInfo) {
        this.addSubscription(
            this._theatre.stopMovie(this.theatre.TheatreId)
            .subscribe(
                _ => _,
                err => {
                    console.error(err);
                    if (this._screen) {
                        this._screen.stopping = false;
                    }
                }
            )
        );
    }

    selectVideo(arg: any) {
        this.isSelectingVideo = true;
    }

    updateVideo(video: VideoInfo) {
        this.theatre.Video = video;

    }

    private _handleTheatreEvent(event: {key: string, data: any}) {
        if (event.key === 'start_playing') {
            this.theatre.StartTime = event.data.StartTime;
            if (this.theatre && this.theatre.Video && this._ready) {
                this._screen.play(event.data.StartTime)
            }
        } else if (event.key === 'theatre_welcome') {
            this._toast.info('Putting you in sync with the others...', 'Welcome!');
            this.theatre = {...this.theatre, ...event.data};
            this._playWhenReady();
        } else if (event.key === 'stop_playing') {
            this._toast.info('Host has stopped the video', 'Video Stopped');
            this.theatre.StartTime = null;
            if (this._screen) {
                this._screen.stop();
            }
        } else if (event.key === 'video_changed') {
            this.theatre.Video = event.data.Video;
            this.theatre.StartTime = null;
        }
    }

    private _playWhenReady() {
        if (this.theatre && this.theatre.StartTime && this.theatre.Video && this._ready) {
            this.playMovie();
        }
    }
}
