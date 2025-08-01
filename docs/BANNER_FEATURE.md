# Banner Management Feature

## Overview
The banner management feature allows administrators to create, edit, and manage website banners that are displayed on the public main page. Banners can include images, titles, descriptions, and links.

## Features

### Admin Features
- **Create Banners**: Add new banners with title, description, image URL, and optional link
- **Edit Banners**: Modify existing banner content and settings
- **Delete Banners**: Remove banners from the system
- **Toggle Active Status**: Enable/disable banners without deleting them
- **Reorder Banners**: Change the display order of banners
- **Banner Management Interface**: User-friendly admin panel for managing all banners

### Public Features
- **Banner Carousel**: Automatic rotation of active banners on the main page
- **Responsive Design**: Banners adapt to different screen sizes
- **Navigation Controls**: Manual navigation with arrows and dots
- **Auto-rotation**: Banners automatically change every 5 seconds

## Database Schema

### Banners Table
```sql
CREATE TABLE banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Indexes
- `idx_banners_is_active`: For filtering active banners
- `idx_banners_display_order`: For ordering banners

## API Endpoints

### Public Endpoints
- `GET /api/banners` - Fetch active banners for public display

### Admin Endpoints
- `GET /api/admin/banners` - Fetch all banners (admin only)
- `POST /api/admin/banners` - Create new banner (admin only)
- `PUT /api/admin/banners/[id]` - Update banner (admin only)
- `DELETE /api/admin/banners/[id]` - Delete banner (admin only)

## File Structure

```
src/
├── app/
│   ├── admin/
│   │   └── banners/
│   │       └── page.tsx          # Admin banner management page
│   ├── api/
│   │   ├── admin/
│   │   │   └── banners/
│   │   │       ├── route.ts      # Admin banner CRUD operations
│   │   │       └── [id]/
│   │   │           └── route.ts  # Individual banner operations
│   │   └── banners/
│   │       └── route.ts          # Public banner endpoint
│   └── page.tsx                  # Main page with banner carousel
└── components/
    └── ui/                       # UI components used in banner management
```

## Usage

### For Administrators

1. **Access Banner Management**:
   - Navigate to Admin Dashboard
   - Click on "Banner Management" card
   - Or go directly to `/admin/banners`

2. **Create a New Banner**:
   - Click "Add New Banner" button
   - Fill in the required fields:
     - Title (required)
     - Description (optional)
     - Image URL (required)
     - Link URL (optional)
     - Display Order (optional, auto-assigned if not provided)
     - Active status (default: true)
   - Click "Create Banner"

3. **Edit a Banner**:
   - Click the edit icon on any banner card
   - Modify the fields as needed
   - Click "Update Banner"

4. **Manage Banner Status**:
   - Use the eye icon to toggle active/inactive status
   - Inactive banners won't appear on the public page

5. **Reorder Banners**:
   - Use the up/down arrow buttons to change display order
   - Banners are displayed in ascending order by display_order

6. **Delete a Banner**:
   - Click the trash icon on any banner card
   - Confirm the deletion

### For Public Users

Banners automatically appear on the main page (`/`) with the following features:
- Automatic rotation every 5 seconds
- Manual navigation with arrow buttons
- Dot indicators for direct navigation
- Responsive design for all screen sizes
- Clickable "Learn More" buttons if link URL is provided

## Security

- All admin endpoints require authentication
- Only users with `admin` or `super_admin` roles can access banner management
- Public banner endpoint only returns active banners
- Input validation on all banner fields

## Setup Instructions

1. **Database Setup**:
   ```bash
   # Run the banner table creation script
   psql -d your_database -f scripts/create-banners-table.sql
   ```

2. **Environment Variables**:
   Ensure your Supabase environment variables are properly configured in `.env.local`

3. **Testing**:
   ```bash
   # Start the development server
   npm run dev
   
   # Navigate to /admin/banners to test admin functionality
   # Navigate to / to see banners on the main page
   ```

## Customization

### Styling
- Banner carousel styling can be modified in `src/app/page.tsx`
- Admin interface styling is in `src/app/admin/banners/page.tsx`
- Uses Tailwind CSS classes for consistent styling

### Auto-rotation
- Change the rotation interval by modifying the `5000` value in the useEffect hook
- Disable auto-rotation by removing the useEffect hook entirely

### Banner Dimensions
- Default banner height: `h-64 md:h-80` (256px on mobile, 320px on desktop)
- Modify the `className` on the banner image to change dimensions

## Troubleshooting

### Common Issues

1. **Banners not appearing**:
   - Check if banners are marked as active
   - Verify image URLs are accessible
   - Check browser console for API errors

2. **Admin access denied**:
   - Ensure user has admin or super_admin role
   - Check authentication status
   - Verify Supabase configuration

3. **Image loading issues**:
   - Ensure image URLs are valid and accessible
   - Check CORS settings if using external images
   - Consider using Supabase Storage for image hosting

### Debug Information
- Check browser developer tools for network requests
- Verify API responses in the Network tab
- Check Supabase logs for database errors

## Future Enhancements

Potential improvements for the banner feature:
- Image upload functionality with Supabase Storage
- Banner scheduling (start/end dates)
- A/B testing for different banner versions
- Analytics tracking for banner clicks
- Mobile app banner support
- Multi-language banner support 