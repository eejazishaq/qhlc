# QHLC Deployment Guide for Netlify

## Prerequisites

1. **Supabase Project**: Make sure you have a Supabase project set up with all the required tables
2. **GitHub Repository**: Your code should be pushed to GitHub
3. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)

## Environment Variables

You'll need to set these environment variables in Netlify:

### Required Variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXTAUTH_URL=https://your-app-name.netlify.app
NEXTAUTH_SECRET=your_nextauth_secret
```

### Optional Variables:
```
NEXT_PUBLIC_GA_ID=your_google_analytics_id
```

## Deployment Steps

### 1. Connect to Netlify

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click "New site from Git"
3. Choose "GitHub" and authorize Netlify
4. Select your `qhlc` repository

### 2. Configure Build Settings

- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Node version**: 18

### 3. Set Environment Variables

1. Go to Site settings > Environment variables
2. Add all the required environment variables listed above
3. Make sure to use your actual Supabase credentials

### 4. Deploy

1. Click "Deploy site"
2. Wait for the build to complete
3. Your site will be available at `https://your-app-name.netlify.app`

## Post-Deployment Setup

### 1. Update Supabase URLs

After deployment, update your Supabase project settings:
1. Go to Supabase Dashboard > Authentication > URL Configuration
2. Add your Netlify URL to "Site URL"
3. Add `https://your-app-name.netlify.app/api/auth/callback` to "Redirect URLs"

### 2. Test the Application

1. Visit your deployed URL
2. Test user registration and login
3. Test admin functionality
4. Test the reports and analytics features

## Troubleshooting

### Common Issues:

1. **Build Fails**: Check that all environment variables are set correctly
2. **API Routes Not Working**: Ensure you're using the Netlify Next.js plugin
3. **Database Connection Issues**: Verify your Supabase credentials
4. **Authentication Issues**: Check that your Supabase URL configuration is correct

### Support:

If you encounter issues, check:
- Netlify build logs
- Browser console for errors
- Supabase logs in the dashboard

## Features Included

✅ **Complete QHLC Platform**:
- User authentication and role management
- Admin dashboard with comprehensive management tools
- Student dashboard with exam taking capabilities
- Coordinator and Convener dashboards
- Modern Reports & Analytics system
- Location management (Countries, Regions, Areas, Centers)
- Exam management and evaluation system
- Certificate generation and verification
- File upload and gallery management
- Mobile-responsive design

✅ **Technical Features**:
- Next.js 15 with App Router
- Supabase backend integration
- PWA capabilities
- Modern UI with Tailwind CSS
- Real-time data updates
- Export functionality
- Advanced filtering and search
