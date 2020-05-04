import {DatabaseService} from '../services/db';
import {SessionManager} from '../services/session';
import {LoggingService} from '../services/logger';
import {AuthService} from '../services/auth';
import { SocketStoreService } from '../services/socket-store';
import { SocketService } from '../services/sockets';

export interface Config {
    environment: string;
    cookie_name: string;
    cookie_secret: string;
    port: number;
    log_level: string;
    client_root: string;
    max_workers: number;
    // shared services
    logger: LoggingService;
    socketStore: SocketStoreService;
    // worker-only services
    db?: DatabaseService;
    sessionManager?: SessionManager;
    authService?: AuthService;
    socketService?: SocketService;
}
