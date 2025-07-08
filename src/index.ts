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
import messages from './routes/messages';
import notifications from './routes/notifications';
import friends from './routes/friends';

const app = new Hono()

app.use('*', cors());

app.get('/', (c) => c.text('Hello Hono ! I am MOB ESPORTS SERVER'))

app.route('/auth', auth)
app.route('/players', players)
app.route('/teams', teams)
app.route('/tournaments', tournaments)
app.route('/posts', posts)
app.route('/admin', admin)
app.route('/upload', upload)
app.route('/users', users)
app.route('/messages', messages);
app.route('/notifications', notifications);
app.route('/friends', friends);

export default app
