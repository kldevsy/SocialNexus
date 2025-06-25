import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let dbTest = {
    hasUrl: !!process.env.DATABASE_URL,
    urlStart: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : null,
    connected: false,
    error: null,
    version: null,
    tables: []
  };

  if (process.env.DATABASE_URL) {
    let pool: Pool | null = null;
    
    try {
      // Test with different SSL configurations
      const configs = [
        {
          name: 'Standard SSL',
          config: {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
          }
        },
        {
          name: 'SSL with sslmode=require',
          config: {
            connectionString: process.env.DATABASE_URL + (process.env.DATABASE_URL.includes('?') ? '&' : '?') + 'sslmode=require',
            ssl: { rejectUnauthorized: false }
          }
        },
        {
          name: 'No SSL (testing)',
          config: {
            connectionString: process.env.DATABASE_URL,
            ssl: false
          }
        }
      ];

      for (const configTest of configs) {
        try {
          console.log(`Testing ${configTest.name}...`);
          pool = new Pool({
            ...configTest.config,
            max: 1,
            connectionTimeoutMillis: 5000,
            idleTimeoutMillis: 5000
          });

          // Test basic connection
          const versionResult = await pool.query('SELECT version() as version');
          dbTest.version = versionResult.rows[0].version;
          dbTest.connected = true;

          // Test if our tables exist
          const tablesResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'servers', 'channels', 'messages')
            ORDER BY table_name
          `);
          
          dbTest.tables = tablesResult.rows.map(row => row.table_name);
          
          console.log(`${configTest.name} successful!`);
          break; // Success, stop testing other configs
          
        } catch (error) {
          console.log(`${configTest.name} failed:`, error instanceof Error ? error.message : 'Unknown error');
          if (pool) {
            await pool.end().catch(() => {});
            pool = null;
          }
          dbTest.error = `${configTest.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      }

      if (pool) {
        await pool.end();
      }

    } catch (error) {
      dbTest.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('Database test error:', error);
    }
  }

  return res.json({
    timestamp: new Date().toISOString(),
    environment: 'vercel',
    database: dbTest
  });
}