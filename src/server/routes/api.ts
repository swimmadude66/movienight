import {Router} from 'express';
import {Config} from '../models/config';

module.exports = (APP_CONFIG: Config) => {
    const router = Router();

    // PUBLIC
    router.use('/auth', require('./auth')(APP_CONFIG));

    // AuthGate
    router.use((req, res, next) => {
        if (!res.locals.usersession) {
            return res.status(401).send({Error: 'Unauthenticated'});
        } else {
            return next();
        }
    });

    router.use('/sockets', require('./sockets')(APP_CONFIG));
    router.use('/theatres', require('./theatres')(APP_CONFIG));
    router.use('/videos', require('./videos')(APP_CONFIG));

    // Return middleware router
    return router;
}
