import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { SubscriberComponent } from '@core';
import { VideoService } from '@services';
import { VideoInfo, FileInfo } from '@models';
import { switchMap, first, tap } from 'rxjs/operators';

@Component({
    selector: 'video-upload',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class VideoUploadComponent extends SubscriberComponent implements OnInit {

    @ViewChild('screen') set screen(s : ElementRef<HTMLVideoElement> | HTMLVideoElement) {
        if (s) {
            if (s['nativeElement']) {
                this._screen = s['nativeElement'];
            } else {
                this._screen = s as HTMLVideoElement;
            }
        }
    }

    loading: boolean;
    video: VideoInfo;
    videoPreview: SafeResourceUrl;

    videoControls = {
        title: new FormControl(null, [Validators.required]),
        length: new FormControl(null, [Validators.required]),
        file: new FormControl(null, [Validators.required])
    };

    videoForm = new FormGroup(this.videoControls);


    uploadProgress: number = 0;
    uploading: boolean = false;

    fileInfo: FileInfo;
    private _screen: HTMLVideoElement;

    constructor(
        private _video: VideoService,
        private _sanitizer: DomSanitizer
    ) {
        super();
    }

    ngOnInit() {
    }

    handleFileInfo(fileInfo: FileInfo) {
        console.log(fileInfo);
        this.fileInfo = fileInfo;
        this.videoControls.file.setValue(fileInfo.file);
        this.videoControls.length.setValue(fileInfo.duration);

        // this.videoPreview = this._sanitizer.bypassSecurityTrustResourceUrl(fileInfo.dataUrl);
    }

    // previewReady() {
    //     // get file info from player
    //     if (!this._screen) {
    //         console.error('no preview screen');
    //         return;
    //     }
    // }

    changeVideo() {
        this.fileInfo = null;
        this.videoControls.title.reset();
        this.videoForm.reset();
        this.videoPreview = null;
    }

    uploadVideo() {
        if (!this.videoForm.valid) {
            console.error(this.videoForm.errors);
            return;
        }
        if (!this.fileInfo) {
            console.error('could not read file');
            return;
        }
        this.loading = true;
        let _videoId: string;
        this.addSubscription(
            this._video.getUploadUrl(
                this.videoControls.title.value,
                this.fileInfo.filetype,
                this.videoControls.length.value,
                this.fileInfo.file.size,
                this.fileInfo.filename
            ).pipe(
                switchMap(
                    response => {
                        _videoId = response.VideoId;
                        const params = response.Upload;
                        return this._video.uploadVideo(params, this.fileInfo.file);
                    }
                ),
                tap(evt => {
                    if ('type' in evt) {
                        if (evt.type === 0) {
                            this.uploading = true;
                        } else if (evt.type === 1) {
                            this.uploadProgress = Math.ceil((evt.loaded / evt.size) * 100);
                        }
                    } else {
                        this.uploadProgress = 100;
                        this.uploading = false;
                    }
                }),
                first((evt: any) => ('ok' in evt) && evt.ok),
                switchMap(_ => this._video.completeUpload(_videoId))
            ).subscribe(
                _ => {
                    console.log('video uploaded');
                    this.loading = false;
                },
                err => {
                    console.error(err);
                    this.loading = false;
                }
            )
        );
    }
}
