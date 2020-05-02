export interface TheatreInfo {
    TheatreId: string;
    Name: string;
    StartTime?: number; // utc timestamp in seconds of when playing began
    Host: string;
    Video?: VideoInfo;
    Access?: string; // random string to use as a "password"
    Active: boolean;
    Created?: Date|string;
}

export interface VideoInfo {
    VideoId: string;
    Title: string; // name of video OR filenamr
    Length: number; // length in seconds
    FileLocation: string; // location on disk/s3
    Format: string; // file type
    Owner?: string; // uploader
    Created?: Date|string;
}