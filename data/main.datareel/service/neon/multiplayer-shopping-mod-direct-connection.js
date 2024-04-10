// Do not expose your Neon credentials to the browser
// .env
PGHOST='ep-floral-base-444193.us-west-2.aws.neon.tech'
PGDATABASE='neondb'
PGUSER='benoit'
PGPASSWORD='rxN9akbdE5Vt'
ENDPOINT_ID='multiplayer-shopping-mod'

// app.js
const { Pool } = require('pg');
require('dotenv').config();

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID } = process.env;
const URL = `postgres://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?options=project%3D${ENDPOINT_ID}`;

const sql = postgres(URL, { ssl: 'require' });

async function getPgVersion() {
  const result = await sql`select version()`;
  console.log(result);
}

getPgVersion();
