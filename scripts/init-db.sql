-- Made in France - Database Initialization
-- This script runs automatically when the PostgreSQL container starts

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "ltree";
CREATE EXTENSION IF NOT EXISTS "cube";
CREATE EXTENSION IF NOT EXISTS "earthdistance";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Create full-text search configuration for French
CREATE TEXT SEARCH CONFIGURATION IF NOT EXISTS french_unaccent (COPY = french);
ALTER TEXT SEARCH CONFIGURATION french_unaccent
    ALTER MAPPING FOR hword, hword_part, word
    WITH unaccent, french_stem;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE madeinfrance TO mif_user;

-- Log success
DO $$
BEGIN
    RAISE NOTICE 'Database initialization completed successfully';
END
$$;
