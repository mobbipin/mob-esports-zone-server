import { nanoid } from 'nanoid';

export const sendMessage = async (c: any) => {
  const { recipientId, teamId, content, isBulk, groupId } = await c.req.json();
  const senderId = c.get('user').id;
  const id = nanoid();
  const createdAt = new Date().toISOString();
  await c.env.DB.prepare(
    'INSERT INTO Message (id, senderId, recipientId, teamId, content, createdAt, isBulk) VALUES (?, ?, ?, ?, ?, ?, ?)' 
  ).bind(id, senderId, recipientId ?? null, teamId ?? null, content, createdAt, isBulk ? 1 : 0).run();
  return c.json({ status: true, message: 'Message sent', data: { id } });
};

export const getInbox = async (c: any) => {
  const userId = c.get('user').id;
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM Message WHERE recipientId = ? OR teamId IN (SELECT teamId FROM TeamMembership WHERE userId = ?)' 
  ).bind(userId, userId).all();
  return c.json({ status: true, data: results });
};

export const getSent = async (c: any) => {
  const userId = c.get('user').id;
  const { results } = await c.env.DB.prepare('SELECT * FROM Message WHERE senderId = ?').bind(userId).all();
  return c.json({ status: true, data: results });
};

export const markRead = async (c: any) => {
  const { id } = c.req.param();
  await c.env.DB.prepare('UPDATE Message SET isRead = 1 WHERE id = ?').bind(id).run();
  return c.json({ status: true, message: 'Message marked as read' });
};

// Tournament group chat: admin can send, captains/members can view
export const getTournamentGroupMessages = async (c: any) => {
  const { tournamentId } = c.req.query();
  // Find all teams in the tournament
  const { results: teams } = await c.env.DB.prepare('SELECT teamId FROM TournamentRegistration WHERE tournamentId = ?').bind(tournamentId).all();
  const teamIds = teams.map((t: any) => t.teamId);
  // Find all messages sent to these teams (admin-to-captain group)
  let placeholders = teamIds.map(() => '?').join(',');
  if (!placeholders) placeholders = "''";
  const { results: messages } = await c.env.DB.prepare(
    `SELECT * FROM Message WHERE teamId IN (${placeholders}) AND isBulk = 1 ORDER BY createdAt ASC`
  ).bind(...teamIds).all();
  return c.json({ status: true, data: messages });
}; 