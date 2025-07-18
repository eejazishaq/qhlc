import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
    
    // Check authentication
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', currentUser.id)
      .single()

    if (profileError || !['admin', 'super_admin'].includes(profile?.user_type || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch user with related data
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      console.error('Error fetching user:', error)
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
    }

    // Fetch areas and centers data separately
    const { data: areas } = await supabase
      .from('areas')
      .select('id, name')

    const { data: centers } = await supabase
      .from('exam_centers')
      .select('id, name')

    // Create lookup maps
    const areasMap = new Map(areas?.map(area => [area.id, area]) || [])
    const centersMap = new Map(centers?.map(center => [center.id, center]) || [])

    // Merge the data
    const userWithLocations = {
      ...user,
      areas: areasMap.get(user.area_id) || null,
      centers: centersMap.get(user.center_id) || null
    }

    return NextResponse.json({ user: userWithLocations })

  } catch (error) {
    console.error('Error in get user API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    console.log('Updating user with ID:', id);
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
    
    // Check authentication
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', currentUser.id)
      .single()

    if (profileError || !['admin', 'super_admin'].includes(profile?.user_type || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    console.log('Update request body:', body);
    
    const {
      full_name,
      mobile,
      whatsapp_no,
      gender,
      user_type,
      area_id,
      center_id,
      father_name,
      dob,
      iqama_number,
      is_active
    } = body

    // Validate required fields
    if (!full_name || !mobile || !gender || !user_type || !area_id || !center_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Normalize gender field to match database expectations
    const normalizedGender = gender?.toLowerCase() === 'female'
    ? 'female'
    : gender?.toLowerCase() === 'male'
    ? 'male'
    : null;

    if (!normalizedGender) {
      return NextResponse.json({ error: 'Invalid gender value' }, { status: 400 });
    }


    // First, check if the user exists
    const { data: existingUserCheck, error: checkError } = await supabase
      .from('profiles')
      .select('id, full_name, mobile')
      .eq('id', id)
      .single()

    if (checkError) {
      console.error('User not found with ID:', id, checkError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('User exists:', existingUserCheck);

    // Check if mobile number already exists for other users
    // Temporarily commenting out to debug the issue
    /*
    const { data: existingUser, error: mobileCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('mobile', mobile)
      .neq('id', id)
      .maybeSingle()

    if (mobileCheckError) {
      console.error('Error checking mobile number:', mobileCheckError);
      return NextResponse.json({ error: 'Error checking mobile number' }, { status: 500 })
    }

    if (existingUser) {
      return NextResponse.json({ error: 'Mobile number already exists' }, { status: 400 })
    }
    */

    console.log('Mobile number check skipped for debugging...');

    // Prepare update data
    const updateData = {
      full_name,
      mobile,
      whatsapp_no,
      gender: normalizedGender,
      user_type,
      area_id,
      center_id,
      father_name: father_name || null,
      dob: dob || null,
      iqama_number: iqama_number || null,
      is_active,
      updated_at: new Date().toISOString()
    }

    console.log('Update data to be sent:', updateData);

    // First try update without select to see if it works
    const { data: updatedRows, error: updateOnlyError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select() 

    if (updateOnlyError) {
      console.error('Error in update only:', updateOnlyError);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    if (updateOnlyError) {
      console.error('Error in update only:', updateOnlyError);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
    
    if (!updatedRows || updatedRows.length === 0) {
      console.warn('Update did not affect any rows');
      return NextResponse.json({ error: 'No changes made or insufficient permissions' }, { status: 400 });
    }
    

    console.log('Update without select succeeded');

    // Now try to get the updated user
    const { data: updatedUser, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (selectError) {
      console.error('Error selecting updated user:', selectError);
      return NextResponse.json({ error: 'Failed to fetch updated user' }, { status: 500 })
    }

    console.log('User updated successfully:', updatedUser);
    return NextResponse.json({ user: updatedUser })

  } catch (error) {
    console.error('Error in update user API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
    
    // Check authentication
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', currentUser.id)
      .single()

    if (profileError || !['admin', 'super_admin'].includes(profile?.user_type || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prevent deleting own account
    if (id === currentUser.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('profiles')
      .select('id, user_type')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      console.error('Error fetching user:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
    }

    // Prevent deleting super admin accounts (only super admins can delete other super admins)
    if (existingUser.user_type === 'super_admin' && profile.user_type !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can delete super admin accounts' }, { status: 403 })
    }

    // Delete user profile
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }

    return NextResponse.json({ message: 'User deleted successfully' })

  } catch (error) {
    console.error('Error in delete user API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 