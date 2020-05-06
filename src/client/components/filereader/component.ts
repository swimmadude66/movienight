import { Attribute, Output, EventEmitter, Component, OnInit } from '@angular/core';
import { FileInfo } from '@models';

@Component({
    selector: 'file-reader',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class FileReaderComponent implements OnInit {

    @Output('info') info: EventEmitter<FileInfo> = new EventEmitter<FileInfo>();

    unsupportedBrowser: boolean = false;
    reading: boolean = false;
    progress: number = 0;
    error: string;

    private _file: FileInfo;

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
        this._file = {
            filename: file.name,
            filetype: file.type,
            file,
        };
        const reader = new FileReader();
        reader.onerror = (e) => {
            console.error(e);
            switch(e.target.error.code) {
                case e.target.error.NOT_FOUND_ERR: {
                  this.error = 'File Not Found';
                  break;
                }
                case e.target.error['NOT_READABLE_ERR']: {
                  this.error = 'Selected file is not readable';
                  break;
                }
                case e.target.error.ABORT_ERR: {
                  break; // noop
                }
                default: {
                  this.error = 'An error occurred trying to read this file.';
                }
              };
        };
        reader.onabort = () => {
            this.error = 'File read cancelled';
        };
        reader.onloadstart = () => {
            this.progress = 0;
            this.reading = true;
        };
        reader.onprogress = (e: ProgressEvent) => {
            if (e.lengthComputable) {
                const percentLoaded = Math.floor((e.loaded / e.total) * 100);
                // Increase the progress bar length.
                this.progress = percentLoaded;
            }
        };
        reader.onload = (e) => {
            this.progress = 100;
            this.reading = false;
            this._file.dataUrl = e.target.result.toString();
            this.info.emit(this._file);
        }
        reader.readAsDataURL(file);
    }
}
