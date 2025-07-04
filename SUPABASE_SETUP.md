# 🚀 Supabase Setup Guide for QHLC

This guide will walk you through setting up Supabase for the QHLC Web Portal project.

## 📋 Prerequisites

- A Supabase account (free tier is sufficient to start)
- Basic knowledge of SQL (for running the schema)
- Your QHLC project codebase ready

## 🎯 Step-by-Step Setup

### Step 1: Create Supabase Project

1. **Visit Supabase Dashboard**
   - Go to [https://supabase.com](https://supabase.com)
   - Sign up or log in to your account

2. **Create New Project**
   - Click "New Project" button
   - Choose your organization
   - Fill in project details:
     ```
     Name: qhlc-portal
     Database Password: [Create a strong password - save this!]
     Region: Europe West (or closest to Saudi Arabia)
     ```
   - Click "Create new project"

3. **Wait for Setup**
   - Supabase will provision your database (2-3 minutes)
   - You'll see a success message when ready

### Step 2: Get Project Credentials

1. **Navigate to Settings**
   - In your project dashboard, click the gear icon (⚙️)
   - Go to "API" tab

2. **Copy Credentials**
   - **Project URL**: Copy the "Project URL" (starts with `https://`)
   - **Anon Key**: Copy the "anon public" key
   - **Service Role Key**: Copy the "service_role" key (keep this secret!)

### Step 3: Update Environment Variables

1. **Edit your `.env.local` file**
   ```bash
   # Replace the placeholder values with your actual Supabase credentials
   NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key
   ```

2. **Example of real values:**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Step 4: Set Up Database Schema

1. **Open SQL Editor**
   - In your Supabase dashboard, go to "SQL Editor"
   - Click "New query"

2. **Run the Schema**
   - Copy the entire content from `database-schema.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the schema

3. **Verify Setup**
   - Go to "Table Editor" in the sidebar
   - You should see all the tables created:
     - `profiles`, `exams`, `questions`, `user_exams`, etc.
   - Check that sample data was inserted

### Step 5: Configure Authentication

1. **Go to Authentication Settings**
   - In your Supabase dashboard, go to "Authentication" → "Settings"

2. **Configure Site URL**
   - Set "Site URL" to: `http://localhost:3000` (for development)
   - Add redirect URLs:
     ```
     http://localhost:3000/auth/callback
     http://localhost:3000/dashboard
     ```

3. **Email Templates (Optional)**
   - Go to "Authentication" → "Email Templates"
   - Customize the email templates for your QHLC branding

### Step 6: Set Up Storage Buckets

The schema script creates these storage buckets automatically:
- `certificates` - for exam certificates (private)
- `gallery` - for public images (public)
- `resources` - for study materials (private)
- `profiles` - for user profile images (private)

### Step 7: Test Your Setup

1. **Start Your Development Server**
   ```bash
   npm run dev
   ```

2. **Test Registration**
   - Go to `http://localhost:3000/register`
   - Try creating a new account
   - Check if the user appears in Supabase "Authentication" → "Users"

3. **Test Login**
   - Go to `http://localhost:3000/login`
   - Try logging in with the account you created

## 🔧 Troubleshooting

### Common Issues

1. **"Invalid URL" Error**
   - Make sure your `NEXT_PUBLIC_SUPABASE_URL` is correct
   - Check that there are no extra spaces or characters

2. **"Invalid API Key" Error**
   - Verify your `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
   - Make sure you copied the "anon public" key, not the service role key

3. **Database Connection Issues**
   - Check if your Supabase project is active
   - Verify the database password you set during project creation

4. **RLS Policy Errors**
   - Make sure you ran the complete schema script
   - Check that RLS policies were created in "Authentication" → "Policies"

### Getting Help

- **Supabase Documentation**: [https://supabase.com/docs](https://supabase.com/docs)
- **Supabase Discord**: [https://discord.supabase.com](https://discord.supabase.com)
- **GitHub Issues**: Create an issue in your project repository

## 🚀 Next Steps

After successful setup:

1. **Create Admin User**
   - Register a regular user first
   - Manually update their `user_type` to `'admin'` in the database
   - Or create an admin user directly in Supabase

2. **Add More Data**
   - Add more regions, areas, and exam centers
   - Create more exams and questions
   - Upload sample resources and gallery images

3. **Configure Production**
   - Update environment variables for production
   - Set up custom domain
   - Configure production redirect URLs

## 📊 Monitoring

- **Database**: Monitor in "Table Editor"
- **Authentication**: Check in "Authentication" → "Users"
- **Storage**: Monitor in "Storage" → "Buckets"
- **Logs**: View in "Logs" section

## 🔒 Security Notes

- Never commit your `.env.local` file to version control
- Keep your service role key secret
- Regularly rotate your API keys
- Monitor your database usage (free tier limits)

---

**Need Help?** If you encounter any issues during setup, please refer to the troubleshooting section or reach out for support. 