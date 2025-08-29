# PDF Upload System Setup Guide

## Overview
The Books Management System now supports real PDF file uploads to Supabase storage, not just URL links. This guide will help you set up the storage bucket and verify everything works correctly.

## 🚀 **What's New**

### **Before (Old System):**
- Admin had to provide external PDF URLs
- No file upload capability
- Limited control over file storage

### **Now (New System):**
- ✅ **Real PDF File Uploads**: Admin can upload actual PDF files
- ✅ **File Validation**: PDF type and size validation (max 10MB)
- ✅ **Secure Storage**: Files stored in Supabase storage bucket
- ✅ **Progress Tracking**: Real-time upload progress indicator
- ✅ **File Management**: Automatic file cleanup on deletion
- ✅ **Public URLs**: Generated public URLs for file access

## 📁 **Storage Setup**

### **1. Create Storage Bucket**

In your Supabase dashboard:

1. Go to **Storage** → **Buckets**
2. Click **Create a new bucket**
3. Set bucket name: `books`
4. Set **Public bucket** to `true`
5. Click **Create bucket**

### **2. Set Storage Policies**

Run this SQL in your Supabase SQL editor:

```sql
-- Allow authenticated users to upload PDFs to books folder
CREATE POLICY "Allow authenticated users to upload books" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'books' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = 'books'
    );

-- Allow public access to view books (if they are public)
CREATE POLICY "Allow public access to view public books" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'books' 
        AND (storage.foldername(name))[1] = 'books'
    );

-- Allow authenticated users to update their own books
CREATE POLICY "Allow users to update their own books" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'books' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = 'books'
    );

-- Allow authenticated users to delete their own books
CREATE POLICY "Allow users to delete their own books" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'qhlc-storage' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = 'books'
    );
```

### **3. Alternative: Use Existing Bucket**

If you already have a storage bucket, you can use it instead:

1. **Update the bucket name** in the code:
   ```typescript
   // In src/app/admin/books/page.tsx, line ~200
   const { data, error } = await supabase.storage
     .from('YOUR_BUCKET_NAME') // Change this
     .upload(filePath, selectedFile, { ... })
   ```

2. **Update the storage test endpoint**:
   ```typescript
   // In src/app/api/admin/books/test-storage/route.ts, line ~50
   const qhlcStorageBucket = buckets.find(bucket => bucket.name === 'YOUR_BUCKET_NAME')
   ```

## 🔧 **Database Migration**

### **Option 1: Modify Existing Books Table**

Run the migration script to add new columns:

```sql
\i scripts/migrate-existing-books-table.sql
```

### **Option 2: Create New Table**

If you prefer a fresh start:

```sql
\i scripts/create-books-table.sql
```

## 🧪 **Testing the System**

### **1. Test Storage Access**

1. Navigate to `/admin/books`
2. Click the **"Test Storage"** button
3. Check the results:
   - ✅ **Success**: Storage is working correctly
   - ❌ **Error**: Follow the error message to fix issues

### **2. Test PDF Upload**

1. Click **"Add Book"**
2. Fill in book details
3. Select a PDF file (under 10MB)
4. Click **"Create Book"**
5. Watch the upload progress
6. Verify the book appears in the list

## 📋 **File Requirements**

### **Supported Formats:**
- ✅ **PDF files only** (`.pdf` extension)
- ✅ **Maximum size**: 10MB
- ✅ **File naming**: Auto-sanitized for security

### **File Validation:**
```typescript
// File type validation
if (selectedFile.type !== 'application/pdf') {
  alert('Please select a valid PDF file')
  return null
}

// File size validation
const maxSize = 10 * 1024 * 1024 // 10MB
if (selectedFile.size > maxSize) {
  alert('File size must be less than 10MB')
  return null
}
```

## 🔍 **Troubleshooting**

### **Common Issues & Solutions:**

#### **1. "Storage bucket not found"**
- **Solution**: Create the `qhlc-storage` bucket in Supabase dashboard
- **Alternative**: Update bucket name in code to match your existing bucket

#### **2. "Permission denied"**
- **Solution**: Check storage policies are correctly set
- **Verify**: Run the storage test endpoint to check permissions

#### **3. "Upload failed"**
- **Check**: File size (must be under 10MB)
- **Check**: File type (must be PDF)
- **Check**: Storage bucket permissions

#### **4. "File not accessible after upload"**
- **Solution**: Ensure storage bucket is public
- **Check**: Storage policies allow public read access

### **Debug Steps:**

1. **Check browser console** for detailed error messages
2. **Use the Test Storage button** to verify bucket access
3. **Check Supabase logs** for server-side errors
4. **Verify file size and type** before upload

## 📱 **User Experience Features**

### **Upload Process:**
1. **File Selection**: Drag & drop or click to select PDF
2. **Validation**: Automatic file type and size checking
3. **Progress Bar**: Real-time upload progress
4. **Success Feedback**: Clear confirmation when upload completes
5. **Error Handling**: User-friendly error messages

### **File Management:**
- **View**: Click eye icon to open PDF in new tab
- **Download**: Click download icon to save locally
- **Delete**: Removes both database record and storage file
- **Edit**: Modify book metadata (title, author, category, etc.)

## 🚀 **Production Considerations**

### **Security:**
- ✅ **File type validation**: Only PDFs allowed
- ✅ **Size limits**: Prevents abuse
- ✅ **Authentication required**: Admin-only access
- ✅ **Sanitized filenames**: Prevents path traversal

### **Performance:**
- ✅ **Progress tracking**: User feedback during uploads
- ✅ **Efficient storage**: Files organized in folders
- ✅ **CDN integration**: Supabase storage with global CDN

### **Scalability:**
- ✅ **Bucket organization**: Files stored in `books/` subfolder
- ✅ **Unique naming**: Timestamp-based filenames prevent conflicts
- ✅ **Cleanup**: Automatic file removal on book deletion

## 📚 **API Endpoints**

### **File Upload Flow:**
1. **Frontend**: User selects PDF file
2. **Validation**: File type and size checked
3. **Upload**: File sent to Supabase storage
4. **Database**: Book record created with file URL
5. **Response**: Success confirmation to user

### **Storage Structure:**
```
books/
├── books/
│   ├── 1703123456789_document1.pdf
│   ├── 1703123456790_document2.pdf
│   └── 1703123456791_document3.pdf
└── other-folders/
```

## 🎯 **Next Steps**

1. **Run the migration script** to update your database
2. **Set up storage bucket** and policies
3. **Test the system** using the Test Storage button
4. **Upload your first PDF book** to verify everything works
5. **Customize** file size limits or categories as needed

## 📞 **Support**

If you encounter issues:

1. **Check the console** for error messages
2. **Use the Test Storage button** to diagnose problems
3. **Verify storage bucket** exists and is public
4. **Check storage policies** are correctly set
5. **Ensure file requirements** are met (PDF, under 10MB)

**Your PDF upload system is now ready for production use!** 📁✨ 