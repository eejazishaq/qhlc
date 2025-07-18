-- Check and Create Admin Users
-- This script checks for existing admin users and creates them if needed

-- First, let's check if any admin users exist
SELECT 
    'Existing Admin Users' as info,
    COUNT(*) as count
FROM profiles 
WHERE user_type IN ('admin', 'super_admin');

-- Check if any users exist at all
SELECT 
    'Total Users' as info,
    COUNT(*) as count
FROM profiles;

-- Check auth.users table
SELECT 
    'Auth Users' as info,
    COUNT(*) as count
FROM auth.users;

-- If no admin users exist, let's create them
-- We'll use a conditional approach to avoid errors

DO $$
DECLARE
    admin_count INTEGER;
    super_admin_count INTEGER;
    admin_user_id UUID;
    super_admin_user_id UUID;
BEGIN
    -- Check if admin users exist
    SELECT COUNT(*) INTO admin_count 
    FROM profiles 
    WHERE user_type = 'admin';
    
    SELECT COUNT(*) INTO super_admin_count 
    FROM profiles 
    WHERE user_type = 'super_admin';
    
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
    
    -- Create super admin user if none exists
    IF super_admin_count = 0 THEN
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
            'superadmin@qhlc.com',
            crypt('super123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        ) RETURNING id INTO super_admin_user_id;
        
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
            super_admin_user_id,
            'Super Administrator',
            '+966500000002',
            '+966500000002',
            'male',
            'super_admin',
            (SELECT id FROM areas LIMIT 1),
            (SELECT id FROM exam_centers LIMIT 1),
            'QHLC-SUPER-001',
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Super admin user created with ID: %', super_admin_user_id;
    ELSE
        RAISE NOTICE 'Super admin user already exists';
    END IF;
END $$;

-- Show final results
SELECT 
    'Final Admin Users' as info,
    user_type,
    COUNT(*) as count
FROM profiles 
WHERE user_type IN ('admin', 'super_admin')
GROUP BY user_type;

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
WHERE p.user_type IN ('admin', 'super_admin'); 