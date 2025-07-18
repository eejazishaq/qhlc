# 🗄️ QHLC Database Setup Guide

## 📋 Prerequisites

- Supabase account (free tier is sufficient)
- QHLC project codebase ready
- Basic knowledge of SQL

## 🚀 Step-by-Step Setup

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

1. **Create `.env.local` file** (if it doesn't exist)
   ```bash
   # Copy from env.example
   cp env.example .env.local
   ```

2. **Edit your `.env.local` file**
   ```bash
   # Replace the placeholder values with your actual Supabase credentials
   NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key
   ```

3. **Example of real values:**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Step 4: Check Existing Tables (IMPORTANT!)

**If you already have some tables in your Supabase project:**

1. **Check what exists**
   - Open Supabase SQL Editor
   - Copy and paste the content from `scripts/check-existing-tables.sql`
   - Click "Run" to see what tables already exist

2. **Review the results**
   - The script will show you which tables, types, functions, and policies already exist
   - This helps you understand what needs to be created

### Step 5: Set Up Database Schema

**Choose the appropriate script based on your situation:**

#### Option A: Fresh Setup (No existing tables)
1. **Open SQL Editor**
   - In your Supabase dashboard, go to "SQL Editor"
   - Click "New query"

2. **Run the Complete Schema**
   - Copy the entire content from `scripts/setup-database.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the schema

#### Option B: Safe Setup (Some tables exist)
1. **Open SQL Editor**
   - In your Supabase dashboard, go to "SQL Editor"
   - Click "New query"

2. **Run the Safe Schema**
   - Copy the entire content from `scripts/safe-setup-database.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the schema

**The safe setup script will:**
- ✅ Only create tables that don't exist
- ✅ Preserve existing data
- ✅ Update policies and functions
- ✅ Add missing indexes and triggers
- ✅ Insert sample data only if it doesn't exist

### Step 6: Verify Setup

1. **Run the verification script**
   ```bash
   npm run verify-setup
   ```

2. **Check the results**
   - The script will tell you what's working and what needs attention
   - Fix any issues before proceeding

### Step 7: Configure Authentication

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

### Step 8: Test Your Setup

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

1. **"Table already exists" Error**
   - Use the safe setup script (`scripts/safe-setup-database.sql`)
   - This script uses `CREATE TABLE IF NOT EXISTS` to avoid conflicts

2. **"Type already exists" Error**
   - The safe setup script handles this automatically
   - It uses `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null; END $$;`

3. **"Invalid URL" Error**
   - Make sure your `NEXT_PUBLIC_SUPABASE_URL` is correct
   - Check that there are no extra spaces or characters

4. **"Invalid API Key" Error**
   - Verify your `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
   - Make sure you copied the "anon public" key, not the service role key

5. **"Permission denied" Error**
   - Verify RLS policies are created
   - Check user authentication
   - Run the safe setup script to ensure policies are up to date

6. **"Storage bucket missing" Error**
   - Run the safe setup script again
   - Check storage permissions

### Getting Help

- **Supabase Documentation**: [https://supabase.com/docs](https://supabase.com/docs)
- **Supabase Discord**: [https://discord.supabase.com](https://discord.supabase.com)

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

## 📊 What's Included in the Setup

### Database Tables
- ✅ `countries`, `regions`, `areas`, `exam_centers` - Geographic hierarchy
- ✅ `profiles` - User profiles (extends Supabase auth)
- ✅ `exams`, `questions` - Exam management
- ✅ `user_exams`, `user_answers` - Exam taking and evaluation
- ✅ `attendance`, `progress`, `books` - Learning management
- ✅ `resources`, `gallery` - Content management
- ✅ `certificates` - Certificate generation
- ✅ `notifications`, `audit_logs` - System features

### Sample Data
- ✅ Saudi Arabia with 3 regions
- ✅ 6 areas across the regions
- ✅ 3 exam centers with contact information

### Security Features
- ✅ Row Level Security (RLS) policies
- ✅ Proper user permissions
- ✅ Secure API access

### Helper Functions
- ✅ `generate_serial_number()` - Auto-generates QHLC-XXXXX serial numbers
- ✅ `get_user_profile()` - Get user profile with role
- ✅ `get_user_dashboard_stats()` - Get dashboard statistics

## 🔒 Security Notes

- Never commit your `.env.local` file to version control
- Keep your service role key secret
- Regularly rotate your API keys
- Monitor your database usage (free tier limits)

## 📝 Scripts Overview

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `scripts/check-existing-tables.sql` | Check what already exists | Before setup to see current state |
| `scripts/safe-setup-database.sql` | Safe setup for existing projects | **Recommended for existing tables** |
| `scripts/setup-database.sql` | Complete fresh setup | Only for completely new projects |
| `scripts/verify-setup.js` | Verify everything works | After setup to confirm success |

---

**Need Help?** If you encounter any issues during setup, please refer to the troubleshooting section or reach out for support. 