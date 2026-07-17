-- Seed data for Project Tracker
-- Run after migrations: psql -h localhost -U user -d project_tracker -f seed-data.sql

-- Insert a default admin user (password: "admin123456" hashed with bcrypt cost 10)
INSERT INTO users (id, email, name, "hashedPassword", role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@example.com',
  'Admin User',
  '$2b$10$example.hashed.password.placeholder',
  'Admin',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Note: For real usage, register via /register then promote via:
-- UPDATE users SET role = 'Admin' WHERE email = 'admin@example.com';
