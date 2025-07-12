import { nanoid } from 'nanoid';
import { z } from 'zod';

const PendingTournamentSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().min(10).optional(),
  game: z.string().min(2).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  maxTeams: z.number().min(2).optional(),
  prizePool: z.number().min(0).optional(),
  entryFee: z.number().min(0).optional(),
  rules: z.string().optional(),
  type: z.enum(['solo', 'duo', 'squad']).default('squad').optional(),
  imageUrl: z.string().url().optional(),
  originalId: z.string().optional(), // For update/delete operations on approved content
  action: z.enum(['create', 'update', 'delete']).default('create')
});

const PendingPostSchema = z.object({
  title: z.string().min(2).optional(),
  content: z.string().min(10).optional(),
  imageUrl: z.string().url().optional(),
  originalId: z.string().optional(), // For update/delete operations on approved content
  action: z.enum(['create', 'update', 'delete']).default('create')
});

const ReviewSchema = z.object({
  approved: z.boolean(),
  reviewNotes: z.string().optional()
});

export const createPendingTournament = async (c: any) => {
  const data = await c.req.json();
  const parse = PendingTournamentSchema.safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  
  const user = c.get('user');
  
  // Check if user is tournament organizer
  if (user.role !== 'tournament_organizer') {
    return c.json({ status: false, error: 'Unauthorized to create tournaments' }, 403);
  }
  
  // Check if organizer is approved
  if (!user.isApproved) {
    return c.json({ status: false, error: 'Your account is pending admin approval. You cannot create tournaments yet.' }, 403);
  }
  
  const id = nanoid();
  const createdAt = new Date().toISOString();
  
  // Handle different actions
  if (parse.data.action === 'update' && parse.data.originalId) {
    // Validate required fields for update
    if (!parse.data.name || !parse.data.game || !parse.data.startDate || !parse.data.endDate || !parse.data.maxTeams) {
      return c.json({ status: false, error: 'All required fields must be provided for update' }, 400);
    }
    
    // Verify the original tournament exists and belongs to the user
    const { results: originalTournament } = await c.env.DB.prepare(
      'SELECT * FROM Tournament WHERE id = ? AND createdBy = ? AND isApproved = 1'
    ).bind(parse.data.originalId, user.id).all();
    
    if (!originalTournament.length) {
      return c.json({ status: false, error: 'Original tournament not found or unauthorized' }, 404);
    }
    
    await c.env.DB.prepare(
      'INSERT INTO PendingTournament (id, name, description, game, startDate, endDate, maxTeams, prizePool, entryFee, rules, type, imageUrl, createdBy, createdAt, originalId, action) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id, parse.data.name, parse.data.description, parse.data.game, 
      parse.data.startDate, parse.data.endDate, parse.data.maxTeams, 
      parse.data.prizePool, parse.data.entryFee, parse.data.rules, 
      parse.data.type, parse.data.imageUrl, user.id, createdAt, parse.data.originalId, 'update'
    ).run();
    
    return c.json({ status: true, data: { id }, message: 'Tournament update submitted for review' });
  } else if (parse.data.action === 'delete' && parse.data.originalId) {
    // For delete, we only need originalId - no other fields required
    // Verify the original tournament exists and belongs to the user
    const { results: originalTournament } = await c.env.DB.prepare(
      'SELECT * FROM Tournament WHERE id = ? AND createdBy = ? AND isApproved = 1'
    ).bind(parse.data.originalId, user.id).all();
    
    if (!originalTournament.length) {
      return c.json({ status: false, error: 'Original tournament not found or unauthorized' }, 404);
    }
    
    await c.env.DB.prepare(
      'INSERT INTO PendingTournament (id, name, description, game, startDate, endDate, maxTeams, prizePool, entryFee, rules, type, imageUrl, createdBy, createdAt, originalId, action) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id, originalTournament[0].name, originalTournament[0].description, originalTournament[0].game, 
      originalTournament[0].startDate, originalTournament[0].endDate, originalTournament[0].maxTeams, 
      originalTournament[0].prizePool, originalTournament[0].entryFee, originalTournament[0].rules, 
      originalTournament[0].type, originalTournament[0].imageUrl, user.id, createdAt, parse.data.originalId, 'delete'
    ).run();
    
    return c.json({ status: true, data: { id }, message: 'Tournament deletion submitted for review' });
  } else {
    // Regular create action - validate required fields
    if (!parse.data.name || !parse.data.game || !parse.data.startDate || !parse.data.endDate || !parse.data.maxTeams) {
      return c.json({ status: false, error: 'All required fields must be provided for creation' }, 400);
    }
    
    await c.env.DB.prepare(
      'INSERT INTO PendingTournament (id, name, description, game, startDate, endDate, maxTeams, prizePool, entryFee, rules, type, imageUrl, createdBy, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id, parse.data.name, parse.data.description, parse.data.game, 
      parse.data.startDate, parse.data.endDate, parse.data.maxTeams, 
      parse.data.prizePool, parse.data.entryFee, parse.data.rules, 
      parse.data.type, parse.data.imageUrl, user.id, createdAt
    ).run();
    
    return c.json({ status: true, data: { id }, message: 'Tournament submitted for review' });
  }
};

export const createPendingPost = async (c: any) => {
  const data = await c.req.json();
  const parse = PendingPostSchema.safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  
  const user = c.get('user');
  
  // Check if user is tournament organizer
  if (user.role !== 'tournament_organizer') {
    return c.json({ status: false, error: 'Unauthorized to create posts' }, 403);
  }
  
  // Check if organizer is approved
  if (!user.isApproved) {
    return c.json({ status: false, error: 'Your account is pending admin approval. You cannot create posts yet.' }, 403);
  }
  
  const id = nanoid();
  const createdAt = new Date().toISOString();
  
  // Handle different actions
  if (parse.data.action === 'update' && parse.data.originalId) {
    // Validate required fields for update
    if (!parse.data.title || !parse.data.content) {
      return c.json({ status: false, error: 'Title and content are required for update' }, 400);
    }
    
    // Verify the original post exists and belongs to the user
    const { results: originalPost } = await c.env.DB.prepare(
      'SELECT * FROM Post WHERE id = ? AND createdBy = ? AND isApproved = 1'
    ).bind(parse.data.originalId, user.id).all();
    
    if (!originalPost.length) {
      return c.json({ status: false, error: 'Original post not found or unauthorized' }, 404);
    }
    
    await c.env.DB.prepare(
      'INSERT INTO PendingPost (id, title, content, imageUrl, createdBy, createdAt, originalId, action) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id, parse.data.title, parse.data.content, parse.data.imageUrl, user.id, createdAt, parse.data.originalId, 'update'
    ).run();
    
    return c.json({ status: true, data: { id }, message: 'Post update submitted for review' });
  } else if (parse.data.action === 'delete' && parse.data.originalId) {
    // For delete, we only need originalId - no other fields required
    // Verify the original post exists and belongs to the user
    const { results: originalPost } = await c.env.DB.prepare(
      'SELECT * FROM Post WHERE id = ? AND createdBy = ? AND isApproved = 1'
    ).bind(parse.data.originalId, user.id).all();
    
    if (!originalPost.length) {
      return c.json({ status: false, error: 'Original post not found or unauthorized' }, 404);
    }
    
    await c.env.DB.prepare(
      'INSERT INTO PendingPost (id, title, content, imageUrl, createdBy, createdAt, originalId, action) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id, originalPost[0].title, originalPost[0].content, originalPost[0].imageUrl, user.id, createdAt, parse.data.originalId, 'delete'
    ).run();
    
    return c.json({ status: true, data: { id }, message: 'Post deletion submitted for review' });
  } else {
    // Regular create action - validate required fields
    if (!parse.data.title || !parse.data.content) {
      return c.json({ status: false, error: 'Title and content are required for creation' }, 400);
    }
    
    await c.env.DB.prepare(
      'INSERT INTO PendingPost (id, title, content, imageUrl, createdBy, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, parse.data.title, parse.data.content, parse.data.imageUrl, user.id, createdAt).run();
    
    return c.json({ status: true, data: { id }, message: 'Post submitted for review' });
  }
};

export const listPendingTournaments = async (c: any) => {
  const user = c.get('user');
  const { organizerId } = c.req.query();
  
  let sql = `
    SELECT pt.*, u.username as organizerName, u.email as organizerEmail 
    FROM PendingTournament pt 
    LEFT JOIN User u ON pt.createdBy = u.id 
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (organizerId) {
    sql += ' AND pt.createdBy = ?';
    params.push(organizerId);
  }
  
  sql += ' ORDER BY pt.createdAt DESC';
  
  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ status: true, data: results });
};

export const listPendingPosts = async (c: any) => {
  const user = c.get('user');
  const { organizerId } = c.req.query();
  
  let sql = `
    SELECT pp.*, u.username as organizerName, u.email as organizerEmail 
    FROM PendingPost pp 
    LEFT JOIN User u ON pp.createdBy = u.id 
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (organizerId) {
    sql += ' AND pp.createdBy = ?';
    params.push(organizerId);
  }
  
  sql += ' ORDER BY pp.createdAt DESC';
  
  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ status: true, data: results });
};

export const reviewPendingTournament = async (c: any) => {
  const { id } = c.req.param();
  const data = await c.req.json();
  const user = c.get('user');
  
  if (user.role !== 'admin') {
    return c.json({ status: false, error: 'Unauthorized' }, 403);
  }
  
  try {
    // Get the pending tournament
    const { results: pendingTournament } = await c.env.DB.prepare(
      'SELECT * FROM PendingTournament WHERE id = ?'
    ).bind(id).all();
    
    if (!pendingTournament.length) {
      return c.json({ status: false, error: 'Pending tournament not found' }, 404);
    }
    
    const tournament = pendingTournament[0];
    
    if (data.approved) {
      if (tournament.action === 'create') {
        // Create new tournament
        const newId = nanoid();
        await c.env.DB.prepare(
          'INSERT INTO Tournament (id, name, description, game, startDate, endDate, maxTeams, prizePool, entryFee, rules, type, imageUrl, createdBy, createdAt, isApproved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)'
        ).bind(
          newId, tournament.name, tournament.description, tournament.game, 
          tournament.startDate, tournament.endDate, tournament.maxTeams, 
          tournament.prizePool, tournament.entryFee, tournament.rules, 
          tournament.type, tournament.imageUrl, tournament.createdBy, tournament.createdAt
        ).run();
        
        // Send notification to organizer
        await c.env.DB.prepare(
          'INSERT INTO Notification (id, userId, type, title, message, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(
          nanoid(), tournament.createdBy, 'tournament_approved', 
          'Tournament Approved', 
          `Your tournament "${tournament.name}" has been approved and is now live!`, 
          new Date().toISOString()
        ).run();
        
      } else if (tournament.action === 'update') {
        // Update existing tournament
        await c.env.DB.prepare(
          'UPDATE Tournament SET name = ?, description = ?, game = ?, startDate = ?, endDate = ?, maxTeams = ?, prizePool = ?, entryFee = ?, rules = ?, type = ?, imageUrl = ? WHERE id = ?'
        ).bind(
          tournament.name, tournament.description, tournament.game, 
          tournament.startDate, tournament.endDate, tournament.maxTeams, 
          tournament.prizePool, tournament.entryFee, tournament.rules, 
          tournament.type, tournament.imageUrl, tournament.originalId
        ).run();
        
        // Send notification to organizer
        await c.env.DB.prepare(
          'INSERT INTO Notification (id, userId, type, title, message, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(
          nanoid(), tournament.createdBy, 'tournament_updated', 
          'Tournament Update Approved', 
          `Your update to tournament "${tournament.name}" has been approved!`, 
          new Date().toISOString()
        ).run();
        
      } else if (tournament.action === 'delete') {
        // Delete tournament
        await c.env.DB.prepare(
          'DELETE FROM Tournament WHERE id = ?'
        ).bind(tournament.originalId).run();
        
        // Send notification to organizer
        await c.env.DB.prepare(
          'INSERT INTO Notification (id, userId, type, title, message, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(
          nanoid(), tournament.createdBy, 'tournament_deleted', 
          'Tournament Deletion Approved', 
          `Your request to delete tournament "${tournament.name}" has been approved.`, 
          new Date().toISOString()
        ).run();
      }
    } else {
      // Rejected - send notification
      let actionText = tournament.action === 'create' ? 'creation' : 
                      tournament.action === 'update' ? 'update' : 'deletion';
      
      await c.env.DB.prepare(
        'INSERT INTO Notification (id, userId, type, title, message, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(
        nanoid(), tournament.createdBy, 'tournament_rejected', 
        'Tournament Request Rejected', 
        `Your tournament ${actionText} request for "${tournament.name}" has been rejected. ${data.reviewNotes ? `Reason: ${data.reviewNotes}` : ''}`, 
        new Date().toISOString()
      ).run();
    }
    
    // Delete the pending tournament
    await c.env.DB.prepare(
      'DELETE FROM PendingTournament WHERE id = ?'
    ).bind(id).run();
    
    return c.json({ 
      status: true, 
      message: data.approved ? 'Tournament approved' : 'Tournament rejected' 
    });
    
  } catch (error) {
    console.error('Error reviewing pending tournament:', error);
    return c.json({ status: false, error: 'Failed to review tournament' }, 500);
  }
};

export const reviewPendingPost = async (c: any) => {
  const { id } = c.req.param();
  const data = await c.req.json();
  const user = c.get('user');
  
  if (user.role !== 'admin') {
    return c.json({ status: false, error: 'Unauthorized' }, 403);
  }
  
  try {
    // Get the pending post
    const { results: pendingPost } = await c.env.DB.prepare(
      'SELECT * FROM PendingPost WHERE id = ?'
    ).bind(id).all();
    
    if (!pendingPost.length) {
      return c.json({ status: false, error: 'Pending post not found' }, 404);
    }
    
    const post = pendingPost[0];
    
    if (data.approved) {
      if (post.action === 'create') {
        // Create new post
        const newId = nanoid();
        await c.env.DB.prepare(
          'INSERT INTO Post (id, title, content, imageUrl, createdBy, createdAt, isApproved) VALUES (?, ?, ?, ?, ?, ?, 1)'
        ).bind(newId, post.title, post.content, post.imageUrl, post.createdBy, post.createdAt).run();
        
        // Send notification to organizer
        await c.env.DB.prepare(
          'INSERT INTO Notification (id, userId, type, title, message, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(
          nanoid(), post.createdBy, 'post_approved', 
          'Post Approved', 
          `Your post "${post.title}" has been approved and is now live!`, 
          new Date().toISOString()
        ).run();
        
      } else if (post.action === 'update') {
        // Update existing post
        await c.env.DB.prepare(
          'UPDATE Post SET title = ?, content = ?, imageUrl = ? WHERE id = ?'
        ).bind(post.title, post.content, post.imageUrl, post.originalId).run();
        
        // Send notification to organizer
        await c.env.DB.prepare(
          'INSERT INTO Notification (id, userId, type, title, message, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(
          nanoid(), post.createdBy, 'post_updated', 
          'Post Update Approved', 
          `Your update to post "${post.title}" has been approved!`, 
          new Date().toISOString()
        ).run();
        
      } else if (post.action === 'delete') {
        // Delete post
        await c.env.DB.prepare(
          'DELETE FROM Post WHERE id = ?'
        ).bind(post.originalId).run();
        
        // Send notification to organizer
        await c.env.DB.prepare(
          'INSERT INTO Notification (id, userId, type, title, message, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(
          nanoid(), post.createdBy, 'post_deleted', 
          'Post Deletion Approved', 
          `Your request to delete post "${post.title}" has been approved.`, 
          new Date().toISOString()
        ).run();
      }
    } else {
      // Rejected - send notification
      let actionText = post.action === 'create' ? 'creation' : 
                      post.action === 'update' ? 'update' : 'deletion';
      
      await c.env.DB.prepare(
        'INSERT INTO Notification (id, userId, type, title, message, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(
        nanoid(), post.createdBy, 'post_rejected', 
        'Post Request Rejected', 
        `Your post ${actionText} request for "${post.title}" has been rejected. ${data.reviewNotes ? `Reason: ${data.reviewNotes}` : ''}`, 
        new Date().toISOString()
      ).run();
    }
    
    // Delete the pending post
    await c.env.DB.prepare(
      'DELETE FROM PendingPost WHERE id = ?'
    ).bind(id).run();
    
    return c.json({ 
      status: true, 
      message: data.approved ? 'Post approved' : 'Post rejected' 
    });
    
  } catch (error) {
    console.error('Error reviewing pending post:', error);
    return c.json({ status: false, error: 'Failed to review post' }, 500);
  }
};

export const deletePendingTournament = async (c: any) => {
  const { id } = c.req.param();
  const user = c.get('user');
  
  const { results } = await c.env.DB.prepare('SELECT * FROM PendingTournament WHERE id = ?').bind(id).all();
  if (!results.length) return c.json({ status: false, error: 'Pending tournament not found' }, 404);
  
  const pendingTournament = results[0];
  
  // Only creator or admin can delete
  if (pendingTournament.createdBy !== user.id && user.role !== 'admin') {
    return c.json({ status: false, error: 'Unauthorized' }, 403);
  }
  
  await c.env.DB.prepare('DELETE FROM PendingTournament WHERE id = ?').bind(id).run();
  return c.json({ status: true, message: 'Pending tournament deleted' });
};

export const deletePendingPost = async (c: any) => {
  const { id } = c.req.param();
  const user = c.get('user');
  
  const { results } = await c.env.DB.prepare('SELECT * FROM PendingPost WHERE id = ?').bind(id).all();
  if (!results.length) return c.json({ status: false, error: 'Pending post not found' }, 404);
  
  const pendingPost = results[0];
  
  // Only creator or admin can delete
  if (pendingPost.createdBy !== user.id && user.role !== 'admin') {
    return c.json({ status: false, error: 'Unauthorized' }, 403);
  }
  
  await c.env.DB.prepare('DELETE FROM PendingPost WHERE id = ?').bind(id).run();
  return c.json({ status: true, message: 'Pending post deleted' });
}; 

export const updatePendingTournament = async (c: any) => {
  const { id } = c.req.param();
  const data = await c.req.json();
  const parse = PendingTournamentSchema.safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  
  const user = c.get('user');
  
  // Check if user is tournament organizer
  if (user.role !== 'tournament_organizer') {
    return c.json({ status: false, error: 'Unauthorized to edit tournaments' }, 403);
  }
  
  // Check if organizer is approved
  if (!user.isApproved) {
    return c.json({ status: false, error: 'Your account is pending admin approval. You cannot edit tournaments yet.' }, 403);
  }
  
  // Check if tournament exists and belongs to user
  const { results } = await c.env.DB.prepare('SELECT * FROM PendingTournament WHERE id = ? AND createdBy = ?').bind(id, user.id).all();
  if (!results.length) {
    return c.json({ status: false, error: 'Tournament not found or unauthorized' }, 404);
  }
  
  // Update the tournament
  await c.env.DB.prepare(
    'UPDATE PendingTournament SET name = ?, description = ?, game = ?, startDate = ?, endDate = ?, maxTeams = ?, prizePool = ?, entryFee = ?, rules = ?, type = ?, imageUrl = ? WHERE id = ?'
  ).bind(
    parse.data.name, parse.data.description, parse.data.game, 
    parse.data.startDate, parse.data.endDate, parse.data.maxTeams, 
    parse.data.prizePool, parse.data.entryFee, parse.data.rules, 
    parse.data.type, parse.data.imageUrl, id
  ).run();
  
  return c.json({ status: true, message: 'Tournament updated successfully' });
};

export const updatePendingPost = async (c: any) => {
  const { id } = c.req.param();
  const data = await c.req.json();
  const parse = PendingPostSchema.safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  
  const user = c.get('user');
  
  // Check if user is tournament organizer
  if (user.role !== 'tournament_organizer') {
    return c.json({ status: false, error: 'Unauthorized to edit posts' }, 403);
  }
  
  // Check if organizer is approved
  if (!user.isApproved) {
    return c.json({ status: false, error: 'Your account is pending admin approval. You cannot edit posts yet.' }, 403);
  }
  
  // Check if post exists and belongs to user
  const { results } = await c.env.DB.prepare('SELECT * FROM PendingPost WHERE id = ? AND createdBy = ?').bind(id, user.id).all();
  if (!results.length) {
    return c.json({ status: false, error: 'Post not found or unauthorized' }, 404);
  }
  
  // Update the post
  await c.env.DB.prepare(
    'UPDATE PendingPost SET title = ?, content = ?, imageUrl = ? WHERE id = ?'
  ).bind(parse.data.title, parse.data.content, parse.data.imageUrl, id).run();
  
  return c.json({ status: true, message: 'Post updated successfully' });
};

export const getOrganizerTournaments = async (c: any) => {
  const user = c.get('user');
  const { organizerId } = c.req.query();
  
  const targetUserId = organizerId || user.id;
  
  // Get approved tournaments
  const { results: approvedTournaments } = await c.env.DB.prepare(`
    SELECT t.*, 'approved' as source, NULL as reviewStatus, NULL as reviewNotes
    FROM Tournament t 
    WHERE t.createdBy = ? AND t.isApproved = 1
  `).bind(targetUserId).all();
  
  // Get pending tournaments
  const { results: pendingTournaments } = await c.env.DB.prepare(`
    SELECT pt.*, 'pending' as source, pt.reviewStatus, pt.reviewNotes
    FROM PendingTournament pt 
    WHERE pt.createdBy = ?
  `).bind(targetUserId).all();
  
  // Combine and sort by creation date
  const allTournaments = [...approvedTournaments, ...pendingTournaments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  return c.json({ status: true, data: allTournaments });
};

export const getOrganizerPosts = async (c: any) => {
  const user = c.get('user');
  const { organizerId } = c.req.query();
  
  const targetUserId = organizerId || user.id;
  
  // Get approved posts
  const { results: approvedPosts } = await c.env.DB.prepare(`
    SELECT p.*, 'approved' as source, NULL as reviewStatus, NULL as reviewNotes
    FROM Post p 
    WHERE p.createdBy = ? AND p.isApproved = 1
  `).bind(targetUserId).all();
  
  // Get pending posts
  const { results: pendingPosts } = await c.env.DB.prepare(`
    SELECT pp.*, 'pending' as source, pp.reviewStatus, pp.reviewNotes
    FROM PendingPost pp 
    WHERE pp.createdBy = ?
  `).bind(targetUserId).all();
  
  // Combine and sort by creation date
  const allPosts = [...approvedPosts, ...pendingPosts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  return c.json({ status: true, data: allPosts });
}; 