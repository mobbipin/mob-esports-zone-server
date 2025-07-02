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
