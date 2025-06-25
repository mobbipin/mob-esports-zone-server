import { nanoid } from 'nanoid';
import { z } from 'zod';
import { uploadToR2, getR2Url } from '../utils/r2';

const UploadSchema = z.object({
  fileName: z.string(),
  fileType: z.string(),
  fileSize: z.number()
});

export const uploadFile = async (c: any) => {
  const data = await c.req.json();
  const parse = UploadSchema.safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  const { fileName, fileType, fileSize } = parse.data;
  const id = nanoid();
  const uploadedBy = c.get('user').id;
  const uploadDate = new Date().toISOString();
  // TODO: Implement actual file upload to R2
  const fileUrl = `https://r2.example.com/${id}/${fileName}`;
  await c.env.DB.prepare(
    'INSERT INTO FileUpload (id, fileName, fileType, fileSize, fileUrl, uploadedBy, uploadDate) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, fileName, fileType, fileSize, fileUrl, uploadedBy, uploadDate).run();
  return c.json({ status: true, data: { id, fileUrl }, message: 'File uploaded' });
};

export const getUpload = async (c: any) => {
  const { id } = c.req.param();
  const { results } = await c.env.DB.prepare('SELECT * FROM FileUpload WHERE id = ?').bind(id).all();
  if (!results.length) return c.json({ status: false, error: 'Upload not found' }, 404);
  return c.json({ status: true, data: results[0] });
};

export const listUploads = async (c: any) => {
  const { page = '1', limit = '10' } = c.req.query();
  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 10;
  const offset = (pageNum - 1) * limitNum;
  const { results } = await c.env.DB.prepare('SELECT * FROM FileUpload ORDER BY uploadDate DESC LIMIT ? OFFSET ?').bind(limitNum, offset).all();
  return c.json({ status: true, data: results });
};

export const deleteUpload = async (c: any) => {
  const { id } = c.req.param();
  // TODO: Delete from R2 as well
  await c.env.DB.prepare('DELETE FROM FileUpload WHERE id = ?').bind(id).run();
  return c.json({ status: true, message: 'Upload deleted' });
};

export const uploadAvatar = async (c: any) => {
  const body = await c.req.parseBody();
  const file = body['file'] || body['avatar'];
  if (!file) return c.json({ status: false, error: 'No file uploaded' }, 400);
  const key = `avatars/${Date.now()}_${file.name}`;
  await uploadToR2(c.env.R2, key, file.data);
  return c.json({ status: true, data: { url: getR2Url(c.env.R2, key) } });
};

export const uploadTeamLogo = async (c: any) => {
  const body = await c.req.parseBody();
  const file = body['file'] || body['logo'];
  if (!file) return c.json({ status: false, error: 'No file uploaded' }, 400);
  const key = `team-logos/${Date.now()}_${file.name}`;
  await uploadToR2(c.env.R2, key, file.data);
  return c.json({ status: true, data: { url: getR2Url(c.env.R2, key) } });
};

export const uploadTournamentBanner = async (c: any) => {
  const body = await c.req.parseBody();
  const file = body['file'] || body['banner'];
  if (!file) return c.json({ status: false, error: 'No file uploaded' }, 400);
  const key = `tournament-banners/${Date.now()}_${file.name}`;
  await uploadToR2(c.env.R2, key, file.data);
  return c.json({ status: true, data: { url: getR2Url(c.env.R2, key) } });
}; 