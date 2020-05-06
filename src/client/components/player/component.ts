import { Component, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { Subscriber } from '@core';
import { VideoInfo } from '@models';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';

@Component({
    selector: 'video-player',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class VideoPlayerComponent extends Subscriber {

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
        this.videoSrc = this._sanitizer.bypassSecurityTrustResourceUrl(`/assets/videos/dance.mp4`);
        if (v['Poster']) {
            this.videoPoster = this._sanitizer.bypassSecurityTrustResourceUrl(v['Poster']);
        }
    }

    @Output('ready') ready: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output('resumed') resumed: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output('ended') ended: EventEmitter<boolean> = new EventEmitter<boolean>();

    videoSrc: SafeResourceUrl;
    videoPoster: SafeResourceUrl;

    muted: boolean = false;
    premuteVolume: number = 100;

    get video(): VideoInfo {
        return this._video;
    }

    private _player: HTMLVideoElement;
    private _playerContainer: HTMLDivElement;
    private _video: VideoInfo;

    private _ready: boolean = false;

    private _fullScreen: boolean = false;

    constructor(
        private _sanitizer: DomSanitizer
    ) {
        super();
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

    play() {
        if (this._player && this.videoSrc && this._ready) {
            this._player.play();
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
            console.log('using base functions');
            if (!!document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                this._playerContainer.requestFullscreen();
            }
        } else if (this._player['mozRequestFullScreen']) {
            console.log('using ff functions');

            // Firefox
            if (this._fullScreen) {
                document['mozCancelFullScreen']();
                this._fullScreen = false;
            } else {
                this._playerContainer['mozRequestFullScreen']();
                this._fullScreen = true;
            }
        } else if (this._player.webkitEnterFullscreen) {
            // in chrome
            console.log('using webkit functions');

            if (this._fullScreen) {
                document['webkitCancelFullScreen']();
                this._fullScreen = false;
            } else {
                this._playerContainer['webkitRequestFullScreen']();
                this._fullScreen = true;
                console.log(this._player.webkitDisplayingFullscreen)
            }
        }
    }

    videoReady() {
        this._ready = true;
        this.ready.emit(true);
    }

    videoEnded() {
        this.ended.emit(true);
    }

    playbackResumed() {
        this.resumed.emit(true);
    }

}
