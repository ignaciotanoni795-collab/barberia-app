   import { neon } from '@neondatabase/serverless';

   const connectionString = process.env.DATABASE_URL || process.env.database_url_DATABASE_URL;

   export const sql = neon(connectionString, { fullResults: true });