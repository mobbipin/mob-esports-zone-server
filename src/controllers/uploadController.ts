import { uploadToR2, getR2Url } from '../utils/r2';

export const uploadAvatar = async (c: any) => {
  const body = await c.req.parseBody();
  const file = body['file'] || body['avatar'];
  if (!file) return c.json({ error: 'No file uploaded' }, 400);
  const key = `avatars/${Date.now()}_${file.name}`;
  await uploadToR2(c.env.R2, key, file.data);
  return c.json({ url: getR2Url(c.env.R2, key) });
};

export const uploadTeamLogo = async (c: any) => {
  const body = await c.req.parseBody();
  const file = body['file'] || body['logo'];
  if (!file) return c.json({ error: 'No file uploaded' }, 400);
  const key = `team-logos/${Date.now()}_${file.name}`;
  await uploadToR2(c.env.R2, key, file.data);
  return c.json({ url: getR2Url(c.env.R2, key) });
};

export const uploadTournamentBanner = async (c: any) => {
  const body = await c.req.parseBody();
  const file = body['file'] || body['banner'];
  if (!file) return c.json({ error: 'No file uploaded' }, 400);
  const key = `tournament-banners/${Date.now()}_${file.name}`;
  await uploadToR2(c.env.R2, key, file.data);
  return c.json({ url: getR2Url(c.env.R2, key) });
}; 