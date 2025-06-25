# MOB ESPORTS ZONE - Backend API

A backend API for the MOB ESPORTS ZONE web application built with Hono, Bun runtime, Cloudflare Workers, Cloudflare D1 (SQLite), Cloudflare R2, and JWT authentication.

## Features

- 🔐 JWT Authentication with role-based access control
- 👥 Player and Team Management
- 🏆 Tournament CRUD and Bracket Management
- 📰 Posts/News Feed
- 📁 File Uploads to Cloudflare R2
- 🎯 Admin Panel for Tournament Management

## Tech Stack

- **Runtime**: Bun + Cloudflare Workers
- **Framework**: Hono
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2
- **ORM**: Direct SQL queries (optimized for D1)
- **Authentication**: JWT
- **Validation**: Zod

## Setup

1. Install dependencies:
```bash
bun install
```

2. Set up environment variables in `wrangler.toml`:
```toml
[vars]
JWT_SECRET = "your-secret-key"
ADMIN_REGISTRATION_CODE = "MOB_ADMIN_2024"  # Change this for production
```

3. Deploy to Cloudflare Workers:
```bash
bun run deploy
```

## Admin Registration

To register an admin account, you need to provide the admin registration code:

### Register Admin API
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "admin@mobesports.com",
  "password": "securepassword123",
  "role": "admin",
  "username": "admin",
  "displayName": "Admin User",
  "adminCode": "MOB_ADMIN_2024"
}
```

**Important**: 
- The `adminCode` field is **required** when registering as an admin
- Default admin code is `MOB_ADMIN_2024` (change this in production)
- Only users with the correct admin code can register as admins
- Regular player registration doesn't require the admin code

### Register Player API
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "player@example.com",
  "password": "password123",
  "role": "player",
  "username": "player1",
  "displayName": "Player One"
}
```

## API Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "status": true,
  "data": { ... },  // Optional: response data
  "message": "Success message"  // Optional: success message
}
```

### Error Response
```json
{
  "status": false,
  "error": "Error message or validation details"
}
```

### Examples

**Login Success:**
```json
{
  "status": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "role": "admin",
      "email": "admin@example.com",
      "username": "admin",
      "displayName": "Admin User"
    }
  }
}
```

**Validation Error:**
```json
{
  "status": false,
  "error": {
    "fieldErrors": {
      "email": ["Invalid email format"]
    }
  }
}
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register user (admin/player)
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user profile

### Players
- `GET /players/:id` - Get player profile
- `PUT /players/:id` - Update player profile
- `GET /players` - List players (with pagination & search)

### Teams
- `POST /teams` - Create team
- `GET /teams/:id` - Get team details
- `PUT /teams/:id` - Update team
- `DELETE /teams/:id` - Delete team
- `POST /teams/:id/invite` - Invite player to team

### Tournaments
- `POST /tournaments` - Create tournament (admin only)
- `GET /tournaments/:id` - Get tournament details
- `PUT /tournaments/:id` - Update tournament (admin only)
- `DELETE /tournaments/:id` - Delete tournament (admin only)
- `GET /tournaments` - List tournaments
- `POST /tournaments/:id/register` - Register team for tournament
- `POST /tournaments/:id/bracket` - Create bracket (admin only)
- `PUT /tournaments/:id/matches/:matchId` - Update match result (admin only)

### Posts
- `POST /posts` - Create post (admin only)
- `GET /posts/:id` - Get post details
- `PUT /posts/:id` - Update post (admin only)
- `DELETE /posts/:id` - Delete post (admin only)
- `GET /posts` - List posts (with pagination)

### File Uploads
- `POST /upload/file` - Upload general file
- `GET /upload/:id` - Get upload details
- `GET /upload` - List uploads
- `DELETE /upload/:id` - Delete upload
- `POST /upload/avatar` - Upload user avatar
- `POST /upload/team-logo` - Upload team logo
- `POST /upload/tournament-banner` - Upload tournament banner

## Database Schema

The application uses Cloudflare D1 with the following main tables:
- `User` - User accounts and authentication
- `PlayerProfile` - Player-specific data
- `Team` - Team information
- `TeamMembership` - Team member relationships
- `Tournament` - Tournament details
- `TournamentRegistration` - Team registrations for tournaments
- `Match` - Tournament match data
- `Post` - News/posts content
- `FileUpload` - File upload tracking

## Development

Run locally with Bun:
```bash
bun run dev
```

Run tests:
```bash
bun test
```

## Deployment

Deploy to Cloudflare Workers:
```bash
bun run deploy
```

## Security Notes

- Change the default admin registration code in production
- Use strong JWT secrets
- Implement rate limiting for production
- Validate all inputs with Zod schemas
- Use HTTPS in production

```txt
npm install
npm run dev
```

```txt
npm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```
