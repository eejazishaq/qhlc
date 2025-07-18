-- Create Missing Profile for Specific User
-- Replace 'user@example.com' with the actual email of the user who registered

-- Step 1: Find the user who registered
SELECT 
    'User Found' as info,
    u.id,
    u.email,
    u.created_at,
    u.raw_user_meta_data
FROM auth.users u
WHERE u.email = 'user@example.com'  -- Replace with actual email
ORDER BY u.created_at DESC;

-- Step 2: Check if profile exists
SELECT 
    'Profile Check' as info,
    CASE 
        WHEN p.id IS NOT NULL THEN 'Profile exists'
        ELSE 'Profile missing'
    END as status,
    u.email,
    p.full_name,
    p.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'user@example.com';  -- Replace with actual email

-- Step 3: Create profile if missing
DO $$
DECLARE
    user_id UUID;
    user_email TEXT;
    area_id UUID;
    center_id UUID;
    profile_exists BOOLEAN;
BEGIN
    -- Get user details
    SELECT id, email INTO user_id, user_email
    FROM auth.users 
    WHERE email = 'user@example.com';  -- Replace with actual email
    
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = user_id) INTO profile_exists;
    
    IF user_id IS NULL THEN
        RAISE NOTICE 'User not found with email: user@example.com';
        RETURN;
    END IF;
    
    IF profile_exists THEN
        RAISE NOTICE 'Profile already exists for user: %', user_email;
        RETURN;
    END IF;
    
    -- Get default area and center
    SELECT id INTO area_id FROM areas LIMIT 1;
    SELECT id INTO center_id FROM exam_centers LIMIT 1;
    
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
        is_active,
        created_at,
        updated_at
    ) VALUES (
        user_id,
        COALESCE(
            (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = user_id),
            'User ' || user_id::text
        ),
        COALESCE(
            (SELECT raw_user_meta_data->>'mobile' FROM auth.users WHERE id = user_id),
            '+966500000000'
        ),
        NULL,
        'male', -- default gender
        'user',
        area_id,
        center_id,
        'QHLC-' || LPAD(user_id::text, 5, '0'),
        true,
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Profile created successfully for user: %', user_email;
END $$;

-- Step 4: Verify profile was created
SELECT 
    'Profile Created' as info,
    p.full_name,
    p.mobile,
    p.user_type,
    p.serial_number,
    p.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'user@example.com'  -- Replace with actual email
ORDER BY p.created_at DESC; 