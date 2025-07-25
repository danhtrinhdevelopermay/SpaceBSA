-- Script để test tạo file trong backup database
-- Kết nối tới backup database và insert test file

INSERT INTO files (
    id,
    user_id,
    file_name,
    original_name,
    file_size,
    mime_type,
    file_path,
    storage_type,
    created_at,
    updated_at
) VALUES (
    'test-backup-' || extract(epoch from now()),
    2,
    'test-backup-' || extract(epoch from now()) || '.txt',
    'test-backup-file.txt',
    1024,
    'text/plain',
    '/test/backup/',
    'local',
    now(),
    now()
);

-- Kiểm tra file đã được tạo
SELECT 
    id,
    file_name,
    file_size,
    created_at,
    'Created in backup database' as source
FROM files 
WHERE file_name LIKE 'test-backup-%'
ORDER BY created_at DESC
LIMIT 5;