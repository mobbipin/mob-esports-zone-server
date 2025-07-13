# MOB Esports Zone - Backend Server

A high-performance backend API for the MOB Esports Zone platform. Built with Node.js, Hono framework, Drizzle ORM, and Cloudflare D1 database.

## 🚀 Features

### 🔐 Authentication & Authorization
- **JWT-based authentication** with secure token management
- **Role-based access control** (Player, Tournament Organizer, Admin)
- **Email verification** system with secure tokens
- **Password reset** via email OTP
- **Account restoration** for deleted accounts
- **Account deletion** with soft delete support
- **Rate limiting** to prevent abuse

### 👥 User Management
- **User registration** with role selection
- **Profile management** for all user types
- **Admin approval system** for tournament organizers
- **User banning/unbanning** with admin controls
- **Account status tracking** (active, banned, deleted, pending)
- **Bulk user operations** for admins

### 🏆 Tournament System
- **Tournament creation** by admins and approved organizers
- **Tournament approval workflow** for organizer-created tournaments
- **Tournament registration** for players and teams
- **Bracket management** and match scheduling
- **Tournament status tracking** (upcoming, ongoing, completed)
- **Prize pool and entry fee** management
- **Tournament types** (solo, duo, squad)

### 📝 Content Management
- **Post creation** by admins and approved organizers
- **Content approval workflow** for organizer-created posts
- **Post likes and engagement** tracking
- **Content moderation** tools for admins
- **Pending content system** for updates and deletions

### 👥 Team Management
- **Team creation** and management
- **Team membership** with roles (owner, member)
- **Team invites** and request system
- **Team statistics** and performance tracking
- **Team logos** and profile management

### 🤝 Social Features
- **Friend system** with request/accept/decline
- **Player search** and discovery
- **Friend list management**
- **Social connections** tracking

### 📊 Analytics & Monitoring
- **Platform analytics** (users, tournaments, posts)
- **User activity tracking**
- **Performance monitoring**
- **Error logging** and debugging

### 🔄 Pending System
- **Content approval workflow** for organizers
- **Update/delete requests** for approved content
- **Admin review system** for pending changes
- **Notification system** for status updates

## 🛠️ Tech Stack

- **Runtime:** Node.js with Bun
- **Framework:** Hono (lightweight, fast web framework)
- **Database:** Cloudflare D1 (SQLite-based)
- **ORM:** Drizzle ORM with type-safe queries
- **Authentication:** JWT with bcrypt for password hashing
- **Email:** Custom email service integration
- **File Upload:** Cloudflare R2 integration
- **Validation:** Zod schema validation
- **Deployment:** Cloudflare Workers

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mob-esports-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**
   Create a `.env` file:
   ```env
   # Database
   DB_URL=your-cloudflare-d1-database-url
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   
   # Email
   EMAIL_SERVICE=your-email-service
   EMAIL_USER=your-email-user
   EMAIL_PASS=your-email-password
   
   # Admin
   ADMIN_REGISTRATION_CODE=MOB_ADMIN_2024
   
   # Frontend
   FRONTEND_URL=http://localhost:5173
   
   # File Upload
   R2_ACCOUNT_ID=your-r2-account-id
   R2_ACCESS_KEY_ID=your-r2-access-key
   R2_SECRET_ACCESS_KEY=your-r2-secret-key
   R2_BUCKET_NAME=your-bucket-name
   ```

4. **Set up database**
   ```bash
   # Run migrations
   bun run drizzle-kit push
   
   # Or for development
   bun run drizzle-kit migrate
   ```

5. **Start the development server**
   ```bash
   bun run dev
   ```

6. **Deploy to Cloudflare Workers**
   ```bash
   bun run deploy
   ```

## 🏗️ Project Structure

```
src/
├── controllers/        # Business logic handlers
│   ├── authController.ts
│   ├── tournamentController.ts
│   ├── postController.ts
│   ├── teamController.ts
│   ├── playerController.ts
│   ├── friendsController.ts
│   ├── notificationController.ts
│   ├── pendingController.ts
│   └── uploadController.ts
├── db/                # Database configuration
│   ├── drizzle.ts
│   ├── models.ts
│   └── schema.sql
├── middleware/        # Custom middleware
│   ├── auth.ts
│   ├── roleGuard.ts
│   └── rateLimit.ts
├── routes/            # API route definitions
│   ├── auth.ts
│   ├── tournaments.ts
│   ├── posts.ts
│   ├── teams.ts
│   ├── players.ts
│   ├── friends.ts
│   ├── notifications.ts
│   ├── pending.ts
│   ├── upload.ts
│   └── admin.ts
├── utils/             # Utility functions
│   ├── jwt.ts
│   ├── hash.ts
│   ├── email.ts
│   └── validation.ts
├── validators/        # Zod validation schemas
│   ├── auth.ts
│   ├── tournament.ts
│   ├── post.ts
│   └── team.ts
└── index.ts           # Application entry point
```

## 🔌 API Endpoints

### Authentication
```
POST   /auth/register          # User registration
POST   /auth/login            # User login
POST   /auth/logout           # User logout
GET    /auth/me               # Get current user
POST   /auth/verify-email     # Verify email
POST   /auth/resend-verification # Resend verification email
POST   /auth/forgot-password  # Request password reset
POST   /auth/reset-password   # Reset password
POST   /auth/delete-account   # Delete account
POST   /auth/send-restore-otp # Send account restoration OTP
POST   /auth/restore-account  # Restore deleted account
```

### Users & Players
```
GET    /players               # Get players list
GET    /players/:id           # Get player details
PUT    /players/:id           # Update player profile
POST   /players/:id/ban       # Ban player (admin)
POST   /players/:id/unban     # Unban player (admin)
```

### Tournaments
```
GET    /tournaments           # Get tournaments list
POST   /tournaments           # Create tournament
GET    /tournaments/:id       # Get tournament details
PUT    /tournaments/:id       # Update tournament
DELETE /tournaments/:id       # Delete tournament
POST   /tournaments/:id/register # Register for tournament
POST   /tournaments/:id/withdraw # Withdraw from tournament
POST   /tournaments/:id/approve # Approve tournament (admin)
GET    /tournaments/:id/registered-teams # Get registered teams
```

### Teams
```
GET    /teams                 # Get teams list
POST   /teams                 # Create team
GET    /teams/:id             # Get team details
PUT    /teams/:id             # Update team
DELETE /teams/:id             # Delete team
GET    /teams/my              # Get user's team
POST   /teams/invite          # Send team invite
POST   /teams/invite/:id/accept # Accept team invite
POST   /teams/invite/:id/decline # Decline team invite
GET    /teams/invites/user    # Get user's team invites
```

### Posts
```
GET    /posts                 # Get posts list
POST   /posts                 # Create post
GET    /posts/:id             # Get post details
PUT    /posts/:id             # Update post
DELETE /posts/:id             # Delete post
POST   /posts/:id/like        # Like post
POST   /posts/:id/unlike      # Unlike post
POST   /posts/:id/approve     # Approve post (admin)
```

### Friends
```
GET    /friends               # Get friends list
POST   /friends/request       # Send friend request
POST   /friends/:id/accept    # Accept friend request
POST   /friends/:id/decline   # Decline friend request
DELETE /friends/:id           # Remove friend
```

### Notifications
```
GET    /notifications         # Get notifications
POST   /notifications/:id/read # Mark notification as read
DELETE /notifications/:id     # Delete notification
```

### Pending Content
```
GET    /pending/tournaments   # Get pending tournaments
GET    /pending/posts         # Get pending posts
POST   /pending/tournaments   # Submit tournament for approval
POST   /pending/posts         # Submit post for approval
```

### File Uploads
```
POST   /upload/avatar         # Upload user avatar
POST   /upload/team-logo      # Upload team logo
POST   /upload/tournament-image # Upload tournament image
POST   /upload/post-image     # Upload post image
```

### Admin
```
GET    /admin/users           # Get all users
PUT    /admin/users/:id/ban   # Ban user
PUT    /admin/users/:id/unban # Unban user
DELETE /admin/users/:id       # Delete user
POST   /admin/users/:id/restore # Restore user
POST   /admin/organizers/:id/approve # Approve organizer
POST   /admin/organizers/:id/unapprove # Unapprove organizer
```

## 🔒 Security Features

### Authentication & Authorization
- **JWT tokens** with configurable expiration
- **Role-based middleware** for route protection
- **Password hashing** with bcrypt
- **Email verification** required for sensitive operations
- **Rate limiting** on authentication endpoints

### Data Validation
- **Zod schemas** for all input validation
- **Type-safe** database queries with Drizzle
- **SQL injection prevention** with parameterized queries
- **Input sanitization** and validation

### Error Handling
- **Consistent error responses** across all endpoints
- **Detailed error messages** for debugging
- **Graceful error handling** for database operations
- **Logging** for security events

## 📊 Database Schema

### Core Tables
- **User:** User accounts and authentication
- **PlayerProfile:** Extended player information
- **Team:** Team information and management
- **TeamMembership:** Team member relationships
- **Tournament:** Tournament details and configuration
- **TournamentRegistration:** Tournament participation
- **Post:** Content and news posts
- **PostLikes:** Post engagement tracking
- **Friends:** Friend relationships
- **Notification:** User notifications
- **PendingTournament:** Tournament approval workflow
- **PendingPost:** Post approval workflow

### Key Relationships
- **User → PlayerProfile** (one-to-one for players)
- **User → TeamMembership** (many-to-many)
- **Team → TournamentRegistration** (many-to-many)
- **User → Post** (one-to-many)
- **User → Friends** (many-to-many)

## 🚀 Performance Optimizations

### Database
- **Indexed queries** for frequently accessed data
- **Efficient joins** with proper foreign keys
- **Query optimization** with Drizzle ORM
- **Connection pooling** for better performance

### API
- **Response caching** where appropriate
- **Pagination** for large datasets
- **Selective field loading** to reduce payload size
- **Compression** for large responses

### Security
- **Rate limiting** to prevent abuse
- **Request validation** at middleware level
- **Secure headers** and CORS configuration
- **Input sanitization** and validation

## 🧪 Development

### Available Scripts
```bash
bun run dev          # Start development server
bun run build        # Build for production
bun run deploy       # Deploy to Cloudflare Workers
bun run drizzle-kit generate # Generate migrations
bun run drizzle-kit push     # Push schema changes
bun run drizzle-kit migrate  # Run migrations
```

### Code Quality
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Consistent** error handling patterns

## 🔧 Configuration

### Environment Variables
- **Database:** D1 database URL and configuration
- **JWT:** Secret key and token expiration
- **Email:** SMTP configuration for notifications
- **File Upload:** R2 bucket configuration
- **Admin:** Registration codes and permissions

### Database Migrations
- **Drizzle Kit** for schema management
- **Version control** for database changes
- **Rollback support** for failed migrations
- **Development** and production environments

## 📈 Monitoring & Logging

### Error Tracking
- **Structured logging** for debugging
- **Error aggregation** and reporting
- **Performance monitoring** for API endpoints
- **Database query** performance tracking

### Analytics
- **User activity** tracking
- **API usage** statistics
- **Error rates** and performance metrics
- **Database performance** monitoring

## 🐛 Troubleshooting

### Common Issues
1. **Database Connection:** Check D1 database URL and permissions
2. **JWT Issues:** Verify JWT_SECRET environment variable
3. **Email Service:** Check SMTP configuration
4. **File Uploads:** Verify R2 bucket permissions

### Development Tips
- Use Cloudflare Workers dashboard for debugging
- Check D1 database logs for query issues
- Monitor API response times and error rates
- Test all endpoints with different user roles

## 📄 License

This project is part of the MOB Esports Zone platform.

## 🤝 Contributing

1. Follow the existing code style and patterns
2. Add proper TypeScript types for new features
3. Include validation schemas for new endpoints
4. Test all endpoints with different user roles
5. Update documentation for new features

---

**Built with ❤️ for the gaming community**
