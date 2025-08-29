-- Enhance certificates table with additional fields for comprehensive certificate system
-- This script adds fields needed for unique certificate numbers, verification, and enhanced metadata

-- Add new columns to certificates table if they don't exist
DO $$ 
BEGIN
    -- Add certificate_number field for unique identification
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'certificate_number') THEN
        ALTER TABLE certificates ADD COLUMN certificate_number VARCHAR(50) UNIQUE;
        RAISE NOTICE 'Added certificate_number column to certificates table';
    ELSE
        RAISE NOTICE 'certificate_number column already exists in certificates table';
    END IF;

    -- Add verification_code field for authenticity verification
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'verification_code') THEN
        ALTER TABLE certificates ADD COLUMN verification_code VARCHAR(100) UNIQUE;
        RAISE NOTICE 'Added verification_code column to certificates table';
    ELSE
        RAISE NOTICE 'verification_code column already exists in certificates table';
    END IF;

    -- Add status field for certificate states
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'status') THEN
        ALTER TABLE certificates ADD COLUMN status VARCHAR(20) DEFAULT 'active';
        RAISE NOTICE 'Added status column to certificates table';
    ELSE
        RAISE NOTICE 'status column already exists in certificates table';
    END IF;

    -- Add score field to store the actual exam score
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'score') THEN
        ALTER TABLE certificates ADD COLUMN score INTEGER;
        RAISE NOTICE 'Added score column to certificates table';
    ELSE
        RAISE NOTICE 'score column already exists in certificates table';
    END IF;

    -- Add total_marks field to store total possible marks
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'total_marks') THEN
        ALTER TABLE certificates ADD COLUMN total_marks INTEGER;
        RAISE NOTICE 'Added total_marks column to certificates table';
    ELSE
        RAISE NOTICE 'total_marks column already exists in certificates table';
    END IF;

    -- Add percentage field to store calculated percentage
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'percentage') THEN
        ALTER TABLE certificates ADD COLUMN percentage DECIMAL(5,2);
        RAISE NOTICE 'Added percentage column to certificates table';
    ELSE
        RAISE NOTICE 'percentage column already exists in certificates table';
    END IF;

    -- Add certificate_type field to distinguish between different types
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'certificate_type') THEN
        ALTER TABLE certificates ADD COLUMN certificate_type VARCHAR(50) DEFAULT 'exam_completion';
        RAISE NOTICE 'Added certificate_type column to certificates table';
    ELSE
        RAISE NOTICE 'certificate_type column already exists in certificates table';
    END IF;

    -- Add expiry_date field for certificates that may expire
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'expiry_date') THEN
        ALTER TABLE certificates ADD COLUMN expiry_date DATE;
        RAISE NOTICE 'Added expiry_date column to certificates table';
    ELSE
        RAISE NOTICE 'expiry_date column already exists in certificates table';
    END IF;

    -- Add download_count field to track downloads
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'download_count') THEN
        ALTER TABLE certificates ADD COLUMN download_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added download_count column to certificates table';
    ELSE
        RAISE NOTICE 'download_count column already exists in certificates table';
    END IF;

    -- Add last_downloaded field to track last download time
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'last_downloaded') THEN
        ALTER TABLE certificates ADD COLUMN last_downloaded TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_downloaded column to certificates table';
    ELSE
        RAISE NOTICE 'last_downloaded column already exists in certificates table';
    END IF;

    -- Add metadata field for additional certificate information
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'metadata') THEN
        ALTER TABLE certificates ADD COLUMN metadata JSONB;
        RAISE NOTICE 'Added metadata column to certificates table';
    ELSE
        RAISE NOTICE 'metadata column already exists in certificates table';
    END IF;
END $$;

-- Create function to generate unique certificate numbers
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TRIGGER AS $$
DECLARE
    new_number VARCHAR(50);
    counter INTEGER := 1;
BEGIN
    LOOP
        -- Generate format: QHLC-CERT-YYYY-XXXXX (e.g., QHLC-CERT-2025-00001)
        new_number := 'QHLC-CERT-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(counter::text, 5, '0');
        
        -- Check if this number already exists
        IF NOT EXISTS (SELECT 1 FROM certificates WHERE certificate_number = new_number) THEN
            NEW.certificate_number := new_number;
            EXIT;
        END IF;
        
        counter := counter + 1;
        
        -- Safety check to prevent infinite loop
        IF counter > 99999 THEN
            RAISE EXCEPTION 'Unable to generate unique certificate number';
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate verification codes
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate a unique verification code using UUID and timestamp
    NEW.verification_code := 'VERIFY-' || substr(md5(random()::text || clock_timestamp()::text), 1, 16);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic field generation
DO $$
BEGIN
    -- Drop existing triggers if they exist
    DROP TRIGGER IF EXISTS trigger_generate_certificate_number ON certificates;
    DROP TRIGGER IF EXISTS trigger_generate_verification_code ON certificates;
    
    -- Create trigger for certificate number generation
    CREATE TRIGGER trigger_generate_certificate_number
        BEFORE INSERT ON certificates
        FOR EACH ROW
        EXECUTE FUNCTION generate_certificate_number();
    
    -- Create trigger for verification code generation
    CREATE TRIGGER trigger_generate_verification_code
        BEFORE INSERT ON certificates
        FOR EACH ROW
        EXECUTE FUNCTION generate_verification_code();
        
    RAISE NOTICE 'Created triggers for automatic certificate number and verification code generation';
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_exam_id ON certificates(exam_id);
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_number ON certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_verification_code ON certificates(verification_code);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_date ON certificates(issued_date);

-- Update existing certificates with generated numbers if they don't have them
UPDATE certificates 
SET 
    certificate_number = 'QHLC-CERT-2025-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 5, '0'),
    verification_code = 'VERIFY-' || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    status = 'active'
WHERE certificate_number IS NULL OR verification_code IS NULL;

-- Add RLS policies for certificates
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own certificates" ON certificates;
DROP POLICY IF EXISTS "Users can create own certificates" ON certificates;
DROP POLICY IF EXISTS "Admins can manage all certificates" ON certificates;

-- Create policies for certificates
CREATE POLICY "Users can view own certificates" ON certificates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own certificates" ON certificates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all certificates" ON certificates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type IN ('admin', 'super_admin')
        )
    );

RAISE NOTICE 'Enhanced certificates table with all required fields and policies'; 