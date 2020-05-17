import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscriber } from '@core/';
import { TheatreService, VideoService } from '@services/';
import { TheatreInfo, FileInfo, VideoInfo } from '@models/';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { VideoPlayerComponent } from '@components/player/component';

@Component({
    selector: 'theatre',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class TheatreComponent extends Subscriber implements OnInit, OnDestroy {

    @ViewChild('screen') set screen(s /*: ElementRef<VideoPlayerComponent> | VideoPlayerComponent*/) {
        if (s) {
            if (s.nativeElement) {
                this._screen = s.nativeElement;
            } else {
                this._screen = s as VideoPlayerComponent;
            }
        }
    }

    video: VideoInfo;

    isLoading: boolean = false;
    theatre: TheatreInfo;
    videoPreview: SafeResourceUrl;

    playing: boolean;

    private _screen: VideoPlayerComponent;

    constructor(
        private _theatre: TheatreService,
        private _video: VideoService,
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

    setVideo() {
        // TODO
        // - Upload video
        // - preload video in to player
        // - fetch filetype and length
        // - allow setting of name
        // - attach to theatre
    }

    playMovie(seekTime: number) {
        // TODO:
        // - set a 2 second timeout/countdown?
        this._screen.seekTo(seekTime);
        this._screen.play();
        this.playing = true;
    }

    onJoin() {
        // TODO:
        // - get video info + server timestamp at request fill time
        // - preload ENTIRE file event: When file is `canPlayThrough`
        // - get video time by subtracting curr UTC timestamp from start time
        // - set video cursor to that point and play
    }

    changeVideo() {

    }

    uploadVideo() {

    }

    playerReady(ready: boolean) {
        if (ready && !this.playing) {
            this._playWhenReady();
        }
    }

    playerResumed(resumed: boolean) {
        if (resumed) {
            if (!this.playing) {
                this._playWhenReady();
            }
        } else {
            this.playing = false;
        }
    }

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
                }
            )
        );
    }

    selectVideo(video: VideoInfo) {
        // open the video selection modal
    }

    private _handleTheatreEvent(event: {key: string, data: any}) {
        const now = new Date().valueOf();
        if (event.key === 'start_playing') {
            const startTime: number = event.data.StartTime;
            const seekTime = Math.floor(Math.max(0, now - startTime)/1000);
            this.playMovie(seekTime);
        } else if (event.key === 'theatre_welcome') {
            this.theatre = {...this.theatre, ...event.data};
        } else if (event.key === 'stop_playing') {
            this.theatre.StartTime = null;
            if (this._screen) {
                this._screen.stop();
            }
        }
    }

    private _playWhenReady() {
        if (this.theatre && this.theatre.StartTime && this.theatre.Video) {
            const now = new Date().valueOf();
            const seekTime = Math.floor(Math.max(0, now - new Date(this.theatre.StartTime).valueOf())/1000);
            if (seekTime < this.theatre.Video.Length) {
                console.log('resuming movie at', seekTime);
                this.playMovie(seekTime);
            }
        }
    }
}
