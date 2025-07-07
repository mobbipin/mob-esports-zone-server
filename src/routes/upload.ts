import { Hono } from 'hono';
import { jwtAuth } from '../middleware/auth';
import * as uploadController from '../controllers/uploadController';

const upload = new Hono();

// POST /upload/file
upload.post('/file', jwtAuth, uploadController.uploadFile);
// GET /upload/:id
upload.get('/:id', uploadController.getUpload);
// GET /upload
upload.get('/', uploadController.listUploads);
// DELETE /upload/:id
upload.delete('/:id', jwtAuth, uploadController.deleteUpload);
// POST /upload/avatar
upload.post('/avatar', jwtAuth, uploadController.uploadAvatar);
// POST /upload/team-logo
upload.post('/team-logo', jwtAuth, uploadController.uploadTeamLogo);
// POST /upload/tournament-banner
upload.post('/tournament-banner', jwtAuth, uploadController.uploadTournamentBanner);

export default upload; 