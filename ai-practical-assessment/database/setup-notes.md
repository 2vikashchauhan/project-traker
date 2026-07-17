# Database Setup Notes

## Prerequisites
- PostgreSQL 14+
- Node.js 18+

## Setup Steps

1. Install PostgreSQL:
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

2. Create database and user:
```bash
sudo -u postgres psql -c "CREATE USER tracker WITH PASSWORD 'password';"
sudo -u postgres psql -c "CREATE DATABASE project_tracker OWNER tracker;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE project_tracker TO tracker;"
```

3. Configure environment:
```bash
# .env (for Prisma CLI)
DATABASE_URL="postgresql://tracker:password@localhost:5432/project_tracker?schema=public"

# .env.local (for Next.js runtime)
DATABASE_URL="postgresql://tracker:password@localhost:5432/project_tracker?schema=public"
AUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

4. Run migrations:
```bash
npx prisma migrate deploy
```

5. Verify:
```bash
npx prisma studio  # Opens GUI at localhost:5555
```

## Migrations

| # | Name | Description |
|---|------|-------------|
| 1 | init | Project and Task tables with enums and indexes |
| 2 | add_auth_tables | User table, Role enum, ownerId/createdById relations |
