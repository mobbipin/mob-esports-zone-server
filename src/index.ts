import { Hono } from 'hono'
import auth from './routes/auth'
import players from './routes/players'
import teams from './routes/teams'
import tournaments from './routes/tournaments'
import posts from './routes/posts'
import upload from './routes/upload'
import admin from './routes/admin'
import { cors } from './middleware/cors'

const app = new Hono()

app.use('*', cors)
app.route('/auth', auth)
app.route('/players', players)
app.route('/teams', teams)
app.route('/tournaments', tournaments)
app.route('/posts', posts)
app.route('/upload', upload)
app.route('/admin', admin)

export default app
