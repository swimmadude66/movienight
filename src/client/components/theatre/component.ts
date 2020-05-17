import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscriber } from '@core/';
import { TheatreInfo, FileInfo, VideoInfo } from '@models/';
import { TheatreService, VideoService, ToastService } from '@services/';
import { VideoPlayerComponent } from '@components/player/component';

@Component({
    selector: 'theatre',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class TheatreComponent extends Subscriber implements OnInit, OnDestroy {

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
    videoPreview: SafeResourceUrl;

    playing: boolean = false;
    ready: boolean = false;

    private _screen: VideoPlayerComponent;

    constructor(
        private _theatre: TheatreService,
        private _video: VideoService,
        private _toast: ToastService,
        private _route: ActivatedRoute,
        private _santizer: DomSanitizer
    ) {
        super();
    }

    ngOnInit() {
        console.log(this._route.snapshot.data);
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

    handleFileInfo(fileInfo: FileInfo) {
        console.log(fileInfo);
        this.videoPreview = this._santizer.bypassSecurityTrustResourceUrl(fileInfo.dataUrl);
    }

    getInviteLink(): string {
        if (!this.theatre.IsHost) {
            return;
        }
        return `${location.protocol}://${location.host}/theatres/${this.theatre.TheatreId}?a=${this.theatre.Access}`;
    }

    playMovie(seekTime: number) {
        // TODO:
        // - set a 2 second timeout/countdown?
        this._screen.seekTo(seekTime);
        this._screen.play();
        this.playing = true;
    }

    playerReady(ready: boolean) {
        this.ready = ready;
        if (ready && !this.playing) {
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
        this.playing = false;
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

    selectVideo(video: VideoInfo) {
        // TODO
        // open the video selection modal
    }

    setVideo() {
        // TODO
        // - Upload video
        // - preload video in to player
        // - fetch filetype and length
        // - allow setting of name
        // - attach to theatre
    }

    uploadVideo() {

    }

    private _handleTheatreEvent(event: {key: string, data: any}) {
        const now = new Date().valueOf();
        if (event.key === 'start_playing') {
            const startTime: number = event.data.StartTime;
            const seekTime = Math.floor(Math.max(0, now - startTime)/1000);
            this.playMovie(seekTime);
        } else if (event.key === 'theatre_welcome') {
            this._toast.info('Putting you in sync with the others...', 'Welcome!');
            console.log('got welcome', event);
            this.theatre = {...this.theatre, ...event.data};
            this._playWhenReady();
        } else if (event.key === 'stop_playing') {
            this._toast.info('Host has stopped the video', 'Video Stopped');
            this.theatre.StartTime = null;
            if (this._screen) {
                this._screen.stop();
            }
        }
    }

    private _playWhenReady() {
        if (this.theatre && this.theatre.StartTime && this.theatre.Video && this.ready) {
            const now = new Date().valueOf();
            const seekTime = Math.floor(Math.max(0, now - new Date(this.theatre.StartTime).valueOf())/1000);
            if (seekTime < this.theatre.Video.Length) {
                this.playMovie(seekTime);
            }
        }
    }
}
