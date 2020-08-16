export interface VideoInfo {
    VideoId: string;
    Title: string; // name of video OR filenamr
    Length: number; // length in seconds
    FileLocation: string; // location on disk/s3
    Format: string; // file type
    Owner?: string; // uploader
    Created?: Date|string;
}
