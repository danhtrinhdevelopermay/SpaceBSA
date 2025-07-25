const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const schema = require('./shared/schema.ts');

async function pushSchemaToBackup() {
  console.log('🔄 Pushing schema to backup database...');
  
  // Kết nối tới backup database
  const backupUrl = process.env.DATABASE_URL_BACKUP1;
  
  if (!backupUrl) {
    console.error('❌ DATABASE_URL_BACKUP1 not found in .env file');
    process.exit(1);
  }
  
  console.log('✅ Backup database URL found');
  
  const sql = neon(backupUrl);
  const db = drizzle(sql);
  
  try {
    console.log('📝 Creating users table...');
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        firebase_uid VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) NOT NULL,
        display_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    console.log('📝 Creating files table...');
    await sql`
      CREATE TABLE IF NOT EXISTS files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        folder_id UUID REFERENCES folders(id),
        file_name VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        storage_type VARCHAR(50) DEFAULT 'local',
        cloud_url VARCHAR(500),
        cloud_public_id VARCHAR(255),
        cloud_provider_id VARCHAR(50),
        cloud_metadata JSONB,
        deleted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    console.log('📝 Creating folders table...');
    await sql`
      CREATE TABLE IF NOT EXISTS folders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    console.log('📝 Creating shared_files table...');
    await sql`
      CREATE TABLE IF NOT EXISTS shared_files (
        id SERIAL PRIMARY KEY,
        file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
        shared_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        shared_with VARCHAR(255) NOT NULL,
        share_token VARCHAR(255) UNIQUE NOT NULL,
        permission VARCHAR(50) DEFAULT 'view',
        expires_at TIMESTAMP,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    console.log('📝 Creating notifications table...');
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        metadata JSONB,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    console.log('📝 Creating user_sessions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS user_sessions (
        sid VARCHAR(255) PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      );
    `;
    
    console.log('📝 Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_files_deleted_at ON files(deleted_at);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_files_folder_id ON files(folder_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_shared_files_token ON shared_files(share_token);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_sessions_expire ON user_sessions(expire);`;
    
    console.log('✅ Schema pushed successfully to backup database!');
    console.log('📊 Tables created: users, files, folders, shared_files, notifications, user_sessions');
    
  } catch (error) {
    console.error('❌ Error pushing schema:', error);
    process.exit(1);
  }
}

pushSchemaToBackup();