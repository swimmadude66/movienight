import {Router} from 'express';
import { Config } from '../models/config';
import { StorageService } from '../services/storage';
import { VideosService } from '../services/videos';

module.exports = (APP_CONFIG: Config) => {
    const router = Router();
    const logger = APP_CONFIG.logger;
    const storage = new StorageService(
        logger,
        process.env.S3_BUCKET || 'lifeboatmovienight',
        process.env.AWS_ACCESS_KEY_ID,
        process.env.AWS_SECRET_KEY,
        process.env.AWS_REGION || 'us-east-2'
    );
    const videos = new VideosService(
        APP_CONFIG.db,
        storage,
        logger
    );

    router.get('/', (req, res) => {
        const ownerId = res.locals.usersession.UserId;
        videos.getVideos(ownerId)
        .subscribe(
            videos => {
                return res.send({Videos: videos});
            },
            err => {
                return res.status(err.Status || 500).send({Error: err.Message || 'Could not get Videos' });
            }
        );
    });

    router.get('/:videoId', (req, res, next) => {
        const videoId = req.params.videoId;
        videos.getVideoUrl(videoId)
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
        videos.completeVideoUpload(userId, videoId)
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
        // !/^\s*video\//i.test(body.Format)
        if (!/\s*video\/mp4/i.test(body.Format)) {
            return res.status(415).send({Error: 'only mp4 videos are supported right now'});
        }
        // if (body.FileSize > 10485760) { // 10MB
        //     return res.status(413).send({Error: 'Cannot accept files larger than 10MB'});
        // }
        videos.createVideoUpload(userId, body)
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
