import { UserRole } from './user';

export interface UserSession {
    UserId: number;
    Username: string;
    Role: UserRole;
    SessionKey: string;
    Expires: Date;
}

export interface SessionInfo {
    SessionKey: string;
    UserId: string;
    Expires: Date;
    UserAgent?: string;
    Created?: Date;
    LastUsed?: Date;
}
