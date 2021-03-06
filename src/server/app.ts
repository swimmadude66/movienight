import {join} from 'path';
import {createHmac} from 'crypto';
import {createServer} from 'http';
import {cpus} from 'os';
import * as cluster from 'cluster';
import * as spdy from 'spdy';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as compress from 'compression';
import * as express from 'express';
import * as morgan from 'morgan';
import * as dotenv from 'dotenv';
import * as userAgent from 'express-useragent';

import {Config} from './models/config';
import {DatabaseService} from './services/db';
import {SessionManager} from './services/session';
import {HelpersService} from './services/helpers';
import {LoggingService} from './services/logger';
import {AuthService} from './services/auth';
import { SocketStoreService } from './services/socket-store';
import { SocketService } from './services/sockets';

dotenv.config({silent: true});
const loggingService = new LoggingService();
const socketStore = new SocketStoreService();

const APP_CONFIG: Config = {
    environment: process.env.ENVIRONMENT || 'dev',
    cookie_name: process.env.COOKIE_NAME || '__mv_nt_local',
    cookie_secret: process.env.COOKIE_SECRET || 'cookie_secret',
    port: (+process.env.NODE_PORT) || 3000,
    log_level: process.env.MORGAN_LOG_LEVEL || 'short',
    client_root: process.env.CLIENT_ROOT || join(__dirname, '../client/'),
    max_workers: +(process.env.MAX_NODE_WORKERS || cpus().length),
    logger: loggingService,
    socketStore: socketStore,
};

if (cluster.isMaster) {
    const numCPUs = Math.max(2, Math.min(cpus().length, APP_CONFIG.max_workers));
    const workers: cluster.Worker[] = [];
    loggingService.log('[ master ]: App starting on port', APP_CONFIG.port);
    loggingService.log(`[ master ]: Spinning up ${numCPUs - 1} worker${numCPUs > 2 ? 's' : ''}`);
    for (let i=1; i < numCPUs; i++) {
        const worker = HelpersService.forkWorker();
        workers.push(worker);
    }

    cluster.on('listening', (worker) => {
        loggingService.log(`[ worker ${worker.id} ]: Ready and listening!`);
    });

    cluster.on('exit', (worker, code, signal) => {
        const deadIndex = workers.findIndex(w => w.id === worker.id);
        if (deadIndex >= 0) {
            workers.splice(deadIndex, 1);
        }
        if (!worker.exitedAfterDisconnect) {
            loggingService.log(`[ master ]: replacing crashed worker ${worker.id}`);
            const newWorker = HelpersService.forkWorker();
            workers.push(newWorker);
        }
    });

    process.on('exit', () => {
        loggingService.log('[ master ]: killing workers');
        workers.forEach((worker) => worker.kill());
    });

} else {
    const app = express();
    app.use(compress());
    app.use(userAgent.express());
    app.use(bodyParser.json({limit: '100mb'}));
    app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
    app.use(cookieParser(APP_CONFIG.cookie_secret));
    app.use(
        morgan(
            APP_CONFIG.log_level || ((tokens, req, res) => LoggingService.customLogger(tokens, req, res)),
            {
                stream: loggingService.logStream
            }
        )
    );

    // redirect http to https
    app.use(require('./middleware/httpredir')(APP_CONFIG));

    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        return next();
    });

    app.use((req, res, next) => {
        // Defeat the IE 11 cache without ruining PWA caching
        res.set('Expires', '0');
        return next();
    });

    let server;
    if (process.env.HTTPS) {
        let ssl_config = {
            key: (process.env.SSLKEY ? HelpersService.tryLoad(process.env.SSLKEY) : undefined),
            cert: (process.env.SSLCERT ? HelpersService.tryLoad(process.env.SSLCERT) : undefined),
            ca: (process.env.SSLCHAIN ? HelpersService.tryLoad(process.env.SSLCHAIN) : undefined),
            pfx: (process.env.SSLPFX ? HelpersService.tryLoad(process.env.SSLPFX) : undefined)
        };
        server = spdy.createServer(ssl_config, app);
        let redir = express();
        redir.get('*', (req, res, next) => {
        let httpshost = `https://${req.headers.host}${req.url}`;
        return res.redirect(httpshost);
        });
        redir.listen(80);
    } else {
        server = createServer(app);
    }

    /*-------- Services --------*/
    const db = new DatabaseService(
        {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            database: process.env.DB_DATABASE || 'movienight',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'admin',
            charset: 'utf8mb4' // allow emojis
        }
    );
    APP_CONFIG.db = db;
    const sessionManager = new SessionManager(db);
    APP_CONFIG.sessionManager = sessionManager;
    const authService = new AuthService(db, loggingService);
    APP_CONFIG.authService = authService;
    const socketService = new SocketService(
        server,
        socketStore,
        loggingService,
        process.env.REDIS_HOST || 'localhost',
        +(process.env.REDIS_PORT || 6379)
    );
    APP_CONFIG.socketService = socketService;

    app.use(require('./middleware/auth')(APP_CONFIG));

    /*-------- API --------*/
    app.use('/api', require('./routes/api')(APP_CONFIG));

    /*------- Angular client on Root ------- */
    app.use('/wb-assets/', express.static(join(APP_CONFIG.client_root, './wb-assets'), {maxAge: 0, setHeaders: HelpersService.changeContentType}));

    // Render static files
    app.get('*.*', express.static(APP_CONFIG.client_root, {maxAge: 0}));

    // Standard Client-side Angular as a fallback
    app.get('*', (req, res, next) => {
        if (!/\.html/i.test(req.path) && /\./i.test(req.path)) {
            return next();
        }
        return res.sendFile(join(APP_CONFIG.client_root, './index.html'));
    });

    app.all('*', (req, res) => {
        return res.status(404).send({Message: '404 UNKNOWN ROUTE'});
    });

    server.listen(APP_CONFIG.port);

    if (cluster.isMaster) {
        console.log('APP LISTENING ON PORT', APP_CONFIG.port);
    }
}
