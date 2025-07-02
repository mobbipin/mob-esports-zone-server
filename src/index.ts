import { Hono } from 'hono'
import { cors } from 'hono/cors'
import auth from './routes/auth'
import players from './routes/players'
import teams from './routes/teams'
import tournaments from './routes/tournaments'
import posts from './routes/posts'
import admin from './routes/admin'

const app = new Hono()

app.use('*', cors({
  origin: [
    'https://esportszone.mobbysc.com',
    'http://localhost:5173'
  ],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}))

app.get('/', (c) => c.text('Hello Hono ! I am MOB ESPORTS SERVER'))

app.route('/auth', auth)
app.route('/players', players)
app.route('/teams', teams)
app.route('/tournaments', tournaments)
app.route('/posts', posts)
app.route('/admin', admin)

export default app
