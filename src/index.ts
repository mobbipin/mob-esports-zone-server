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
app.get('/ws', (c) => {
  if (c.req.header('Upgrade') !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 });
  }
  // @ts-ignore: WebSocketPair is available in Cloudflare Workers
  const webSocketPair = new (globalThis.WebSocketPair || WebSocketPair)();
  const client = webSocketPair[0];
  const server = webSocketPair[1];
  server.accept();
  server.addEventListener('message', (event: MessageEvent) => {
    // Echo the message for now
    server.send(event.data);
  });
  server.addEventListener('close', () => {
    // Optionally handle close
  });
  return new Response(null, {
    status: 101,
    // @ts-ignore: webSocket is a valid property in Cloudflare Workers
    webSocket: client,
  } as any);
});

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
