# Resources Management and Storage Fix Guide

This guide helps you test and verify that the resources management and file upload issues have been fixed.

## Issues Fixed

1. **Missing Resources API Route** - Created `/api/resources` with full CRUD operations
2. **Storage Bucket Issues** - Added automatic bucket creation and proper policies
3. **File Upload Problems** - Enhanced FileUpload component with better error handling
4. **Database Structure** - Ensured resources table exists with proper columns and RLS policies
5. **Admin Panel Integration** - Updated admin resources page to use the new API

## Testing Steps

### 1. Test Storage Buckets

Visit: `http://localhost:3001/test-storage`

This page will:
- Test if storage buckets exist
- Create buckets if they don't exist
- Test file upload functionality
- Show user authentication status

### 2. Test Admin Resources Panel

Visit: `http://localhost:3001/admin/resources`

This page should:
- Load existing resources (if any)
- Allow adding new resources with file upload
- Allow editing existing resources
- Allow deleting resources
- Show proper error messages

### 3. Test File Upload

1. Go to the admin resources page
2. Click "Add Resource"
3. Fill in the form:
   - Title: "Test Resource"
   - Description: "Test description"
   - Category: "Study Material"
   - Upload a file (PDF, image, or document)
4. Click "Save Resource"

Expected behavior:
- File should upload successfully
- Resource should be saved to database
- Resource should appear in the list

### 4. Test API Endpoints

You can test the API directly:

```bash
# Get all resources
curl -X GET http://localhost:3001/api/resources

# Create a resource (requires admin authentication)
curl -X POST http://localhost:3001/api/resources \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Resource",
    "description": "Test description",
    "file_url": "https://example.com/test.pdf",
    "file_type": "pdf",
    "file_size": 1024000,
    "category": "study",
    "is_public": true
  }'
```

## Common Issues and Solutions

### Issue: "Bucket not found" error
**Solution**: The FileUpload component now automatically creates buckets if they don't exist.

### Issue: "Unauthorized" error
**Solution**: Make sure you're logged in as an admin user. Only admins can create/edit resources.

### Issue: File upload fails
**Solution**: 
1. Check browser console for specific error messages
2. Verify file size is within limits (20MB for resources)
3. Check file type is allowed
4. Ensure you have proper internet connection

### Issue: Resources not loading
**Solution**:
1. Check if the resources table exists in the database
2. Run the fix script: `scripts/fix-resources-and-storage.sql`
3. Check browser console for API errors

## Database Fixes Applied

The following fixes have been applied to the database:

1. **Resources Table Structure**:
   - Ensured all required columns exist
   - Added proper indexes for performance
   - Set up proper foreign key relationships

2. **RLS Policies**:
   - Public resources are viewable by all
   - Users can view their own uploaded resources
   - Only admins can upload new resources
   - Admins can manage all resources
   - Users can update/delete their own resources

3. **Storage Policies**:
   - Public read access for resources, gallery, and profiles
   - Authenticated users can upload to all buckets
   - Proper update and delete policies

## Files Modified

1. `src/app/api/resources/route.ts` - New API route
2. `src/app/api/test-storage/route.ts` - Storage testing API
3. `src/components/ui/FileUpload.tsx` - Enhanced file upload
4. `src/app/admin/resources/page.tsx` - Updated to use new API
5. `src/app/test-storage/page.tsx` - Storage testing page
6. `scripts/fix-resources-and-storage.sql` - Database fixes

## Next Steps

After verifying the fixes work:

1. **Test with real files** - Upload various file types and sizes
2. **Test permissions** - Verify only admins can create resources
3. **Test public access** - Verify public resources are accessible
4. **Clean up test data** - Remove any test resources created during testing

## Support

If you encounter any issues:

1. Check the browser console for error messages
2. Check the server logs for API errors
3. Verify your Supabase configuration
4. Ensure you're logged in as an admin user
5. Test the storage functionality using the test page first 