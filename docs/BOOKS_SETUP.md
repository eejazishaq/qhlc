# Books Management System Setup

## Overview
The Books Management System allows admins to upload, manage, and distribute educational PDF books to users. It includes PDF upload functionality, categorization, and access control.

## Features
- 📚 **PDF Upload**: Admin can upload PDF files with progress tracking
- 🏷️ **Categorization**: Books can be organized by category (Academic, Reference, Textbook, etc.)
- 🔒 **Access Control**: Public/private book visibility settings
- 📊 **Analytics**: Download count tracking
- 🔍 **Search & Filter**: Find books by title, author, category, or status
- 📱 **Mobile Responsive**: Works on all device sizes
- ✏️ **CRUD Operations**: Create, read, update, and delete books

## Database Setup

### 1. Create the Books Table
Run the SQL script to create the `qhlc_books` table:

```sql
\i scripts/create-books-table.sql
```

### 2. Storage Setup
The system uses the existing `qhlc-storage` bucket. Ensure it exists and has proper policies:

```sql
\i scripts/setup-storage-for-books.sql
```

## Table Structure

```sql
CREATE TABLE qhlc_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,                    -- Book title
    description TEXT,                       -- Book description
    author TEXT NOT NULL,                   -- Author name
    category TEXT DEFAULT 'Other',          -- Book category
    pdf_url TEXT NOT NULL,                  -- PDF file URL
    file_size INTEGER DEFAULT 0,            -- File size in bytes
    is_public BOOLEAN DEFAULT false,        -- Public visibility
    download_count INTEGER DEFAULT 0,       -- Download counter
    uploaded_by UUID REFERENCES profiles(id), -- Admin who uploaded
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

### GET /api/admin/books
- **Purpose**: Fetch books with search, filtering, and pagination
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 50)
  - `search`: Search term for title, description, or author
  - `category`: Filter by category
  - `status`: Filter by public/private status

### POST /api/admin/books
- **Purpose**: Create a new book
- **Body**: Book data including PDF upload details

### PUT /api/admin/books/[id]
- **Purpose**: Update an existing book
- **Body**: Updated book data

### DELETE /api/admin/books/[id]
- **Purpose**: Delete a book and its PDF file

## File Upload Process

1. **File Selection**: Admin selects a PDF file (max 10MB)
2. **Upload to Storage**: File is uploaded to `qhlc-storage/books/` folder
3. **Database Record**: Book metadata is stored in `qhlc_books` table
4. **Access Control**: File visibility is controlled by `is_public` flag

## Categories

Available book categories:
- Academic
- Reference
- Textbook
- Study Guide
- Practice Test
- Manual
- Other

## Security Features

- **Authentication Required**: All operations require admin authentication
- **Role-Based Access**: Only admin and super_admin users can manage books
- **File Validation**: Only PDF files are accepted
- **Storage Policies**: Proper Supabase storage policies for file access

## Mobile Responsiveness

The books page is fully responsive with:
- **Mobile Cards View**: Card-based layout for small screens
- **Desktop Table View**: Full table layout for larger screens
- **Responsive Forms**: Forms that adapt to screen size
- **Touch-Friendly**: Optimized for mobile interactions

## Usage

### Adding a Book
1. Click "Add Book" button
2. Fill in book details (title, author, description, category)
3. Select a PDF file
4. Choose public/private visibility
5. Click "Create Book"

### Managing Books
- **Edit**: Click edit icon to modify book details
- **Delete**: Click delete icon to remove book and PDF
- **View**: Click view icon to open PDF in new tab
- **Download**: Click download icon to save PDF locally

### Searching and Filtering
- **Search**: Use search bar to find books by title, author, or description
- **Category Filter**: Filter books by category
- **Status Filter**: Show only public or private books

## Troubleshooting

### Common Issues

1. **Upload Fails**
   - Check file size (max 10MB)
   - Ensure file is PDF format
   - Verify storage bucket permissions

2. **Permission Denied**
   - Ensure user has admin role
   - Check RLS policies if enabled
   - Verify authentication token

3. **File Not Found**
   - Check if PDF file exists in storage
   - Verify file URL in database
   - Check storage bucket configuration

### Database Issues

If you encounter table access issues:
```sql
-- Check if table exists
SELECT * FROM information_schema.tables WHERE table_name = 'qhlc_books';

-- Check table structure
\d qhlc_books;

-- Check RLS status
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'qhlc_books';
```

## Future Enhancements

- **User Access Control**: Allow specific users to access private books
- **Book Reviews**: User rating and review system
- **Reading Progress**: Track user reading progress
- **Book Recommendations**: AI-powered book suggestions
- **Advanced Search**: Full-text search within PDF content
- **Book Series**: Organize books into series or collections 