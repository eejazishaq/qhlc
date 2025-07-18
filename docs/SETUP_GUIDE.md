# 🚀 QHLC Setup Guide

**Complete setup guide for Quranic Learning and Exam Management Portal**

---

## 📋 **Prerequisites**

- ✅ Node.js 18+ installed
- ✅ Supabase account and project created
- ✅ Git repository cloned
- ✅ Environment variables configured

---

## 🔧 **Step 1: Database Schema Setup**

### 1.1 Run the Safe Database Setup
```sql
-- Copy and paste the contents of scripts/safe-database-setup.sql
-- This creates all tables safely without overwriting existing data
```

### 1.2 Fix Table Structure (if needed)
```sql
-- If you get "column does not exist" errors, run:
-- Copy and paste the contents of scripts/fix-table-structure.sql
```

### 1.3 Fix RLS Policies
```sql
-- Fix any RLS policy issues:
-- Copy and paste the contents of scripts/fix-infinite-recursion.sql
```

---

## 📊 **Step 2: Initial Data Setup**

### 2.1 Populate Essential Data
```sql
-- Copy and paste the contents of scripts/setup-initial-data.sql
-- This adds:
-- ✅ Saudi Arabia and all regions
-- ✅ Major cities and areas
-- ✅ Sample exam centers
-- ✅ Sample exams and questions
-- ✅ Sample resources and gallery items
```

### 2.2 Create Admin Users
```sql
-- Copy and paste the contents of scripts/setup-admin-users.sql
-- This creates test users with different roles
```

---

## 🔐 **Step 3: Authentication Setup**

### 3.1 Create Auth Users in Supabase
1. Go to **Authentication > Users** in Supabase Dashboard
2. Click **"Add User"**
3. Create these users manually:

| Email | Password | Role |
|-------|----------|------|
| `superadmin@qhlc.sa` | `password123` | Super Admin |
| `admin@qhlc.sa` | `password123` | Admin |
| `convener@qhlc.sa` | `password123` | Convener |
| `coordinator@qhlc.sa` | `password123` | Coordinator |
| `user@qhlc.sa` | `password123` | User |

### 3.2 Link Auth Users to Profiles
After creating auth users, their profiles are already created by the script.

---

## 🗂️ **Step 4: Storage Buckets Setup**

### 4.1 Create Storage Buckets
1. Go to **Storage** in Supabase Dashboard
2. Create these buckets:

| Bucket Name | Public | Purpose |
|-------------|--------|---------|
| `certificates` | ✅ Yes | Store user certificates |
| `gallery` | ✅ Yes | Store gallery images |
| `resources` | ✅ Yes | Store downloadable resources |
| `profile-images` | ✅ Yes | Store user profile pictures |

### 4.2 Set Bucket Policies
```sql
-- Allow public read access to all buckets
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id IN ('certificates', 'gallery', 'resources', 'profile-images'));

-- Allow authenticated users to upload
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own uploads
CREATE POLICY "User Update" ON storage.objects FOR UPDATE USING (auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 🧪 **Step 5: Verification**

### 5.1 Run Verification Script
```sql
-- Copy and paste the contents of scripts/verify-setup.sql
-- This checks that everything is set up correctly
```

### 5.2 Test Application
1. Start your development server: `npm run dev`
2. Test login with the created users
3. Navigate through different dashboards
4. Test file uploads and downloads

---

## 🎯 **Step 6: Testing Different Roles**

### 6.1 Super Admin Testing
- Login: `superadmin@qhlc.sa` / `password123`
- Test: Full system access, user management, all admin features

### 6.2 Admin Testing
- Login: `admin@qhlc.sa` / `password123`
- Test: Exam management, question bank, evaluations

### 6.3 Convener Testing
- Login: `convener@qhlc.sa` / `password123`
- Test: Regional center oversight, reports

### 6.4 Coordinator Testing
- Login: `coordinator@qhlc.sa` / `password123`
- Test: Attendance tracking, progress management, book distribution

### 6.5 User Testing
- Login: `user@qhlc.sa` / `password123`
- Test: Profile management, exam taking, certificate viewing

---

## 🔧 **Step 7: Environment Configuration**

### 7.1 Update Environment Variables
Make sure your `.env.local` has all required variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="QHLC Web Portal"

# Optional: Email Configuration (if using email features)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

### 7.2 PWA Configuration (Optional)
If you want to enable PWA features:

1. Update `next.config.js` to enable PWA
2. Add PWA icons to `public/icons/`
3. Update `public/manifest.json`

---

## 🚀 **Step 8: Production Deployment**

### 8.1 Build the Application
```bash
npm run build
```

### 8.2 Deploy to Vercel/Netlify
1. Connect your repository to Vercel or Netlify
2. Set environment variables in the deployment platform
3. Deploy the application

### 8.3 Update Domain and SSL
1. Configure custom domain
2. Ensure HTTPS is enabled
3. Update environment variables with production URLs

---

## 🔍 **Troubleshooting**

### Common Issues and Solutions

#### ❌ "Table not found" Error
```sql
-- Run the safe database setup script
-- scripts/safe-database-setup.sql
```

#### ❌ "Column does not exist" Error
```sql
-- Run the table structure fix script
-- scripts/fix-table-structure.sql
```

#### ❌ "Infinite recursion" Error
```sql
-- Run the RLS fix script
-- scripts/fix-infinite-recursion.sql
```

#### ❌ Login Not Working
1. Check if auth users exist in Supabase
2. Verify RLS policies are correct
3. Check environment variables
4. Clear browser cache and cookies

#### ❌ File Upload Not Working
1. Verify storage buckets exist
2. Check bucket policies
3. Ensure proper permissions

#### ❌ Dashboard Not Loading
1. Check if user profile exists
2. Verify user_type is set correctly
3. Check RLS policies for relevant tables

---

## 📞 **Support**

If you encounter issues:

1. **Check the logs** in Supabase Dashboard
2. **Verify setup** using the verification script
3. **Review environment variables**
4. **Check browser console** for errors

---

## ✅ **Setup Checklist**

- [ ] Database schema created
- [ ] RLS policies configured
- [ ] Initial data populated
- [ ] Admin users created
- [ ] Auth users linked to profiles
- [ ] Storage buckets created
- [ ] Environment variables set
- [ ] Application builds successfully
- [ ] All roles tested
- [ ] File uploads working
- [ ] Ready for production deployment

---

**🎉 Congratulations! Your QHLC application is now fully set up and ready to use!** 