# Database Migrations

This folder contains database migration scripts that modify the database schema.

## Running Migrations

### On Railway (Production)

You have several options to run migrations on Railway:

#### Option 1: Railway CLI (Recommended)

**Install Railway CLI:**

If you get permission errors, use one of these methods:

**Method A: Use npx (No installation needed)**
```bash
# No installation required - npx runs it directly
npx @railway/cli login
npx @railway/cli link

# Run from project root (Railway's working directory)
npx @railway/cli run python api/migrations/run_migrations.py

# OR if Railway runs from api/ directory:
npx @railway/cli run python migrations/run_migrations.py
```

**Method B: Install with sudo (macOS/Linux)**
```bash
sudo npm i -g @railway/cli
```

**Method C: Install locally (no sudo needed)**
```bash
npm install @railway/cli
# Then use: npx railway or ./node_modules/.bin/railway
```

**After installation, run migrations:**
```bash
railway login
railway link

# Try from project root first:
railway run python api/migrations/run_migrations.py

# OR if Railway runs from api/ directory:
railway run python migrations/run_migrations.py

# If python doesn't work, try python3:
railway run python3 api/migrations/run_migrations.py
```

#### Option 2: Railway Web Console (One-off Command)

1. Go to your Railway project dashboard
2. Click on your service
3. Go to the "Deployments" tab or use "Run Command" / "Shell" feature
4. Run (try both paths):
   ```bash
   # From project root:
   python api/migrations/run_migrations.py
   
   # OR if working directory is api/:
   cd api && python migrations/run_migrations.py
   
   # If python doesn't work, try python3:
   python3 api/migrations/run_migrations.py
   ```

#### Option 3: SSH into Container / Shell

1. In Railway dashboard, go to your service
2. Use the "Connect", "Shell", or "Terminal" option
3. Check your current directory:
   ```bash
   pwd
   ls -la
   ```
4. Run migrations (adjust path based on your working directory):
   ```bash
   # If in project root:
   python api/migrations/run_migrations.py
   
   # If in api/ directory:
   cd api
   python migrations/run_migrations.py
   
   # If python doesn't work:
   python3 api/migrations/run_migrations.py
   ```

### Local Development

```bash
cd api
python migrations/run_migrations.py
```

Or run individual migrations:

```bash
cd api
python migrations/add_email_preferences.py
```

## Migration Files

- `add_notifications_table.py` - Creates the notifications table
- `add_forum_tables.py` - Creates forum-related tables
- `add_discord_avatar_column.py` - Adds Discord avatar column to users
- `add_email_preferences.py` - Adds email notification preferences

## Notes

- Migrations are idempotent - they check if changes already exist before applying
- Always backup your database before running migrations in production
- Run migrations in the order specified in `run_migrations.py`
