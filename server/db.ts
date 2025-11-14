import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL não está configurada!");
  console.log("📋 Siga estes passos:");
  console.log("1. Abra a aba 'Database' no painel lateral do Replit");
  console.log("2. Crie um novo banco PostgreSQL");
  console.log("3. A variável DATABASE_URL será configurada automaticamente");
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log("🔌 Conectando ao PostgreSQL...");
console.log("Host:", process.env.DATABASE_URL.split('@')[1]?.split('/')[0]);

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Testar conexão
pool.on('connect', () => {
  console.log('✅ Conectado ao PostgreSQL com sucesso!');
});

pool.on('error', (err) => {
  console.error('❌ Erro no pool do PostgreSQL:', err.message);
});

export const db = drizzle({ client: pool, schema });