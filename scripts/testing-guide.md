# 🧪 QHLC Application Testing Guide

## 📋 Prerequisites

Before testing, ensure you have:
- ✅ Development server running (`npm run dev`)
- ✅ Supabase project configured
- ✅ Database setup completed
- ✅ Admin users created

## 🚀 Step 1: Complete Database Setup

### Run the Final Setup Script
1. Open your Supabase SQL Editor
2. Copy and paste the entire contents of `scripts/final-setup.sql`
3. Run the script
4. Verify the output shows:
   - ✅ Storage buckets created (certificates, gallery, resources, profiles)
   - ✅ Admin users created (admin@qhlc.com, superadmin@qhlc.com)
   - ✅ Sample data populated

## 🔐 Step 2: Test Authentication

### Test Admin Login
1. Go to `http://localhost:3000/login`
2. Use these credentials:

| User Type | Email | Password | Expected Result |
|-----------|-------|----------|-----------------|
| Admin | `admin@qhlc.com` | `admin123` | Redirected to `/admin` |
| Super Admin | `superadmin@qhlc.com` | `super123` | Redirected to `/admin` |

### Test User Registration
1. Go to `http://localhost:3000/register`
2. Fill out the registration form with test data:
   - Full Name: "Test User"
   - Mobile: "+966500000003"
   - WhatsApp: "+966500000003"
   - Gender: "Male"
   - Area: Select any area
   - Exam Center: Auto-populated
   - Email: "testuser@example.com"
   - Password: "test123"
3. Submit and verify:
   - ✅ User is created in `auth.users`
   - ✅ Profile is created in `profiles`
   - ✅ User is redirected to `/dashboard/user`

## 🏠 Step 3: Test User Dashboard

### Test User Dashboard Features
1. Login as a regular user
2. Navigate through dashboard sections:
   - **Dashboard Home** (`/dashboard/user`) - Should show user stats
   - **Profile** (`/dashboard/user/profile`) - Should show user details
   - **Exams** (`/dashboard/user/exams`) - Should show available exams
   - **Mock Exams** (`/dashboard/user/mock-exams`) - Should show practice exams
   - **History** (`/dashboard/user/history`) - Should show exam history
   - **Certificates** (`/dashboard/user/certificates`) - Should show certificates

### Test Profile Management
1. Go to `/dashboard/user/profile`
2. Try to edit profile information
3. Verify changes are saved to database

## 👨‍💼 Step 4: Test Admin Panel

### Test Admin Access
1. Login as admin (`admin@qhlc.com` / `admin123`)
2. Verify you're redirected to `/admin`
3. Test admin panel sections:
   - **Users** (`/admin/users`) - Should show all users
   - **Questions** (`/admin/questions`) - Should show question bank
   - **Exams** (`/admin/exams`) - Should show exam management
   - **Evaluation** (`/admin/evaluation`) - Should show exam evaluations
   - **Reports** (`/admin/reports`) - Should show reports

### Test User Management
1. Go to `/admin/users`
2. Verify you can see all registered users
3. Test user role management (if implemented)

## 📊 Step 5: Test Exam System

### Test Exam Creation (Admin)
1. Login as admin
2. Go to `/admin/exams`
3. Try to create a new exam
4. Add questions to the exam
5. Verify exam appears in user dashboard

### Test Exam Taking (User)
1. Login as a regular user
2. Go to `/dashboard/user/exams`
3. Start an available exam
4. Answer questions
5. Submit the exam
6. Verify results are saved

## 📱 Step 6: Test Mobile Responsiveness

### Test Mobile Layout
1. Open browser developer tools
2. Switch to mobile viewport (e.g., iPhone 12)
3. Test all pages for mobile responsiveness:
   - ✅ Login page
   - ✅ Dashboard pages
   - ✅ Admin panel
   - ✅ Forms and navigation

## 🔧 Step 7: Test Error Handling

### Test Common Scenarios
1. **Invalid Login**: Try wrong credentials
2. **Network Issues**: Disconnect internet and test
3. **Form Validation**: Submit forms with missing data
4. **Unauthorized Access**: Try to access admin pages as regular user

## 📈 Step 8: Performance Testing

### Test Loading Times
1. Measure page load times:
   - Homepage: < 3 seconds
   - Dashboard: < 2 seconds
   - Admin panel: < 2 seconds
2. Test with multiple browser tabs
3. Test with different network conditions

## 🐛 Step 9: Debugging

### Common Issues and Solutions

#### Issue: "Storage bucket not found"
**Solution**: Run the storage bucket setup script

#### Issue: "User not found" after login
**Solution**: Check if user exists in both `auth.users` and `profiles`

#### Issue: "Permission denied" errors
**Solution**: Check RLS policies and user roles

#### Issue: "Column does not exist" errors
**Solution**: Run the table structure fix script

### Debug Commands
```bash
# Check database connection
node scripts/verify-setup.js

# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Clear Next.js cache
rm -rf .next
npm run dev
```

## ✅ Step 10: Final Verification

### Run Complete Verification
```bash
node scripts/verify-setup.js
```

Expected output:
```
✅ Environment variables configured
✅ Database connection successful
✅ Basic table structure verified
✅ Helper functions available
✅ Storage buckets configured
✅ Authentication working
```

### Test All User Flows
1. ✅ User registration and login
2. ✅ Admin login and panel access
3. ✅ Profile management
4. ✅ Exam creation and taking
5. ✅ File upload functionality
6. ✅ Mobile responsiveness

## 🎯 Success Criteria

Your QHLC application is ready when:
- ✅ All authentication flows work
- ✅ Admin panel is accessible
- ✅ User dashboard functions properly
- ✅ Database operations work correctly
- ✅ File uploads work
- ✅ Mobile layout is responsive
- ✅ No console errors in browser
- ✅ All pages load within acceptable time

## 🚀 Next Steps

After successful testing:
1. **Deploy to Production**: Set up Vercel/Netlify deployment
2. **Configure Domain**: Set up custom domain
3. **Set up Monitoring**: Configure error tracking
4. **Backup Strategy**: Set up database backups
5. **User Training**: Prepare user documentation

---

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify database connection
3. Check Supabase logs
4. Review this testing guide
5. Contact development team

**Happy Testing! 🎉** 