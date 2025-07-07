import { nanoid } from 'nanoid';
import { getDb } from '../db/drizzle';
import { FileUpload } from '../db/models';
import { eq, desc } from 'drizzle-orm';

// Helper to get user from context
function getUserId(c: any) {
  return c.get('user')?.id;
}

// Helper to get R2 public URL
function getR2Url(key: string) {
  // For local development, return a placeholder URL
  // In production, this should be your actual R2 public URL
  return `https://via.placeholder.com/400x200?text=${encodeURIComponent(key)}`;
}

export async function uploadFile(c: any) {
  try {
    const userId = getUserId(c);
    if (!userId) return c.json({ status: false, error: 'Unauthorized' }, 401);
    
    const form = await c.req.formData();
    const file = form.get('file') || form.get('image') || form.get('avatar') || form.get('logo') || form.get('banner');
    
    if (!file || typeof file === 'string') {
      return c.json({ status: false, error: 'No file uploaded' }, 400);
    }
    
    const fileName = file.name || `upload_${nanoid(8)}`;
    const fileType = file.type || 'application/octet-stream';
    const fileSize = file.size;
    const id = nanoid();
    const key = `uploads/${id}_${fileName}`;
    
    // For local development, skip R2 upload and just return a placeholder URL
    let fileUrl;
    if (c.env.R2_BUCKET) {
      // Upload to R2
      await c.env.R2_BUCKET.put(key, file.stream(), { httpMetadata: { contentType: fileType } });
      fileUrl = getR2Url(key);
    } else {
      // Local development - use placeholder
      fileUrl = getR2Url(key);
    }
    
    // Save metadata in DB
    const db = getDb(c.env);
    await db.insert(FileUpload).values({
      id,
      fileName,
      fileType,
      fileSize,
      fileUrl,
      uploadedBy: userId,
      uploadDate: new Date().toISOString(),
    });
    
    return c.json({ status: true, data: { id, url: fileUrl }, message: 'File uploaded' });
  } catch (error: any) {
    console.error('Upload error:', error);
    return c.json({ status: false, error: error.message || 'Upload failed' }, 500);
  }
}

export async function getUpload(c: any) {
  const id = c.req.param('id');
  const db = getDb(c.env);
  const upload = await db.select().from(FileUpload).where(eq(FileUpload.id, id)).get();
  if (!upload) return c.json({ status: false, error: 'Not found' }, 404);
  return c.json({ status: true, data: upload });
}

export async function listUploads(c: any) {
  const db = getDb(c.env);
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = parseInt(c.req.query('limit') || '10', 10);
  const offset = (page - 1) * limit;
  const uploads = await db.select().from(FileUpload).orderBy(desc(FileUpload.uploadDate)).limit(limit).offset(offset).all();
  return c.json({ status: true, data: uploads });
}

export async function deleteUpload(c: any) {
  const id = c.req.param('id');
  const db = getDb(c.env);
  const upload = await db.select().from(FileUpload).where(eq(FileUpload.id, id)).get();
  if (!upload) return c.json({ status: false, error: 'Not found' }, 404);
  // Delete from R2
  const key = upload.fileUrl.split('/').pop();
  if (key) await c.env.R2_BUCKET.delete(key);
  // Delete from DB
  await db.delete(FileUpload).where(eq(FileUpload.id, id));
  return c.json({ status: true, message: 'Upload deleted' });
}

export async function uploadAvatar(c: any) {
  try {
    const userId = getUserId(c);
    if (!userId) return c.json({ status: false, error: 'Unauthorized' }, 401);
    
    const form = await c.req.formData();
    const file = form.get('file') || form.get('avatar');
    
    if (!file || typeof file === 'string') {
      return c.json({ status: false, error: 'No file uploaded' }, 400);
    }
    
    const fileType = file.type || 'image/jpeg';
    const fileName = file.name || `avatar_${userId}`;
    const key = `avatars/${userId}_${nanoid(6)}_${fileName}`;
    
    // For local development, skip R2 upload and just return a placeholder URL
    let fileUrl;
    if (c.env.R2_BUCKET) {
      await c.env.R2_BUCKET.put(key, file.stream(), { httpMetadata: { contentType: fileType } });
      fileUrl = getR2Url(key);
    } else {
      fileUrl = getR2Url(key);
    }
    
    return c.json({ status: true, data: { url: fileUrl }, message: 'Avatar uploaded' });
  } catch (error: any) {
    console.error('Avatar upload error:', error);
    return c.json({ status: false, error: error.message || 'Upload failed' }, 500);
  }
}

export async function uploadTeamLogo(c: any) {
  try {
    const userId = getUserId(c);
    if (!userId) return c.json({ status: false, error: 'Unauthorized' }, 401);
    
    const form = await c.req.formData();
    const file = form.get('file') || form.get('logo');
    
    if (!file || typeof file === 'string') {
      return c.json({ status: false, error: 'No file uploaded' }, 400);
    }
    
    const fileType = file.type || 'image/png';
    const fileName = file.name || `teamlogo_${userId}`;
    const key = `team-logos/${userId}_${nanoid(6)}_${fileName}`;
    
    // For local development, skip R2 upload and just return a placeholder URL
    let fileUrl;
    if (c.env.R2_BUCKET) {
      await c.env.R2_BUCKET.put(key, file.stream(), { httpMetadata: { contentType: fileType } });
      fileUrl = getR2Url(key);
    } else {
      fileUrl = getR2Url(key);
    }
    
    return c.json({ status: true, data: { url: fileUrl }, message: 'Team logo uploaded' });
  } catch (error: any) {
    console.error('Team logo upload error:', error);
    return c.json({ status: false, error: error.message || 'Upload failed' }, 500);
  }
}

export async function uploadTournamentBanner(c: any) {
  try {
    const userId = getUserId(c);
    if (!userId) return c.json({ status: false, error: 'Unauthorized' }, 401);
    
    const form = await c.req.formData();
    const file = form.get('file') || form.get('banner');
    
    if (!file || typeof file === 'string') {
      return c.json({ status: false, error: 'No file uploaded' }, 400);
    }
    
    const fileType = file.type || 'image/jpeg';
    const fileName = file.name || `banner_${userId}`;
    const key = `tournament-banners/${userId}_${nanoid(6)}_${fileName}`;
    
    // For local development, skip R2 upload and just return a placeholder URL
    let fileUrl;
    if (c.env.R2_BUCKET) {
      await c.env.R2_BUCKET.put(key, file.stream(), { httpMetadata: { contentType: fileType } });
      fileUrl = getR2Url(key);
    } else {
      fileUrl = getR2Url(key);
    }
    
    return c.json({ status: true, data: { url: fileUrl }, message: 'Tournament banner uploaded' });
  } catch (error: any) {
    console.error('Tournament banner upload error:', error);
    return c.json({ status: false, error: error.message || 'Upload failed' }, 500);
  }
} 