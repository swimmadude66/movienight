import {Router} from 'express';
import { Config } from '../models/config';
import { TheatreService } from '../services/theatre';
import { switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { VideoInfo } from '../models/theatre';

module.exports = (APP_CONFIG: Config) => {
    const router = Router();
    const logger = APP_CONFIG.logger;
    const theatreService = new TheatreService(
        APP_CONFIG.db,
        APP_CONFIG.socketService,
        APP_CONFIG.socketStore,
        logger
    );

    router.get('/:theatreId', (req, res) => {
        const theatreId = req.params.theatreId;
        const access = req.query.a as string;
        if (!access) {
            return res.status(404).send({Error: 'Theatre not found'});
        }
        theatreService.getTheatreInfo(theatreId, access)
        .subscribe(
            theatre => {
                return res.send({Theatre: theatre});
            },
            err => {
                return res.status(err.Status || 500).send({Error: err.Message || 'Could not get theatre info'});
            }
        );
    });

    router.post('/join/:theatreId', (req, res) => {
        const theatreId = req.params.theatreId;
        const body = req.body;
        const userId = res.locals.usersession.UserId;
        if (!body || !body.SocketId || !body.Access) {
            return res.status(400).send({Error: 'SocketId and Access are required'});
        }
        const socketId = body.SocketId.trim();
        const access = body.Access.trim();
        theatreService.joinTheatre(theatreId, access, userId, socketId)
        .subscribe(
            theatre => {
                theatre.IsHost = (theatre.Host === userId);
                return res.send({Theatre: theatre});
            },
            err => {
                return res.status(err.Status || 500).send({Error: err.Message || 'Could not get theatre info'});
            }
        );
    });

    // AdminGate
    router.use((req, res, next) => {
        if (res.locals.usersession.Role !== 'admin') {
            return res.status(403).send({Error: 'UnAuthorized'});
        } else {
            return next();
        }
    });

    router.get('/', (req, res) => {
        const userId = res.locals.usersession.UserId;
        theatreService.getOwnTheatres(userId)
        .subscribe(
            theatres => {
                return res.send({Theatres: theatres});
            },
            err => {
                return res.status(err.Status || 500).send({Error: err.Message || 'Could not get your theatres'});
            }
        )
    });

    router.post('/', (req, res) => {
        const body = req.body;
        if (!body || !body.Name) {
            return res.status(400).send({Error: 'Name is required'});
        }
        const userId = res.locals.usersession.UserId;
        theatreService.createTheatre(body.Name, userId)
        .subscribe(
            theatre => {
                return res.send({Theatre: theatre});
            },
            err => {
                return res.status(err.Status || 500).send({Error: err.Message || 'Could not create new theatres'});
            }
        )
    });

    // Return router
    return router;
}
