#!/usr/bin/env node

/**
 * QHLC Supabase Setup Verification Script
 * 
 * This script verifies that your Supabase configuration is working correctly.
 * Run this after setting up your Supabase project and updating environment variables.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function verifySetup() {
  console.log('🔍 Verifying QHLC Supabase Setup...\n');

  // Check environment variables
  console.log('1. Checking environment variables...');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || supabaseUrl === 'https://your-project.supabase.co') {
    console.log('❌ NEXT_PUBLIC_SUPABASE_URL is not set or still has placeholder value');
    console.log('   Please update your .env.local file with your actual Supabase URL');
    return false;
  }

  if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key-here') {
    console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set or still has placeholder value');
    console.log('   Please update your .env.local file with your actual Supabase anon key');
    return false;
  }

  if (!supabaseServiceKey || supabaseServiceKey === 'your-service-role-key-here') {
    console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY is not set (optional for basic functionality)');
  }

  console.log('✅ Environment variables are configured\n');

  // Test Supabase connection
  console.log('2. Testing Supabase connection...');
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test basic connection with timeout
    const connectionPromise = supabase.from('profiles').select('count').limit(1);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 10000)
    );
    
    const { data, error } = await Promise.race([connectionPromise, timeoutPromise]);
    
    if (error) {
      console.log('❌ Failed to connect to Supabase:', error.message);
      console.log('   Make sure your project URL and API key are correct');
      return false;
    }

    console.log('✅ Successfully connected to Supabase\n');

    // Check if tables exist
    console.log('3. Checking database tables...');
    const tables = [
      'profiles', 'exams', 'user_exams', 'countries', 'regions', 'areas', 'exam_centers'
    ];

    let tablesExist = 0;
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('count').limit(1);
        if (!error) {
          tablesExist++;
          console.log(`   ✅ ${table}`);
        } else {
          console.log(`   ❌ ${table} - ${error.message}`);
        }
      } catch (err) {
        console.log(`   ❌ ${table} - ${err.message}`);
      }
    }

    console.log(`\n📊 Database Status: ${tablesExist}/${tables.length} tables found`);

    if (tablesExist < tables.length) {
      console.log('\n⚠️  Some tables are missing. Please run the fresh setup script:');
      console.log('   Copy the content from fresh-setup.sql and run it in your Supabase SQL Editor');
    } else {
      console.log('\n✅ All required tables are present');
    }

    // Check sample data
    console.log('\n4. Checking sample data...');
    try {
      const { data: countries } = await supabase.from('countries').select('*');
      const { data: regions } = await supabase.from('regions').select('*');
      const { data: areas } = await supabase.from('areas').select('*');
      const { data: centers } = await supabase.from('exam_centers').select('*');
      const { data: exams } = await supabase.from('exams').select('*');

      console.log(`   Countries: ${countries?.length || 0}`);
      console.log(`   Regions: ${regions?.length || 0}`);
      console.log(`   Areas: ${areas?.length || 0}`);
      console.log(`   Exam Centers: ${centers?.length || 0}`);
      console.log(`   Exams: ${exams?.length || 0}`);

      if (countries?.length > 0 && regions?.length > 0 && areas?.length > 0) {
        console.log('✅ Sample data is present');
      } else {
        console.log('⚠️  Sample data is missing. Please run the fresh setup script');
      }
    } catch (err) {
      console.log('⚠️  Could not check sample data:', err.message);
    }

    // Check storage buckets
    console.log('\n5. Checking storage buckets...');
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.log('❌ Failed to check storage buckets:', bucketsError.message);
      } else {
        const requiredBuckets = ['certificates', 'gallery', 'resources', 'profiles'];
        const existingBuckets = buckets.map(b => b.name);
        
        for (const bucket of requiredBuckets) {
          if (existingBuckets.includes(bucket)) {
            console.log(`   ✅ ${bucket}`);
          } else {
            console.log(`   ❌ ${bucket} - missing`);
          }
        }
      }
    } catch (err) {
      console.log('⚠️  Could not check storage buckets:', err.message);
    }

    console.log('\n🎉 Setup verification completed!');
    
    if (tablesExist === tables.length) {
      console.log('✅ Your QHLC Supabase setup is ready to use!');
      console.log('\nNext steps:');
      console.log('1. Start your development server: npm run dev');
      console.log('2. Test registration: http://localhost:3000/register');
      console.log('3. Test login: http://localhost:3000/login');
      console.log('\nNote: RLS policies are disabled for now. We\'ll add them later.');
    } else {
      console.log('⚠️  Please complete the setup by running the fresh setup script');
    }

    return true;

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure your Supabase project is active');
    console.log('2. Check your internet connection');
    console.log('3. Try running the fresh-setup.sql script in your Supabase SQL Editor');
    return false;
  }
}

// Run verification
verifySetup().catch(console.error); 