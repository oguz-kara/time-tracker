#!/usr/bin/env node

import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../apps/web/.env') });

async function resetDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
  }

  const sql = postgres(connectionString, { prepare: false });

  console.log('🗑️  Dropping all tables...\n');

  try {
    // Drop all tables in reverse dependency order
    await sql`DROP TABLE IF EXISTS credit_transactions CASCADE`;
    console.log('✓ Dropped credit_transactions');

    await sql`DROP TABLE IF EXISTS organization_billing CASCADE`;
    console.log('✓ Dropped organization_billing');

    await sql`DROP TABLE IF EXISTS notifications CASCADE`;
    console.log('✓ Dropped notifications');

    await sql`DROP TABLE IF EXISTS tasks CASCADE`;
    console.log('✓ Dropped tasks');

    await sql`DROP TABLE IF EXISTS projects CASCADE`;
    console.log('✓ Dropped projects');

    await sql`DROP TABLE IF EXISTS invitations CASCADE`;
    console.log('✓ Dropped invitations');

    await sql`DROP TABLE IF EXISTS members CASCADE`;
    console.log('✓ Dropped members');

    await sql`DROP TABLE IF EXISTS organizations CASCADE`;
    console.log('✓ Dropped organizations');

    await sql`DROP TABLE IF EXISTS verification CASCADE`;
    console.log('✓ Dropped verification');

    await sql`DROP TABLE IF EXISTS accounts CASCADE`;
    console.log('✓ Dropped accounts');

    await sql`DROP TABLE IF EXISTS sessions CASCADE`;
    console.log('✓ Dropped sessions');

    await sql`DROP TABLE IF EXISTS users CASCADE`;
    console.log('✓ Dropped users');

    await sql`DROP TABLE IF EXISTS ai_usage CASCADE`;
    console.log('✓ Dropped ai_usage');

    await sql`DROP TABLE IF EXISTS files CASCADE`;
    console.log('✓ Dropped files');

    console.log('\n✅ All tables dropped successfully!\n');
    console.log('📝 Next step: Run `pnpm run db:push` to recreate schema\n');

  } catch (error) {
    console.error('\n❌ Error dropping tables:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

resetDatabase();
