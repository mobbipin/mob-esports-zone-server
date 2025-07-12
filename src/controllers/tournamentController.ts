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
  bannerUrl: z.string().optional(),
  type: z.enum(['solo', 'duo', 'squad']).default('squad'),
  isApproved: z.boolean().optional()
});

const MatchSchema = z.object({
  team1Id: z.string(),
  team2Id: z.string(),
  round: z.number(),
  matchNumber: z.number(),
  winnerId: z.string().optional()
});

const RegisterTeamSchema = z.object({
  teamId: z.string().optional(),
  userId: z.string().optional(),
  selectedPlayers: z.array(z.string()).optional()
});

export const createTournament = async (c: any) => {
  const data = await c.req.json();
  const parse = TournamentSchema.safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  const { name, description, game, startDate, endDate, maxTeams, prizePool, entryFee, rules, imageUrl, bannerUrl, type } = parse.data;
  const finalImageUrl = imageUrl || bannerUrl || null;
  const id = nanoid();
  const user = c.get('user');
  const createdAt = new Date().toISOString();
  
  // Check if user is admin or tournament organizer
  if (user.role !== 'admin' && user.role !== 'tournament_organizer') {
    return c.json({ status: false, error: 'Unauthorized to create tournaments' }, 403);
  }
  
  // Tournament organizers need admin approval
  const isApproved = user.role === 'admin';
  const approvedBy = user.role === 'admin' ? user.id : null;
  const approvedAt = user.role === 'admin' ? createdAt : null;
  
  await c.env.DB.prepare(
    'INSERT INTO Tournament (id, name, description, game, startDate, endDate, maxTeams, prizePool, entryFee, rules, status, createdBy, createdAt, imageUrl, type, isApproved, approvedBy, approvedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, name, description ?? null, game, startDate, endDate, maxTeams, prizePool ?? null, entryFee ?? null, rules ?? null, 'upcoming', user.id, createdAt, finalImageUrl, type, isApproved ? 1 : 0, approvedBy, approvedAt).run();
  
  return c.json({ status: true, data: { id }, message: 'Tournament created' });
};

export const listTournaments = async (c: any) => {
  const { status, playerId } = c.req.query();
  let sql = 'SELECT * FROM Tournament WHERE 1=1';
  const params: any[] = [];
  
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  
  // Only show approved tournaments to players
  if (playerId) {
    sql += ' AND isApproved = 1';
  }
  
  sql += ' ORDER BY createdAt DESC';
  
  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  
  // Transform data
  const transformedTournaments = results.map((tournament: any) => ({
    ...tournament,
    participants: 0, // Will be calculated separately
    maxParticipants: tournament.maxTeams,
    prize: tournament.prizePool ? `$${tournament.prizePool.toLocaleString()}` : "TBA",
    date: new Date(tournament.startDate).toLocaleDateString(),
    startTime: new Date(tournament.startDate).toLocaleTimeString(),
    region: "Global",
    platform: "Mobile",
    longDescription: tournament.description,
    rules: tournament.rules ? tournament.rules.split('\n').filter((rule: string) => rule.trim()) : [
      "All participants must follow fair play guidelines",
      "No cheating or use of unauthorized software",
      "Decisions made by tournament officials are final",
      "Participants must be available for scheduled matches"
    ],
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
    prizes: tournament.prizePool ? [
      { position: "1st Place", amount: `$${Math.floor(tournament.prizePool * 0.5).toLocaleString()}` },
      { position: "2nd Place", amount: `$${Math.floor(tournament.prizePool * 0.3).toLocaleString()}` },
      { position: "3rd Place", amount: `$${Math.floor(tournament.prizePool * 0.2).toLocaleString()}` }
    ] : [
      { position: "1st Place", amount: "TBA" },
      { position: "2nd Place", amount: "TBA" },
      { position: "3rd Place", amount: "TBA" }
    ]
  }));
  
  // Get participant counts
  for (const tournament of transformedTournaments) {
    const { results: registrations } = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM TournamentRegistration WHERE tournamentId = ?'
    ).bind(tournament.id).all();
    tournament.participants = registrations[0].count;
  }
  
  return c.json({ status: true, data: transformedTournaments });
};

export const getTournament = async (c: any) => {
  const { id } = c.req.param();
  const { results } = await c.env.DB.prepare('SELECT * FROM Tournament WHERE id = ?').bind(id).all();
  if (!results.length) return c.json({ status: false, error: 'Tournament not found' }, 404);
  const tournament = results[0];
  
  // Get registered teams with full team details
  const { results: registrations } = await c.env.DB.prepare(`
    SELECT tr.*, t.name as teamName, t.logoUrl as teamLogo, t.tag as teamTag, u.username as playerName, u.avatar as playerAvatar
    FROM TournamentRegistration tr
    LEFT JOIN Team t ON tr.teamId = t.id
    LEFT JOIN User u ON tr.userId = u.id
    WHERE tr.tournamentId = ?
  `).bind(id).all();
  
  // Get matches
  const { results: matches } = await c.env.DB.prepare('SELECT * FROM Match WHERE tournamentId = ? ORDER BY round, matchNumber').bind(id).all();
  
  // Transform data to match frontend expectations
  const transformedTournament = {
    ...tournament,
    // Map backend fields to frontend expectations
    imageUrl: tournament.imageUrl || null,
    participants: registrations.length,
    maxParticipants: tournament.maxTeams,
    prize: tournament.prizePool ? `$${tournament.prizePool.toLocaleString()}` : "TBA",
    date: new Date(tournament.startDate).toLocaleDateString(),
    startTime: new Date(tournament.startDate).toLocaleTimeString(),
    region: "Global",
    platform: "Mobile",
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
    // Transform registered teams/players
    registeredTeams: registrations.map((reg: any) => ({
      id: reg.teamId || reg.userId,
      name: reg.teamName || reg.playerName || "Unknown",
      avatar: reg.teamLogo || reg.playerAvatar || "https://via.placeholder.com/32x32?text=T",
      type: reg.teamId ? 'team' : 'player',
      registeredPlayers: reg.registeredPlayers ? JSON.parse(reg.registeredPlayers) : null
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
  const data = await c.req.json();
  const parse = RegisterTeamSchema.safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  
  const { teamId, userId, selectedPlayers } = parse.data;
  const user = c.get('user');
  
  // Check if tournament exists and is approved
  const { results: tournament } = await c.env.DB.prepare('SELECT * FROM Tournament WHERE id = ? AND isApproved = 1').bind(id).all();
  if (!tournament.length) {
    return c.json({ status: false, error: 'Tournament not found or not approved' }, 404);
  }
  
  const tournamentData = tournament[0];
  
  // Check if user is verified
  if (!user.emailVerified) {
    return c.json({ status: false, error: 'Please verify your email before registering for tournaments' }, 403);
  }
  
  // Handle different tournament types
  if (tournamentData.type === 'solo') {
    // Solo tournament - register individual player
    if (userId && userId !== user.id) {
      return c.json({ status: false, error: 'You can only register yourself for solo tournaments' }, 403);
    }
    
    // Check if user is already registered
    const { results: existingRegistration } = await c.env.DB.prepare(
      'SELECT * FROM TournamentRegistration WHERE tournamentId = ? AND userId = ?'
    ).bind(id, user.id).all();
    
    if (existingRegistration.length > 0) {
      return c.json({ status: false, error: 'You are already registered for this tournament' }, 400);
    }
    
    // Check if tournament is full
    const { results: registrations } = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM TournamentRegistration WHERE tournamentId = ?'
    ).bind(id).all();
    
    if (registrations[0].count >= tournamentData.maxTeams) {
      return c.json({ status: false, error: 'Tournament is full' }, 400);
    }
    
    // Register the player
    await c.env.DB.prepare(
      'INSERT INTO TournamentRegistration (tournamentId, userId, registeredAt) VALUES (?, ?, ?)'
    ).bind(id, user.id, new Date().toISOString()).run();
    
  } else {
    // Team tournament (duo/squad)
    if (!teamId) {
      return c.json({ status: false, error: 'Team ID is required for team tournaments' }, 400);
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
    
    if (registrations[0].count >= tournamentData.maxTeams) {
      return c.json({ status: false, error: 'Tournament is full' }, 400);
    }
    
    // Validate selected players for squad tournaments
    let registeredPlayers = null;
    if (tournamentData.type === 'squad' && selectedPlayers) {
      // Verify all selected players are team members
      const { results: teamMembers } = await c.env.DB.prepare(
        'SELECT userId FROM TeamMembership WHERE teamId = ?'
      ).bind(teamId).all();
      
      const teamMemberIds = teamMembers.map((m: any) => m.userId);
      const invalidPlayers = selectedPlayers.filter((playerId: string) => !teamMemberIds.includes(playerId));
      
      if (invalidPlayers.length > 0) {
        return c.json({ status: false, error: 'Some selected players are not team members' }, 400);
      }
      
      registeredPlayers = JSON.stringify(selectedPlayers);
    }
    
    // Register the team
    await c.env.DB.prepare(
      'INSERT INTO TournamentRegistration (tournamentId, teamId, registeredAt, registeredPlayers) VALUES (?, ?, ?, ?)'
    ).bind(id, teamId, new Date().toISOString(), registeredPlayers).run();
  }
  
  return c.json({ status: true, message: 'Registration successful' });
};

export const withdrawRegistration = async (c: any) => {
  const { id } = c.req.param();
  const user = c.get('user');
  
  // Check if tournament exists
  const { results: tournament } = await c.env.DB.prepare('SELECT * FROM Tournament WHERE id = ?').bind(id).all();
  if (!tournament.length) {
    return c.json({ status: false, error: 'Tournament not found' }, 404);
  }
  
  const tournamentData = tournament[0];
  
  if (tournamentData.type === 'solo') {
    // Withdraw individual registration
    const { results } = await c.env.DB.prepare(
      'DELETE FROM TournamentRegistration WHERE tournamentId = ? AND userId = ?'
    ).bind(id, user.id).run();
    
    if (results.changes === 0) {
      return c.json({ status: false, error: 'You are not registered for this tournament' }, 400);
    }
  } else {
    // Withdraw team registration - only team owner can withdraw
    const { results: teamMembership } = await c.env.DB.prepare(
      'SELECT * FROM TeamMembership WHERE userId = ? AND role = "owner"'
    ).bind(user.id).all();
    
    if (!teamMembership.length) {
      return c.json({ status: false, error: 'Only team owners can withdraw team registrations' }, 403);
    }
    
    const teamId = teamMembership[0].teamId;
    const { results } = await c.env.DB.prepare(
      'DELETE FROM TournamentRegistration WHERE tournamentId = ? AND teamId = ?'
    ).bind(id, teamId).run();
    
    if (results.changes === 0) {
      return c.json({ status: false, error: 'Team is not registered for this tournament' }, 400);
    }
  }
  
  return c.json({ status: true, message: 'Registration withdrawn successfully' });
};

export const approveTournament = async (c: any) => {
  const { id } = c.req.param();
  const user = c.get('user');
  
  if (user.role !== 'admin') {
    return c.json({ status: false, error: 'Unauthorized' }, 403);
  }
  
  await c.env.DB.prepare(
    'UPDATE Tournament SET isApproved = 1, approvedBy = ?, approvedAt = ? WHERE id = ?'
  ).bind(user.id, new Date().toISOString(), id).run();
  
  return c.json({ status: true, message: 'Tournament approved' });
};

export const getRegisteredTeams = async (c: any) => {
  const { id } = c.req.param();
  
  // Check if tournament exists
  const { results: tournament } = await c.env.DB.prepare('SELECT * FROM Tournament WHERE id = ?').bind(id).all();
  if (!tournament.length) {
    return c.json({ status: false, error: 'Tournament not found' }, 404);
  }
  
  const { results: registrations } = await c.env.DB.prepare(`
    SELECT tr.*, t.name as teamName, t.logoUrl as teamLogo, t.tag as teamTag, u.username as playerName, u.avatar as playerAvatar
    FROM TournamentRegistration tr
    LEFT JOIN Team t ON tr.teamId = t.id
    LEFT JOIN User u ON tr.userId = u.id
    WHERE tr.tournamentId = ?
    ORDER BY tr.registeredAt ASC
  `).bind(id).all();
  
  const transformedRegistrations = registrations.map((reg: any) => {
    const base = {
      id: reg.teamId || reg.userId,
      name: reg.teamName || reg.playerName || "Unknown",
      avatar: reg.teamLogo || reg.playerAvatar || "https://via.placeholder.com/32x32?text=T",
      type: reg.teamId ? 'team' : 'player',
      registeredAt: reg.registeredAt
    };
    
    if (reg.teamId && reg.registeredPlayers) {
      return {
        ...base,
        registeredPlayers: JSON.parse(reg.registeredPlayers)
      };
    }
    
    return base;
  });
  
  return c.json({ status: true, data: transformedRegistrations });
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