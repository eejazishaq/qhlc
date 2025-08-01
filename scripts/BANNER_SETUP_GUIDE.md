# Banner Feature Setup Guide

## Quick Setup

To enable the banner management feature, follow these steps:

### 1. Database Setup

Run the following SQL script in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of scripts/setup-banners-table.sql
-- This will create the banners table with proper RLS policies
```

### 2. Access Banner Management

1. **Login as Admin**: Make sure you're logged in with an admin or super_admin account
2. **Navigate to Admin Panel**: Go to `/admin`
3. **Click "Banners"**: You'll see "Banners" in the left sidebar menu
4. **Start Managing**: Create, edit, and manage your website banners

### 3. Test the Feature

1. **Create a Test Banner**:
   - Click "Add New Banner"
   - Fill in the required fields
   - Use a placeholder image URL like: `https://via.placeholder.com/1200x400/1e40af/ffffff?text=Test+Banner`
   - Save the banner

2. **View on Main Page**:
   - Go to the main page (`/`)
   - You should see your banner in the carousel
   - Test the auto-rotation and manual navigation

## Troubleshooting

### Banner Not Showing in Sidebar
- Make sure you're logged in as an admin user
- Check that the user has `admin` or `super_admin` role in the profiles table
- Refresh the page after logging in

### Permission Denied Error
- Run the SQL setup script in Supabase
- Check that RLS policies are properly created
- Verify your user has admin privileges

### Banners Not Appearing on Main Page
- Check that banners are marked as `is_active = true`
- Verify image URLs are accessible
- Check browser console for any errors

## Sample Banner Data

The setup script includes sample banners with placeholder images:

1. **Welcome Banner**: Blue background with "Welcome to QHLC"
2. **Exam Banner**: Green background with "New Exam Available"  
3. **Resources Banner**: Purple background with "Learning Resources"

## Image Guidelines

- **Recommended Size**: 1200x400 pixels
- **Format**: JPG, PNG, or WebP
- **File Size**: Keep under 500KB for fast loading
- **Hosting**: Use reliable image hosting or Supabase Storage

## Next Steps

After setup, you can:
- Customize banner styling in the admin interface
- Add real images and content
- Configure auto-rotation timing
- Set up banner scheduling (future enhancement) 