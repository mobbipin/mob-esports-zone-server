import 'dotenv/config';
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import auth from './routes/auth'
import players from './routes/players'
import teams from './routes/teams'
import tournaments from './routes/tournaments'
import posts from './routes/posts'
import admin from './routes/admin'
import upload from './routes/upload'
import users from './routes/users'
import notifications from './routes/notifications';
import friends from './routes/friends';
import pending from './routes/pending';
import test from './routes/test';

const app = new Hono()

app.use('*', cors());

app.get('/', (c) => {
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  console.log('SMTP_PORT:', process.env.SMTP_PORT);
  console.log('SMTP_SECURE:', process.env.SMTP_SECURE);
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('SMTP_PASS:', process.env.SMTP_PASS);
  console.log('FROM_EMAIL:', process.env.FROM_EMAIL);
  return c.json({ 
    status: true, 
    message: 'MOB Esports API',
    version: '2.0.0',
    endpoints: {
      auth: '/auth',
      players: '/players',
      teams: '/teams',
      tournaments: '/tournaments',
      posts: '/posts',
      admin: '/admin',
      upload: '/upload',
      users: '/users',
      notifications: '/notifications',
      friends: '/friends',
      pending: '/pending'
    }
  })
})

app.route('/auth', auth)
app.route('/players', players)
app.route('/teams', teams)
app.route('/tournaments', tournaments)
app.route('/posts', posts)
app.route('/admin', admin)
app.route('/upload', upload)
app.route('/users', users)
app.route('/notifications', notifications)
app.route('/friends', friends)
app.route('/pending', pending)
app.route('/test', test)

export default app
