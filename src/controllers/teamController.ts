import { nanoid } from 'nanoid';
import { z } from 'zod';

const TeamSchema = z.object({
  name: z.string().min(2),
  tag: z.string().min(2).max(8).optional(),
  bio: z.string().optional(),
  logoUrl: z.string().optional(),
  region: z.string().optional(),
  matchesPlayed: z.number().optional(),
  wins: z.number().optional()
});

const InvitePlayerSchema = z.object({
  userEmail: z.string().email()
});

export const createTeam = async (c: any) => {
  const data = await c.req.json();
  const parse = TeamSchema.safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  const { name, tag, bio, logoUrl, region } = parse.data;
  const user = c.get('user');
  const id = nanoid();
  await c.env.DB.prepare(
    'INSERT INTO Team (id, name, tag, bio, logoUrl, region, ownerId) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, name, tag ?? null, bio ?? null, logoUrl ?? null, region ?? null, user.id).run();
  await c.env.DB.prepare(
    'INSERT INTO TeamMembership (userId, teamId, role) VALUES (?, ?, ?)'
  ).bind(user.id, id, 'owner').run();
  return c.json({ status: true, data: { id }, message: 'Team created' });
};

export const getMyTeam = async (c: any) => {
  const user = c.get('user');
  // First check if user owns a team
  let { results } = await c.env.DB.prepare('SELECT * FROM Team WHERE ownerId = ?').bind(user.id).all();
  // If not owner, check if user is a member of any team
  if (!results.length) {
    const { results: memberships } = await c.env.DB.prepare('SELECT teamId FROM TeamMembership WHERE userId = ?').bind(user.id).all();
    if (memberships.length) {
      const teamId = memberships[0].teamId;
      const { results: teamResults } = await c.env.DB.prepare('SELECT * FROM Team WHERE id = ?').bind(teamId).all();
      if (teamResults.length) {
        results = teamResults;
      }
    }
  }
  if (!results.length) return c.json({ status: false, error: 'Team not found' }, 404);
  const team = results[0];
  // Get members with displayName and email
  const { results: members } = await c.env.DB.prepare(
    `SELECT TeamMembership.*, User.displayName, User.email
     FROM TeamMembership
     JOIN User ON TeamMembership.userId = User.id
     WHERE TeamMembership.teamId = ?`
  ).bind(team.id).all();
  return c.json({ status: true, data: { ...team, members } });
};

export const getTeamById = async (c: any) => {
  const { id } = c.req.param();
  const { results } = await c.env.DB.prepare('SELECT * FROM Team WHERE id = ?').bind(id).all();
  if (!results.length) return c.json({ status: false, error: 'Team not found' }, 404);
  const team = results[0];
  
  // Get members
  const { results: members } = await c.env.DB.prepare('SELECT * FROM TeamMembership WHERE teamId = ?').bind(team.id).all();
  return c.json({ status: true, data: { ...team, members } });
};

export const getTeam = async (c: any) => {
  const { id } = c.req.param();
  let team;
  
  if (id === 'my') {
    const user = c.get('user');
    const { results } = await c.env.DB.prepare('SELECT * FROM Team WHERE ownerId = ?').bind(user.id).all();
    if (!results.length) return c.json({ status: false, error: 'Team not found' }, 404);
    team = results[0];
  } else {
    const { results } = await c.env.DB.prepare('SELECT * FROM Team WHERE id = ?').bind(id).all();
    if (!results.length) return c.json({ status: false, error: 'Team not found' }, 404);
    team = results[0];
  }
  
  // Get members
  const { results: members } = await c.env.DB.prepare('SELECT * FROM TeamMembership WHERE teamId = ?').bind(team.id).all();
  return c.json({ status: true, data: { ...team, members } });
};

export const updateTeam = async (c: any) => {
  const { id } = c.req.param();
  const data = await c.req.json();
  const parse = TeamSchema.partial().safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  const fields = [];
  const values = [];
  for (const key in parse.data) {
    if ((parse.data as any)[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push((parse.data as any)[key]);
    }
  }
  if (!fields.length) return c.json({ status: false, error: 'No fields to update' }, 400);
  values.push(id);
  const sql = `UPDATE Team SET ${fields.join(', ')} WHERE id = ?`;
  await c.env.DB.prepare(sql).bind(...values).run();
  return c.json({ status: true, message: 'Team updated' });
};

export const deleteTeam = async (c: any) => {
  const { id } = c.req.param();
  await c.env.DB.prepare('DELETE FROM Team WHERE id = ?').bind(id).run();
  await c.env.DB.prepare('DELETE FROM TeamMembership WHERE teamId = ?').bind(id).run();
  return c.json({ status: true, message: 'Team deleted' });
};

export const invitePlayer = async (c: any) => {
  const { id: teamId } = c.req.param();
  const data = await c.req.json();
  const parse = InvitePlayerSchema.safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  const { userEmail } = parse.data;
  const user = c.get('user');
  // Check if user is the team owner
  const { results: teamResults } = await c.env.DB.prepare('SELECT ownerId FROM Team WHERE id = ?').bind(teamId).all();
  if (!teamResults.length) return c.json({ status: false, error: 'Team not found' }, 404);
  if (teamResults[0].ownerId !== user.id) return c.json({ status: false, error: 'Only the team owner can invite players.' }, 403);
  // Try to find userId for invitedEmail
  const { results: userResults } = await c.env.DB.prepare('SELECT id FROM User WHERE email = ?').bind(userEmail).all();
  const invitedUserId = userResults.length ? userResults[0].id : null;
  if (!invitedUserId) return c.json({ status: false, error: 'User not found' }, 404);
  // Check if invite already exists and is pending
  const { results: existing } = await c.env.DB.prepare(
    'SELECT * FROM TeamInvite WHERE teamId = ? AND invitedUserId = ? AND status = ?'
  ).bind(teamId, invitedUserId, 'pending').all();
  if (existing.length) return c.json({ status: false, error: 'Invite already sent and pending' }, 400);
  const inviteId = nanoid();
  await c.env.DB.prepare(
    'INSERT INTO TeamInvite (id, teamId, invitedBy, invitedUserId, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)' 
  ).bind(inviteId, teamId, user.id, invitedUserId, 'pending', new Date().toISOString()).run();
  return c.json({ status: true, message: 'Player invited' });
};

export const getTeamInvites = async (c: any) => {
  const { id: teamId } = c.req.param();
  const { results } = await c.env.DB.prepare(
    `SELECT TeamInvite.*, User.email as invitedEmail
     FROM TeamInvite
     LEFT JOIN User ON TeamInvite.invitedUserId = User.id
     WHERE TeamInvite.teamId = ?`
  ).bind(teamId).all();
  return c.json({ status: true, data: results });
};

export const getUserInvites = async (c: any) => {
  const user = c.get('user');
  const { results } = await c.env.DB.prepare(
    `SELECT TeamInvite.*, User.email as invitedEmail
     FROM TeamInvite
     LEFT JOIN User ON TeamInvite.invitedUserId = User.id
     WHERE TeamInvite.invitedUserId = ?`
  ).bind(user.id).all();
  return c.json({ status: true, data: results });
};

export const acceptInvite = async (c: any) => {
  const { inviteId } = c.req.param();
  const user = c.get('user');
  // Get invite
  const { results } = await c.env.DB.prepare('SELECT * FROM TeamInvite WHERE id = ?').bind(inviteId).all();
  if (!results.length) return c.json({ status: false, error: 'Invite not found' }, 404);
  const invite = results[0];
  if (invite.status !== 'pending') return c.json({ status: false, error: 'Invite already handled' }, 400);
  // Add to TeamMembership
  await c.env.DB.prepare('INSERT INTO TeamMembership (userId, teamId, role) VALUES (?, ?, ?)').bind(user.id, invite.teamId, 'member').run();
  // Update invite status
  await c.env.DB.prepare('UPDATE TeamInvite SET status = ? WHERE id = ?').bind('accepted', inviteId).run();
  return c.json({ status: true, message: 'Invite accepted' });
};

export const rejectInvite = async (c: any) => {
  const { inviteId } = c.req.param();
  // Update invite status
  await c.env.DB.prepare('UPDATE TeamInvite SET status = ? WHERE id = ?').bind('rejected', inviteId).run();
  return c.json({ status: true, message: 'Invite rejected' });
}; 

export const transferOwner = async (c: any) => {
  const { id: teamId } = c.req.param();
  const { newOwnerId } = await c.req.json();
  if (!newOwnerId) {
    return c.json({ status: false, error: 'No new owner selected.' }, 400);
  }
  const user = c.get('user');
  // Check if user is the current owner
  const { results: teamResults } = await c.env.DB.prepare('SELECT ownerId FROM Team WHERE id = ?').bind(teamId).all();
  if (!teamResults.length) return c.json({ status: false, error: 'Team not found' }, 404);
  if (teamResults[0].ownerId !== user.id) return c.json({ status: false, error: 'Only the team owner can transfer ownership.' }, 403);
  // Check if newOwnerId is a member of the team
  const { results: memberResults } = await c.env.DB.prepare('SELECT * FROM TeamMembership WHERE teamId = ? AND userId = ?').bind(teamId, newOwnerId).all();
  if (!memberResults.length) return c.json({ status: false, error: 'Selected user is not a team member.' }, 400);
  // Update Team.ownerId
  await c.env.DB.prepare('UPDATE Team SET ownerId = ? WHERE id = ?').bind(newOwnerId, teamId).run();
  // Update TeamMembership roles
  await c.env.DB.prepare('UPDATE TeamMembership SET role = ? WHERE teamId = ? AND userId = ?').bind('member', teamId, user.id).run();
  await c.env.DB.prepare('UPDATE TeamMembership SET role = ? WHERE teamId = ? AND userId = ?').bind('owner', teamId, newOwnerId).run();
  return c.json({ status: true, message: 'Ownership transferred.' });
}; 