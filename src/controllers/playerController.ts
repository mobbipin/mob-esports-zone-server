import { z } from 'zod';

const UpdatePlayerSchema = z.object({
  bio: z.string().optional(),
  region: z.string().optional(),
  gameId: z.string().optional(),
  rank: z.string().optional(),
  winRate: z.number().optional(),
  kills: z.number().optional(),
  social: z.object({
    twitch: z.string().url().optional(),
    discord: z.string().optional()
  }).optional(),
  achievements: z.array(z.string()).optional()
});

export const getPlayer = async (c: any) => {
  const { id } = c.req.param();
  const { results } = await c.env.DB.prepare('SELECT * FROM PlayerProfile WHERE userId = ?').bind(id).all();
  if (!results.length) return c.json({ status: false, error: 'Player not found' }, 404);
  const player = results[0];
  if (player.social) player.social = JSON.parse(player.social);
  if (player.achievements) player.achievements = JSON.parse(player.achievements);
  return c.json({ status: true, data: player });
};

export const updatePlayer = async (c: any) => {
  const { id } = c.req.param();
  const data = await c.req.json();
  const parse = UpdatePlayerSchema.safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  const updateData: any = { ...parse.data };
  if (updateData.social) updateData.social = JSON.stringify(updateData.social);
  if (updateData.achievements) updateData.achievements = JSON.stringify(updateData.achievements);
  const fields = [];
  const values = [];
  for (const key in updateData) {
    if (updateData[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(updateData[key]);
    }
  }
  if (!fields.length) return c.json({ status: false, error: 'No fields to update' }, 400);
  values.push(id);
  const sql = `UPDATE PlayerProfile SET ${fields.join(', ')} WHERE userId = ?`;
  await c.env.DB.prepare(sql).bind(...values).run();
  return c.json({ status: true, message: 'Profile updated' });
};

export const listPlayers = async (c: any) => {
  const { page = '1', limit = '10', search = '' } = c.req.query();
  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 10;
  const offset = (pageNum - 1) * limitNum;
  let sql = 'SELECT * FROM PlayerProfile';
  let params: any[] = [];
  if (search) {
    sql += ' WHERE bio LIKE ? OR gameId LIKE ?';
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += ' LIMIT ? OFFSET ?';
  params.push(limitNum, offset);
  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  for (const p of results) {
    if (p.social) p.social = JSON.parse(p.social);
    if (p.achievements) p.achievements = JSON.parse(p.achievements);
  }
  return c.json({ status: true, data: results });
}; 