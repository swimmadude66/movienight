import { Attribute, Output, EventEmitter, Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FileInfo } from '@models';
import { fromEvent } from 'rxjs';

@Component({
    selector: 'file-reader',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class FileReaderComponent implements OnInit {

    @Output('info') info: EventEmitter<FileInfo> = new EventEmitter<FileInfo>();

    @ViewChild('preview', {static: true}) set preview(p: ElementRef) {
        if (p) {
            if (p.nativeElement) {
                this._previewer = p.nativeElement as HTMLVideoElement;
            } else {
                this._previewer = p as any;
            }
        }
    }

    unsupportedBrowser: boolean = false;
    reading: boolean = false;
    progress: number = 0;
    error: string;

    private _previewer: HTMLVideoElement;
    private _file: FileInfo;
    private _currDuration: number;

    constructor(
        @Attribute('accepts') public accepts: string = '*'
    ) {
    }

    ngOnInit() {
        if (!window.File || !window.FileReader) {
            this.unsupportedBrowser = true;
        }
    }

    handleSelect(evt: InputEvent) {
        const files = (evt.target as HTMLInputElement).files;
        if (!files || !files.length) {
            return;
        }
        evt.stopPropagation();
        evt.preventDefault();
        const file = files[0];
        this.error = null;
        this._handleFile(file);
    }

    handleDragOver(evt: DragEvent) {
        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy';
    }

    private _handleFile(file: File) {
        if (this._previewer) {
            this._previewer.src = URL.createObjectURL(file);
        }
        this._previewer.onloadedmetadata = (evt) => {
            URL.revokeObjectURL(this._previewer.src);
            // console.log(evt);
            const duration = this._previewer.duration;
            // console.log('got duration', this._currDuration);
            this._file = {
                filename: file.name,
                filetype: file.type,
                file,
                duration: Math.floor(duration || 0)
            };
            this.info.emit(this._file);
        };
        // const reader = new FileReader();
        // reader.onerror = (e) => {
        //     console.error(e);
        //     switch(e.target.error.code) {
        //         case e.target.error.NOT_FOUND_ERR: {
        //           this.error = 'File Not Found';
        //           break;
        //         }
        //         case e.target.error['NOT_READABLE_ERR']: {
        //           this.error = 'Selected file is not readable';
        //           break;
        //         }
        //         case e.target.error.ABORT_ERR: {
        //           break; // noop
        //         }
        //         default: {
        //           this.error = 'An error occurred trying to read this file.';
        //         }
        //       };
        // };
        // reader.onabort = () => {
        //     this.error = 'File read cancelled';
        // };
        // reader.onloadstart = () => {
        //     this.progress = 0;
        //     this.reading = true;
        // };
        // reader.onprogress = (e: ProgressEvent) => {
        //     if (e.lengthComputable) {
        //         const percentLoaded = Math.floor((e.loaded / e.total) * 100);
        //         // Increase the progress bar length.
        //         this.progress = percentLoaded;
        //     }
        // };
        // reader.onload = (e) => {
        //     this.progress = 100;
        //     this.reading = false;
        //     this._file.dataUrl = e.target.result.toString();
        //     this.info.emit(this._file);
        // }
        // reader.readAsDataURL(file);
    }
}
