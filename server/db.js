import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

export default pool;
