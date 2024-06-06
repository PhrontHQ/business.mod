// Do not expose your Neon credentials to the browser
// .env
PGHOST='ep-floral-base-444193-pooler.us-west-2.aws.neon.tech'
PGDATABASE='mod'
PGUSER='benoit'
PGPASSWORD='rxN9akbdE5Vt'
ENDPOINT_ID='multiplayer-shopping-mod'

// app.js
const { Pool } = require('pg');
require('dotenv').config();

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID } = process.env;
const URL = `postgres://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?options=project%3D${ENDPOINT_ID}`;

const { DATABASE_URL } = process.env;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function getPostgresVersion() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT version()');
    console.log(res.rows[0]);
  } finally {
    client.release();
  }
}

getPostgresVersion();

