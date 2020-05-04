export interface TheatreInfo {
    TheatreId: string;
    Name: string;
    Host: string;
    Access: string; // random string to use as a "password"
    Video?: VideoInfo;
    StartTime?: number; // utc timestamp in seconds of when playing began

    // derived fields
    IsHost?: boolean;
}

export interface VideoInfo {
    VideoId: string;
    Title: string; // name of video OR filename
    Length: number; // length in seconds
    Format: string; // file type
    Owner?: string; // uploader
}