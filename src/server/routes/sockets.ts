import {Router} from 'express';
import {Config} from '../models/config';

module.exports = (APP_CONFIG: Config) => {
    const router = Router();
    const logger = APP_CONFIG.logger;
    const socketService = APP_CONFIG.socketService;
    const socketStore = APP_CONFIG.socketStore;

    router.post('/connect', (req, res) => {
        const body = req.body;
        if (!body || !body.SocketId) {
            return res.status(400).send({Error: 'SocketId is required'});
        }
        const userId = res.locals.usersession.UserId;
        const username = res.locals.usersession.Username;
        socketStore.connect(body.SocketId, userId, username);
        return res.send({Message: 'Socket Registered'});
    });

    router.delete('/disconnect', (req, res) => {
        const body = req.body;
        if (!body || !body.SocketId) {
            // disconnect ALL
            socketStore.disconnectUser(res.locals.usersession.UserId);
        } else {
            socketStore.disconnectSocket(body.SocketId);
        }
        return res.send({Message: 'Socket Unregistered'});
    });


    // Return middleware router
    return router;
}
