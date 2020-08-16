import { VideoInfo } from './videos';

export interface TheatreInfo {
    TheatreId: string;
    Name: string;
    StartTime?: number; // utc timestamp in seconds of when playing began
    Host: string;
    Video?: VideoInfo;
    Access?: string; // random string to use as a "password"
    Active: boolean;
    Created?: Date|string;

    // derived fields
    IsHost?: boolean;
}
