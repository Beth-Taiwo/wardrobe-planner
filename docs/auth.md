# Account Setup

The app uses Prisma with MariaDB/MySQL and private per-user wardrobe data.

## Environment

Use the local MariaDB default unless your database differs:

```sh
DATABASE_URL="mysql://root:password@localhost:3306/wardrobe_planner"
AUTH_SESSION_SECRET="replace-with-a-long-random-string"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
```

## Google OAuth

Create an OAuth 2.0 Client ID in Google Cloud Console, choose a web application, and add the exact redirect URI configured in `GOOGLE_REDIRECT_URI`. For local development, the callback is:

```txt
http://localhost:3000/api/auth/google/callback
```

## Schema Application

The project uses Prisma `db push` rather than checked-in migrations:

```sh
npm run prisma:validate
npm run prisma:generate
npm run db:push
```

The user-account schema makes `DressEntry.userId` and `ClothingItem.userId` required. Archive or delete legacy `dress_entries`, `clothing_items`, and `dress_entry_items` before pushing this schema, unless you first add a temporary nullable ownership transition.
