import {Router} from 'express';
import {tap} from 'rxjs/operators';
import {Config} from '../models/config';

module.exports = (APP_CONFIG: Config) => {
    const router = Router();
    const sessionManager = APP_CONFIG.sessionManager;

    router.use((req, res, next) => {
        if (res.locals.auth) {
            return next();
        }
        if ((!req.headers.authorization || req.headers.authorization.length< 1) && (!req.signedCookies || !req.signedCookies[APP_CONFIG.cookie_name])) {
            res.locals.auth = null;
            return next();
        }
        let sessionKey;
        if (req.headers.authorization && req.headers.authorization.length) {
            let auth = Array.isArray(req.headers.authorization) ? req.headers.authorization[0] : req.headers.authorization;
            if (auth && auth.length) {
                sessionKey = auth.replace(/^\s*bearer\s+/i, '');
            }
        }
        if (!sessionKey && req.signedCookies && req.signedCookies[APP_CONFIG.cookie_name]) {
            sessionKey = req.signedCookies[APP_CONFIG.cookie_name];
        }
        if (!sessionKey) {
            delete res.locals.auth;
            delete res.locals.session;
            return next();
        }
        sessionManager.getUserSession(sessionKey)
        .pipe(
            tap(result => {
                if (result && result.SessionKey) {
                    sessionManager.updateAccess(result.SessionKey).subscribe(_ => _, err=> console.error(err));
                }
            })
        )
        .subscribe(
            result => {
                if (!result) {
                    return next();
                }
                res.locals.usersession = result;
                return next();
            }, err => {
                console.error(err);
                return next();
            }
        );
    });


    return router;
}
