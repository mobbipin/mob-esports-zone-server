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
  achievements: z.array(z.string()).optional(),
  avatar: z.string().url().optional() // Allow updating avatar
});

export const getPlayer = async (c: any) => {
  const { id } = c.req.param();
  const { results } = await c.env.DB.prepare('SELECT User.*, PlayerProfile.* FROM User LEFT JOIN PlayerProfile ON User.id = PlayerProfile.userId WHERE User.id = ?').bind(id).all();
  if (!results.length) return c.json({ status: false, error: 'Player not found' }, 404);
  const player = results[0];
  if (player.social) player.social = JSON.parse(player.social);
  if (player.achievements) player.achievements = JSON.parse(player.achievements);
  return c.json({ status: true, data: { ...player, banned: player.banned } });
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
  let sql = `
    SELECT 
      User.id, User.email, User.role, User.username, User.displayName, User.banned, User.isPublic,
      (SELECT Team.name FROM TeamMembership JOIN Team ON TeamMembership.teamId = Team.id WHERE TeamMembership.userId = User.id LIMIT 1) as teamName,
      PlayerProfile.userId as profileUserId, PlayerProfile.bio, PlayerProfile.region, PlayerProfile.gameId, PlayerProfile.avatar, PlayerProfile.rank, PlayerProfile.winRate, PlayerProfile.kills, PlayerProfile.social, PlayerProfile.achievements
    FROM User
    LEFT JOIN PlayerProfile ON User.id = PlayerProfile.userId
    WHERE User.role = 'player'
  `;
  let params: any[] = [];
  if (search) {
    sql += ' AND (User.username LIKE ? OR User.displayName LIKE ? OR PlayerProfile.bio LIKE ? OR PlayerProfile.gameId LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  sql += ' LIMIT ? OFFSET ?';
  params.push(limitNum, offset);
  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  const data = results.map((row: any) => {
    let playerProfile = {
      bio: row.bio,
      region: row.region,
      gameId: row.gameId,
      avatar: row.avatar,
      rank: row.rank,
      winRate: row.winRate,
      kills: row.kills,
      social: row.social ? JSON.parse(row.social) : null,
      achievements: row.achievements ? JSON.parse(row.achievements) : null,
    };
    return {
      id: row.id,
      email: row.email,
      username: row.username,
      displayName: row.displayName,
      teamName: row.teamName,
      banned: row.banned,
      isPublic: row.isPublic,
      playerProfile,
    };
  });
  return c.json({ status: true, data });
}; 