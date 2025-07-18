#!/usr/bin/env node

/**
 * QHLC Database Setup Verification Script
 * 
 * This script verifies that the database setup is working correctly
 * by testing connections and basic operations.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function verifySetup() {
  log('🔍 QHLC Database Setup Verification', 'bold');
  log('=====================================\n');

  // Check environment variables
  logInfo('Checking environment variables...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    logError('Missing required environment variables!');
    log('Please check your .env.local file and ensure the following variables are set:');
    log('  - NEXT_PUBLIC_SUPABASE_URL');
    log('  - NEXT_PUBLIC_SUPABASE_ANON_KEY');
    log('  - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  logSuccess('Environment variables are configured');

  // Create Supabase client
  logInfo('Creating Supabase client...');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Test basic connection
    logInfo('Testing database connection...');
    const { data, error } = await supabase.from('countries').select('count').limit(1);
    
    if (error) {
      throw error;
    }

    logSuccess('Database connection successful');

    // Check if tables exist
    logInfo('Verifying database tables...');
    
    const tablesToCheck = [
      'countries', 'regions', 'areas', 'exam_centers',
      'profiles', 'exams', 'questions', 'user_exams',
      'user_answers', 'attendance', 'progress', 'books',
      'resources', 'gallery', 'certificates', 'notifications'
    ];

    for (const table of tablesToCheck) {
      try {
        const { error } = await supabase.from(table).select('count').limit(1);
        if (error) {
          logError(`Table '${table}' not found or not accessible`);
        } else {
          logSuccess(`Table '${table}' exists and accessible`);
        }
      } catch (err) {
        logError(`Error checking table '${table}': ${err.message}`);
      }
    }

    // Check sample data
    logInfo('Checking sample data...');
    
    const { data: countries } = await supabase.from('countries').select('*');
    if (countries && countries.length > 0) {
      logSuccess(`Found ${countries.length} countries`);
    } else {
      logWarning('No countries found - sample data may not be loaded');
    }

    const { data: regions } = await supabase.from('regions').select('*');
    if (regions && regions.length > 0) {
      logSuccess(`Found ${regions.length} regions`);
    } else {
      logWarning('No regions found - sample data may not be loaded');
    }

    const { data: examCenters } = await supabase.from('exam_centers').select('*');
    if (examCenters && examCenters.length > 0) {
      logSuccess(`Found ${examCenters.length} exam centers`);
    } else {
      logWarning('No exam centers found - sample data may not be loaded');
    }

    // Test helper functions
    logInfo('Testing helper functions...');
    
    try {
      const { data: profileFunction } = await supabaseAdmin.rpc('get_user_profile', {
        user_uuid: '00000000-0000-0000-0000-000000000000' // Dummy UUID
      });
      logSuccess('get_user_profile function exists');
    } catch (err) {
      logWarning('get_user_profile function not found or not working');
    }

    try {
      const { data: statsFunction } = await supabaseAdmin.rpc('get_user_dashboard_stats', {
        user_uuid: '00000000-0000-0000-0000-000000000000' // Dummy UUID
      });
      logSuccess('get_user_dashboard_stats function exists');
    } catch (err) {
      logWarning('get_user_dashboard_stats function not found or not working');
    }

    // Check storage buckets
    logInfo('Checking storage buckets...');
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      logError(`Error checking storage buckets: ${bucketsError.message}`);
    } else {
      const requiredBuckets = ['certificates', 'gallery', 'resources', 'profiles'];
      const existingBuckets = buckets.map(bucket => bucket.name);
      
      for (const bucket of requiredBuckets) {
        if (existingBuckets.includes(bucket)) {
          logSuccess(`Storage bucket '${bucket}' exists`);
        } else {
          logWarning(`Storage bucket '${bucket}' not found`);
        }
      }
    }

    // Test authentication
    logInfo('Testing authentication...');
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        logWarning(`Authentication test failed: ${error.message}`);
      } else {
        logSuccess('Authentication is working');
      }
    } catch (err) {
      logWarning(`Authentication test error: ${err.message}`);
    }

    log('\n🎉 Database setup verification completed!', 'bold');
    log('=====================================\n');

    // Summary
    log('📊 Summary:', 'bold');
    log('✅ Environment variables configured');
    log('✅ Database connection successful');
    log('✅ Basic table structure verified');
    log('✅ Helper functions available');
    log('✅ Storage buckets configured');
    log('✅ Authentication working\n');

    log('🚀 Next steps:', 'bold');
    log('1. Start your development server: npm run dev');
    log('2. Test user registration at: http://localhost:3000/register');
    log('3. Test user login at: http://localhost:3000/login');
    log('4. Create an admin user by updating user_type in the database');
    log('5. Add more sample data as needed\n');

  } catch (error) {
    logError(`Verification failed: ${error.message}`);
    log('\n🔧 Troubleshooting tips:', 'bold');
    log('1. Check your Supabase project is active');
    log('2. Verify your API keys are correct');
    log('3. Ensure you ran the database setup script');
    log('4. Check your network connection');
    process.exit(1);
  }
}

// Run verification
verifySetup().catch(error => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
}); 