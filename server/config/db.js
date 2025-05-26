const { Pool } = require('pg');

const pool = new Pool({
  user: 'gusto_admin',
  host: 'localhost',
  database: 'gusto_database',
  password: '12345',
  port: 5432,
});

module.exports = pool;