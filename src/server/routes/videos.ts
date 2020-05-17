import {Router} from 'express';
import { Config } from '../models/config';
import { StorageService } from '../services/storage';

module.exports = (APP_CONFIG: Config) => {
    const router = Router();
    const logger = APP_CONFIG.logger;
    const storage = new StorageService(
        logger,
        APP_CONFIG.db,
        process.env.S3_BUCKET || 'lifeboatmovienight',
        process.env.AWS_ACCESS_KEY_ID,
        process.env.AWS_SECRET_KEY,
        process.env.AWS_REGION || 'us-east-2'
    );

    router.get('/:videoId', (req, res, next) => {
        const videoId = req.params.videoId;
        storage.getVideoUrl(videoId)
        .subscribe(
            response => {
                return res.send(response);
            },
            err => {
                return res.status(err.Status || 500).send({Error: err.Message || 'Could not get video'});
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

    router.post('/:videoId/complete', (req, res) => {
        const videoId = req.params.videoId;
        const userId = res.locals.usersession.UserId;
        storage.completeVideoUpload(userId, videoId)
        .subscribe(
            response => {
                return res.send({Message: 'Upload completed', VideoId: response.VideoId});
            },
            err => {
                return res.status(err.Status || 500).send({Error: err.Message || 'Could not complete video upload'});
            }
        );
    });

    router.post('/', (req, res) => {
        const body = req.body;
        const userId = res.locals.usersession.UserId;
        if (!body || !body.Title || !body.Format || !body.Length || !body.FileSize || !body.FileName) {
            return res.status(400).send({Error: 'Title, Format, Length, FileSize, and FileName are required'});
        }
        storage.createVideoUpload(userId, body)
        .subscribe(
            response => {
                return res.send(response);
            },
            err => {
                return res.status(err.Status || 500).send({Error: err.Message || 'Could not get begin video upload'});
            }
        );
    });

    // Return router
    return router;
}
