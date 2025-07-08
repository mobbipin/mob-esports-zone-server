import { nanoid } from 'nanoid';
import { z } from 'zod';

const TournamentSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  game: z.string().min(2),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  maxTeams: z.number().min(2),
  prizePool: z.number().optional(),
  entryFee: z.number().optional(),
  rules: z.string().optional(),
  status: z.enum(['upcoming', 'registration', 'ongoing', 'completed']).optional(),
  imageUrl: z.string().optional(),
  bannerUrl: z.string().optional()
});

const MatchSchema = z.object({
  team1Id: z.string(),
  team2Id: z.string(),
  round: z.number(),
  matchNumber: z.number(),
  winnerId: z.string().optional()
});

export const createTournament = async (c: any) => {
  const data = await c.req.json();
  const parse = TournamentSchema.safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  const { name, description, game, startDate, endDate, maxTeams, prizePool, entryFee, rules, imageUrl, bannerUrl } = parse.data;
  const finalImageUrl = imageUrl || bannerUrl || null;
  const id = nanoid();
  const user = c.get('user');
  const createdAt = new Date().toISOString();
  await c.env.DB.prepare(
    'INSERT INTO Tournament (id, name, description, game, startDate, endDate, maxTeams, prizePool, entryFee, rules, status, createdBy, createdAt, imageUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, name, description ?? null, game, startDate, endDate, maxTeams, prizePool ?? null, entryFee ?? null, rules ?? null, 'upcoming', user.id, createdAt, finalImageUrl).run();
  return c.json({ status: true, data: { id }, message: 'Tournament created' });
};

export const listTournaments = async (c: any) => {
  const { status, page = '1', limit = '10' } = c.req.query();
  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 10;
  const offset = (pageNum - 1) * limitNum;
  let sql = 'SELECT * FROM Tournament';
  let params: any[] = [];
  if (status) {
    sql += ' WHERE status = ?';
    params.push(status);
  }
  sql += ' ORDER BY startDate DESC LIMIT ? OFFSET ?';
  params.push(limitNum, offset);
  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ status: true, data: results });
};

export const getTournament = async (c: any) => {
  const { id } = c.req.param();
  const { results } = await c.env.DB.prepare('SELECT * FROM Tournament WHERE id = ?').bind(id).all();
  if (!results.length) return c.json({ status: false, error: 'Tournament not found' }, 404);
  const tournament = results[0];
  
  // Get registered teams with full team details
  const { results: registrations } = await c.env.DB.prepare(`
    SELECT tr.*, t.name as teamName, t.logoUrl as teamLogo, t.tag as teamTag
    FROM TournamentRegistration tr
    LEFT JOIN Team t ON tr.teamId = t.id
    WHERE tr.tournamentId = ?
  `).bind(id).all();
  
  // Get matches
  const { results: matches } = await c.env.DB.prepare('SELECT * FROM Match WHERE tournamentId = ? ORDER BY round, matchNumber').bind(id).all();
  
  // Transform data to match frontend expectations
  const transformedTournament = {
    ...tournament,
    // Map backend fields to frontend expectations
    imageUrl: tournament.imageUrl || null, // Ensure imageUrl is included
    participants: registrations.length,
    maxParticipants: tournament.maxTeams,
    prize: tournament.prizePool ? `$${tournament.prizePool.toLocaleString()}` : "TBA",
    date: new Date(tournament.startDate).toLocaleDateString(),
    startTime: new Date(tournament.startDate).toLocaleTimeString(),
    region: "Global", // Default value
    platform: "Mobile", // Default value
    longDescription: tournament.description || tournament.description,
    // Transform rules from string to array
    rules: tournament.rules ? tournament.rules.split('\n').filter((rule: string) => rule.trim()) : [
      "All participants must follow fair play guidelines",
      "No cheating or use of unauthorized software",
      "Decisions made by tournament officials are final",
      "Participants must be available for scheduled matches"
    ],
    // Create schedule from start and end dates
    schedule: [
      {
        date: new Date(tournament.startDate).toLocaleDateString(),
        time: new Date(tournament.startDate).toLocaleTimeString(),
        event: "Tournament Start"
      },
      {
        date: new Date(tournament.endDate).toLocaleDateString(),
        time: new Date(tournament.endDate).toLocaleTimeString(),
        event: "Tournament End"
      }
    ],
    // Create prize distribution
    prizes: tournament.prizePool ? [
      { position: "1st Place", amount: `$${Math.floor(tournament.prizePool * 0.5).toLocaleString()}` },
      { position: "2nd Place", amount: `$${Math.floor(tournament.prizePool * 0.3).toLocaleString()}` },
      { position: "3rd Place", amount: `$${Math.floor(tournament.prizePool * 0.2).toLocaleString()}` }
    ] : [
      { position: "1st Place", amount: "TBA" },
      { position: "2nd Place", amount: "TBA" },
      { position: "3rd Place", amount: "TBA" }
    ],
    // Transform registered teams
    registeredTeams: registrations.map((reg: any) => ({
      id: reg.teamId,
      name: reg.teamName || "Unknown Team",
      avatar: reg.teamLogo || "https://via.placeholder.com/32x32?text=T"
    })),
    teams: registrations,
    matches
  };
  
  return c.json({ status: true, data: transformedTournament });
};

export const updateTournament = async (c: any) => {
  const { id } = c.req.param();
  const data = await c.req.json();
  const parse = TournamentSchema.partial().safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  const fields = [];
  const values = [];
  let finalImageUrl = undefined;
  if ('imageUrl' in parse.data || 'bannerUrl' in parse.data) {
    finalImageUrl = parse.data.imageUrl || parse.data.bannerUrl || null;
    fields.push('imageUrl = ?');
    values.push(finalImageUrl);
    delete parse.data.imageUrl;
    delete parse.data.bannerUrl;
  }
  for (const key in parse.data) {
    if ((parse.data as any)[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push((parse.data as any)[key]);
    }
  }
  if (!fields.length) return c.json({ status: false, error: 'No fields to update' }, 400);
  values.push(id);
  const sql = `UPDATE Tournament SET ${fields.join(', ')} WHERE id = ?`;
  await c.env.DB.prepare(sql).bind(...values).run();
  return c.json({ status: true, message: 'Tournament updated' });
};

export const deleteTournament = async (c: any) => {
  const { id } = c.req.param();
  await c.env.DB.prepare('DELETE FROM Tournament WHERE id = ?').bind(id).run();
  await c.env.DB.prepare('DELETE FROM TournamentRegistration WHERE tournamentId = ?').bind(id).run();
  await c.env.DB.prepare('DELETE FROM Match WHERE tournamentId = ?').bind(id).run();
  return c.json({ status: true, message: 'Tournament deleted' });
};

export const registerTeam = async (c: any) => {
  const { id } = c.req.param();
  const { teamId } = await c.req.json();
  const user = c.get('user');
  
  // Check if tournament exists
  const { results: tournament } = await c.env.DB.prepare('SELECT * FROM Tournament WHERE id = ?').bind(id).all();
  if (!tournament.length) {
    return c.json({ status: false, error: 'Tournament not found' }, 404);
  }
  
  // Check if team exists and user is a member
  const { results: teamMembership } = await c.env.DB.prepare(
    'SELECT * FROM TeamMembership WHERE teamId = ? AND userId = ?'
  ).bind(teamId, user.id).all();
  
  if (!teamMembership.length) {
    return c.json({ status: false, error: 'You are not a member of this team' }, 403);
  }
  
  // Check if team is already registered
  const { results: existingRegistration } = await c.env.DB.prepare(
    'SELECT * FROM TournamentRegistration WHERE tournamentId = ? AND teamId = ?'
  ).bind(id, teamId).all();
  
  if (existingRegistration.length > 0) {
    return c.json({ status: false, error: 'Team is already registered for this tournament' }, 400);
  }
  
  // Check if tournament is full
  const { results: registrations } = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM TournamentRegistration WHERE tournamentId = ?'
  ).bind(id).all();
  
  if (registrations[0].count >= tournament[0].maxTeams) {
    return c.json({ status: false, error: 'Tournament is full' }, 400);
  }
  
  // Register the team
  await c.env.DB.prepare(
    'INSERT INTO TournamentRegistration (tournamentId, teamId, registeredAt) VALUES (?, ?, ?)'
  ).bind(id, teamId, new Date().toISOString()).run();
  
  return c.json({ status: true, message: 'Team registered successfully' });
};

export const createBracket = async (c: any) => {
  const { id } = c.req.param();
  // Get registered teams
  const { results: teams } = await c.env.DB.prepare('SELECT * FROM TournamentRegistration WHERE tournamentId = ?').bind(id).all();
  if (teams.length < 2) return c.json({ status: false, error: 'Need at least 2 teams' }, 400);
  // Generate bracket matches (simple single elimination)
  const rounds = Math.ceil(Math.log2(teams.length));
  let matchNumber = 1;
  for (let round = 1; round <= rounds; round++) {
    const matchesInRound = Math.ceil(teams.length / Math.pow(2, round));
    for (let i = 0; i < matchesInRound; i++) {
      const matchId = nanoid();
      const team1Index = i * 2;
      const team2Index = i * 2 + 1;
      const team1Id = teams[team1Index]?.teamId || null;
      const team2Id = teams[team2Index]?.teamId || null;
      await c.env.DB.prepare(
        'INSERT INTO Match (id, tournamentId, team1Id, team2Id, round, matchNumber) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(matchId, id, team1Id, team2Id, round, matchNumber).run();
      matchNumber++;
    }
  }
  return c.json({ status: true, message: 'Bracket created' });
};

export const updateMatch = async (c: any) => {
  const { id } = c.req.param();
  const data = await c.req.json();
  const parse = MatchSchema.partial().safeParse(data);
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
  const sql = `UPDATE Match SET ${fields.join(', ')} WHERE id = ?`;
  await c.env.DB.prepare(sql).bind(...values).run();
  return c.json({ status: true, message: 'Match updated' });
}; 