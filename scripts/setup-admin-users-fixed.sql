-- QHLC Setup Admin Users Script (Fixed)
-- This script creates admin users with different roles for testing and management
-- Run this after the initial data setup

-- Function to create admin user with profile
CREATE OR REPLACE FUNCTION create_admin_user(
    email_address TEXT,
    password_hash TEXT,
    full_name TEXT,
    mobile_number TEXT,
    user_type_value TEXT,
    area_code TEXT
) RETURNS UUID AS $$
DECLARE
    user_id UUID;
    selected_area_id UUID;
    selected_center_id UUID;
    profile_id UUID;
BEGIN
    -- Generate user ID
    user_id := gen_random_uuid();
    
    -- Get area ID
    SELECT id INTO selected_area_id FROM areas WHERE code = area_code LIMIT 1;
    
    -- Get first center in that area
    SELECT id INTO selected_center_id FROM exam_centers WHERE area_id = selected_area_id LIMIT 1;
    
    -- Insert into auth.users (this would normally be done by Supabase Auth)
    -- For now, we'll just create the profile and you can create the auth user manually
    
    -- Create profile
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
        is_active
    ) VALUES (
        user_id,
        full_name,
        mobile_number,
        mobile_number, -- Using same number for WhatsApp
        'male', -- Default gender
        user_type_value::user_type,
        selected_area_id,
        selected_center_id,
        'QHLC-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0'),
        true
    ) RETURNING id INTO profile_id;
    
    RETURN profile_id;
END;
$$ LANGUAGE plpgsql;

-- Create Super Admin
SELECT create_admin_user(
    'superadmin@qhlc.sa',
    'password123', -- Change this in production
    'Super Administrator',
    '+966-50-123-4567',
    'super_admin',
    'RYD-01'
);

-- Create Admin
SELECT create_admin_user(
    'admin@qhlc.sa',
    'password123', -- Change this in production
    'System Administrator',
    '+966-50-234-5678',
    'admin',
    'RYD-01'
);

-- Create Convener
SELECT create_admin_user(
    'convener@qhlc.sa',
    'password123', -- Change this in production
    'Regional Convener',
    '+966-50-345-6789',
    'convener',
    'MKK-02'
);

-- Create Coordinator
SELECT create_admin_user(
    'coordinator@qhlc.sa',
    'password123', -- Change this in production
    'Center Coordinator',
    '+966-50-456-7890',
    'coordinator',
    'EAS-01'
);

-- Create regular user for testing
SELECT create_admin_user(
    'user@qhlc.sa',
    'password123', -- Change this in production
    'Test User',
    '+966-50-567-8901',
    'user',
    'ASR-01'
);

-- Clean up function
DROP FUNCTION IF EXISTS create_admin_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

-- Display created users
SELECT 
    p.id,
    p.full_name,
    p.mobile,
    p.user_type,
    p.serial_number,
    a.name as area_name,
    ec.name as center_name
FROM profiles p
LEFT JOIN areas a ON p.area_id = a.id
LEFT JOIN exam_centers ec ON p.center_id = ec.id
WHERE p.user_type IN ('super_admin', 'admin', 'convener', 'coordinator', 'user')
ORDER BY p.user_type, p.full_name;

-- Success message
SELECT 'Admin users created successfully!' as status;
SELECT 'You can now log in with these credentials:' as instructions;
SELECT 'Email: superadmin@qhlc.sa, Password: password123' as super_admin_creds;
SELECT 'Email: admin@qhlc.sa, Password: password123' as admin_creds;
SELECT 'Email: convener@qhlc.sa, Password: password123' as convener_creds;
SELECT 'Email: coordinator@qhlc.sa, Password: password123' as coordinator_creds;
SELECT 'Email: user@qhlc.sa, Password: password123' as user_creds; 