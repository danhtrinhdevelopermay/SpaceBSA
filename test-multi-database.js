import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import 'dotenv/config';

async function testMultiDatabase() {
  console.log('🔍 Testing multi-database connections...\n');
  
  try {
    // Test Primary Database
    console.log('📊 PRIMARY DATABASE:');
    const primarySql = neon(process.env.DATABASE_URL);
    const primaryDb = drizzle(primarySql);
    
    const primaryTables = await primarySql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log(`   ✅ Connected successfully`);
    console.log(`   📋 Tables (${primaryTables.length}):`, primaryTables.map(t => t.table_name).join(', '));
    
    // Test Backup Database 1
    if (process.env.DATABASE_URL_BACKUP1) {
      console.log('\n📊 BACKUP DATABASE 1:');
      const backupSql = neon(process.env.DATABASE_URL_BACKUP1);
      const backupDb = drizzle(backupSql);
      
      const backupTables = await backupSql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `;
      
      console.log(`   ✅ Connected successfully`);
      console.log(`   📋 Tables (${backupTables.length}):`, backupTables.map(t => t.table_name).join(', '));
      
      if (backupTables.length === 0) {
        console.log('\n🚨 BACKUP DATABASE 1 CHUẨN BỊ SCHEMA:');
        console.log('   ⚠️  Backup database chưa có bảng nào!');
        console.log('   📝 Chạy lệnh sau để tạo schema:');
        console.log('   💻 psql $DATABASE_URL_BACKUP1 -f backup-database-schema.sql');
        
        console.log('\n🔨 Hoặc sử dụng Node.js để tạo schema tự động...');
        await createBackupSchema(backupSql);
      }
    } else {
      console.log('\n❌ BACKUP DATABASE 1: Not configured');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function createBackupSchema(sql) {
  try {
    console.log('🔨 Creating backup database schema...');
    
    // 1. Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        firebase_uid VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,  
        display_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // 2. Folders table  
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
    
    // 3. Files table
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
    
    // 4. Shared files table
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
    
    // 5. Notifications table
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        metadata TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // 6. User sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        is_online BOOLEAN DEFAULT TRUE,
        last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_files_deleted_at ON files(deleted_at);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_shared_files_token ON shared_files(share_token);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);`;
    
    console.log('✅ Backup database schema created successfully!');
    
    // Verify tables created
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log(`📋 Created ${tables.length} tables:`, tables.map(t => t.table_name).join(', '));
    
  } catch (error) {
    console.error('❌ Error creating backup schema:', error.message);
  }
}

testMultiDatabase();