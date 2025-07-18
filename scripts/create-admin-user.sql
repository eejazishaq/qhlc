-- Create Regular Admin User
-- This script creates the admin user (not super admin)

DO $$
DECLARE
    admin_count INTEGER;
    admin_user_id UUID;
BEGIN
    -- Check if admin user exists
    SELECT COUNT(*) INTO admin_count 
    FROM profiles 
    WHERE user_type = 'admin';
    
    -- Create admin user if none exists
    IF admin_count = 0 THEN
        -- First create auth user
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'admin@qhlc.com',
            crypt('admin123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        ) RETURNING id INTO admin_user_id;
        
        -- Then create profile
        INSERT INTO profiles (
            id,
            full_name,
            mobile,
            whatsapp_no,
            gender,
            user_type,
            area_id,
            center_id,
            serial_number,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            admin_user_id,
            'System Administrator',
            '+966500000001',
            '+966500000001',
            'male',
            'admin',
            (SELECT id FROM areas LIMIT 1),
            (SELECT id FROM exam_centers LIMIT 1),
            'QHLC-ADMIN-001',
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Admin user created with ID: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Admin user already exists';
    END IF;
END $$;

-- Show all admin users
SELECT 
    'Admin Users' as info,
    p.user_type,
    u.email,
    p.full_name,
    p.serial_number,
    p.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.user_type IN ('admin', 'super_admin')
ORDER BY p.user_type;

-- Show login credentials
SELECT 
    'Login Credentials' as info,
    p.user_type,
    u.email,
    CASE 
        WHEN p.user_type = 'admin' THEN 'admin123'
        WHEN p.user_type = 'super_admin' THEN 'super123'
    END as password
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.user_type IN ('admin', 'super_admin')
ORDER BY p.user_type; 