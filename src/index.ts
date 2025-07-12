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

const app = new Hono()

app.use('*', cors());

app.get('/', (c) => {
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
      friends: '/friends'
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

export default app
