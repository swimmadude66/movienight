import { Component, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { Subscription, timer, Subject } from 'rxjs';
import { SubscriberComponent } from '@core';
import { VideoInfo } from '@models';
import { takeWhile, debounceTime, distinctUntilChanged, throttleTime, debounce, tap } from 'rxjs/operators';
import { FormControl } from '@angular/forms';

@Component({
    selector: 'video-player',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class VideoPlayerComponent extends SubscriberComponent {

    @ViewChild('player') set player(p: ElementRef<HTMLVideoElement>) {
        if (p && p.nativeElement) {
            this._player = p.nativeElement;
        }
    }
    @ViewChild('playercontainer') set playercontainer(pc: ElementRef<HTMLDivElement>) {
        if (pc && pc.nativeElement) {
            this._playerContainer = pc.nativeElement;
        }
    }

    @Input('video') set video(v: VideoInfo) {
        this._video = v;
        this._ready = false;
        this.ready.emit(false);
        if (v) {
            if (v.Url) {
                this.loading = true;
                this.videoSrc = this._sanitizer.bypassSecurityTrustResourceUrl(v.Url);
            }
            if (v['Poster']) {
                this.videoPoster = this._sanitizer.bypassSecurityTrustResourceUrl(v['Poster']);
            }
        }
    }

    @Input('isHost') isHost: boolean = false;
    @Input('startTime') startTime: string | Date | number;

    @Output('ready') ready: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output('resumed') resumed: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output('ended') ended: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output('hostStart') hostStart: EventEmitter<VideoInfo> = new EventEmitter<VideoInfo>();
    @Output('hostStop') hostStop: EventEmitter<VideoInfo> = new EventEmitter<VideoInfo>();
    @Output('hostSelect') hostSelect: EventEmitter<VideoInfo> = new EventEmitter<VideoInfo>();

    volumeControl = new FormControl(100);

    videoSrc: SafeResourceUrl;
    videoPoster: SafeResourceUrl;

    muted: boolean = false;
    premuteVolume: number = 100;

    currTime: number = 0;
    length: number = 0; // duration, but shadows pipe name
    percentPlayed: number = 0;

    starting: boolean;
    stopping: boolean;
    playing: boolean;
    loading: boolean;

    private _ended: boolean = false;

    get video(): VideoInfo {
        return this._video;
    }

    fullscreen: boolean = false;
    showControls: boolean = false;
    interactionRequired: boolean = false;

    private _player: HTMLVideoElement;
    private _playerContainer: HTMLDivElement;
    private _video: VideoInfo;

    private _progressSub: Subscription;

    private _ready: boolean = false;

    private _mouseSubject: Subject<any> = new Subject<any>();

    constructor(
        private _sanitizer: DomSanitizer
    ) {
        super();

        document.onfullscreenchange = (evt) => {
            this.fullscreen = !!document.fullscreenElement;
        }

        this.addSubscription(
            this.volumeControl.valueChanges
            .pipe(
                debounceTime(100),
                distinctUntilChanged()
            )
            .subscribe(
                val => {
                    this.setVolume(val / 100);
                }
            )
        );

        this.addSubscription(
            this._mouseSubject
            .pipe(
                tap(_ => this.showControls = true),
                debounceTime(1500)
            ).subscribe(
                _ => this.showControls = false
            )
        );
    }

    mouseMove(evt) {
        this._mouseSubject.next(evt);
    }

    getCurrentTime(): number {
        if (this._player) {
            return this._player.currentTime;
        }
    }

    seekTo(seconds: number) {
        if (seconds < 0) {
            return;
        }
        if (this._player) {
            if (this._player.duration > seconds) {
                this._player.currentTime = seconds;
            }
        }
    }

    play(startTime?: string | number | Date) {
        if (this._player && this.videoSrc && this._ready) {
            const now = new Date().valueOf();
            const start = startTime || this.startTime;
            if (!start) {
                return; // no known start time
            }
            const seekTime = Math.floor(Math.max(0, now - new Date(start).valueOf())/1000);
            if (seekTime > this.video.Length) {
                return; // movie is over
            }
            this.seekTo(seekTime);
            this._player.play()
            .then(
                _ => {
                    this._ended = false;
                    this.playing = true;
                    this.starting = false;
                    this.interactionRequired = false;
                    this._progressSub = timer(0, 50)
                    .pipe(
                        takeWhile(_ => !this._ended)
                    ).subscribe(
                        _ => {
                            this.currTime = this.getCurrentTime();
                            this.percentPlayed = Math.floor((this.currTime / this.length) * 100);
                        }
                    )
                },
                err => this.interactionRequired = true
            );
        }
    }

    stop() {
        if (this._player) {
            this._player.pause();
            this._player.currentTime = 0;
            this.currTime = 0;
            this.percentPlayed = 0;
            this._ended = true;
            this.playing = false;
            this.stopping = false;
            this._cancelProgress();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
    }

    setVolume(volume: number) {
        this._player.volume = volume;
    }

    goFullScreen() {
        if (!this._player || !this._playerContainer) {
            console.log('no player found');
            return;
        }
        if (document.fullscreenEnabled) {
            if (!!document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                this._playerContainer.requestFullscreen();
            }
        }
        //  else if (this._player['mozRequestFullScreen']) {
        //     console.log('using ff functions');

        //     // Firefox
        //     if (this._fullScreen) {
        //         document['mozCancelFullScreen']();
        //         this._fullScreen = false;
        //     } else {
        //         this._playerContainer['mozRequestFullScreen']();
        //         this._fullScreen = true;
        //     }
        // } else if (this._player.webkitEnterFullscreen) {
        //     // in chrome
        //     console.log('using webkit functions');

        //     if (this._fullScreen) {
        //         document['webkitCancelFullScreen']();
        //         this._fullScreen = false;
        //     } else {
        //         this._playerContainer['webkitRequestFullScreen']();
        //         this._fullScreen = true;
        //         console.log(this._player.webkitDisplayingFullscreen)
        //     }
        // }
    }

    videoReady() {
        this._ready = true;
        this.ready.emit(true);
        this.loading = false;

        this.length = this._player.duration;
    }

    videoEnded() {
        this.playing = false;
        this._ended = true;
        this.percentPlayed = 100;
        this.ended.emit(true);
    }

    playerWaiting() {
        this.resumed.emit(false);
        this.playing = false;
    }

    playbackResumed() {
        this.resumed.emit(true);
        this._cancelProgress();
        this._progressSub = timer(0, 50)
        .pipe(
            takeWhile(_ => !this._ended)
        ).subscribe(
            _ => {
                this.currTime = this.getCurrentTime();
                this.percentPlayed = Math.floor((this.currTime / this.length) * 100);
            }
        )
    }

    // Host-only controls
    startVideo() {
        this.starting = true;
        this.hostStart.emit(this.video);
    }

    stopVideo() {
        this.stopping = true;
        this.hostStop.emit(this.video);
    }

    selectVideo() {
        this.hostSelect.emit(this.video);
    }

    private _cancelProgress() {
        if (this._progressSub) {
            try {
                this._progressSub.unsubscribe();
                this._progressSub = null;
            } catch (e) {
                // do nothing
            }
        }
    }

}
