import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
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
export class TheatreComponent extends Subscriber implements OnInit {

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
        if (this.theatre && this.theatre.Video && this.theatre.Video.VideoId) {
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

    playMovie() {
        // TODO:
        // - wait until video is fully preloaded
        // - set a 2 second timeout
        // - send Play event to server with current browser UTC timestamp
        this._screen.play();
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
        console.log('player ready', ready);
    }

    playerResumed() {
        console.log('player resumed');
    }

    playerEnded() {
        console.log('video ended');
    }
}
