import { Hono } from 'hono';
import * as uploadController from '../controllers/uploadController';
import { jwtAuth } from '../middleware/auth';

const upload = new Hono();

// POST /upload/avatar
// POST /upload/team-logo
// POST /upload/tournament-banner

upload.post('/avatar', jwtAuth, uploadController.uploadAvatar);
upload.post('/team-logo', jwtAuth, uploadController.uploadTeamLogo);
upload.post('/tournament-banner', jwtAuth, uploadController.uploadTournamentBanner);

export default upload; 