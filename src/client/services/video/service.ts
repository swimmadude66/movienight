import { HttpClient, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpCacheService } from '@services/caching';
import { Observable } from 'rxjs';
import { VideoInfo } from '@models';

export interface UploadParams {
    url: string;
    fields: {[fieldname: string]: string}
}

@Injectable({
    providedIn: 'root'
})
export class VideoService {

    constructor(
        private _http: HttpClient,
        private _cache: HttpCacheService,
    ) {

    }

    getUploadUrl(title: string, format: string, length: number, size: number, name: string): Observable<{VideoId: string, Upload: UploadParams}> {
        return this._http.post<{VideoId: string, Upload: UploadParams}>(
            `/api/videos/`,
            {Title: title, Format: format, Length: length, FileSize: size, FileName: name}
        );
    }

    getVideoUrl(videoId: string): Observable<{Url: string}> {
        return this._cache.cacheRequest(
            `video_url_${videoId}`,
            this._http.get<{Url: string}>(`/api/videos/${videoId}`),
            {cacheTime: 1 * 60 * 1000} // 1 min
        );
    }

    uploadVideo(params: UploadParams, file: File): Observable<any> {
        const formData = new FormData();
        Object.keys((params.fields || {}))
        .forEach(f => {
            formData.append(f, params.fields[f]);
        });
        formData.append('file', file, file.name);
        return this._http.post<any>(params.url, formData, {
            observe: 'events',
            reportProgress: true,
        });
    }
}
