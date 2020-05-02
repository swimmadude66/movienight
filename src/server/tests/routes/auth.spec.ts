import * as request from 'supertest';
import * as express from 'express';

describe('/auth', () => {

    let app;
    before((done) => {
        app = express();
        app.use('/api/auth', require('../../routes/auth')({}));
        app.use((req, res) => res.status(404).send('not a valid endpoint'));
        setTimeout(() => {
            done(); // gross way to make sure express is ready
        }, 500);
    });

    it('should check if a session is valid', (done) => {
        request(app)
        .get('/api/auth/valid')
        .expect(200, 'false', done);
    });
});
