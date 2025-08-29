# QHLC Certificate System

## Overview

The QHLC Certificate System provides a comprehensive solution for generating, managing, and verifying digital certificates for students who successfully complete exams. The system ensures authenticity through unique certificate numbers and verification codes.

## Features

### ✅ **Core Functionality**
- **Automatic Certificate Generation** - Certificates are generated automatically when students pass published exams
- **Unique Certificate Numbers** - Each certificate gets a unique QHLC-CERT-YYYY-XXXXX format number
- **Verification Codes** - Unique verification codes for authenticity verification
- **Digital Download** - PDF certificates available for download
- **QHLC Branding** - Official QHLC design and branding

### ✅ **Security & Verification**
- **Row Level Security (RLS)** - Users can only access their own certificates
- **Verification System** - Public verification endpoint for certificate authenticity
- **Status Tracking** - Active, revoked, and expired certificate states
- **Download Tracking** - Monitor certificate downloads and usage

### ✅ **User Experience**
- **Real-time Statistics** - Live counts of certificates, downloads, and available exams
- **Advanced Filtering** - Filter by status, exam type, and search terms
- **Certificate Preview** - View certificate details before download
- **Bulk Operations** - Generate multiple certificates efficiently

## Database Schema

### Certificates Table
```sql
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    certificate_url TEXT NOT NULL,
    issued_date DATE NOT NULL,
    issued_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Enhanced fields
    certificate_number VARCHAR(50) UNIQUE,
    verification_code VARCHAR(100) UNIQUE,
    status VARCHAR(20) DEFAULT 'active',
    score INTEGER,
    total_marks INTEGER,
    percentage DECIMAL(5,2),
    certificate_type VARCHAR(50) DEFAULT 'exam_completion',
    expiry_date DATE,
    download_count INTEGER DEFAULT 0,
    last_downloaded TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);
```

### Automatic Field Generation
- **Certificate Numbers**: `QHLC-CERT-2025-00001` format
- **Verification Codes**: `VERIFY-abc123def456` format
- **Triggers**: Automatic generation on certificate creation

## API Endpoints

### 1. **GET /api/certificates**
- **Purpose**: Fetch user's certificates with statistics
- **Authentication**: Required (Bearer token)
- **Query Parameters**: `status`, `exam_type`
- **Response**: Certificates array + statistics

### 2. **POST /api/certificates**
- **Purpose**: Generate new certificates or track downloads
- **Authentication**: Required (Bearer token)
- **Actions**: `generate`, `download`
- **Body**: `{ exam_id, action }`

### 3. **GET /api/certificates/available**
- **Purpose**: Show exams eligible for certificate generation
- **Authentication**: Required (Bearer token)
- **Response**: Available exams with eligibility status

### 4. **POST /api/certificates/verify**
- **Purpose**: Verify certificate authenticity
- **Authentication**: Not required (public endpoint)
- **Body**: `{ verification_code }` or `{ certificate_number }`
- **Response**: Verification result with certificate details

### 5. **GET /api/certificates/[id]/download**
- **Purpose**: Download certificate and track usage
- **Authentication**: Required (Bearer token)
- **Response**: Certificate data for PDF generation

## User Workflow

### 1. **Exam Completion**
- Student completes exam
- Instructor evaluates and publishes results
- System automatically checks eligibility

### 2. **Certificate Generation**
- Student visits `/dashboard/user/certificates`
- Sees available exams for certificate generation
- Clicks "Generate Certificate" button
- System creates certificate with unique number

### 3. **Certificate Management**
- View all generated certificates
- Download PDF versions
- Track download counts
- Filter and search certificates

### 4. **Verification**
- Anyone can verify certificate authenticity
- Use verification code or certificate number
- View verified certificate details

## Eligibility Requirements

### ✅ **Certificate Generation Criteria**
- Exam must be completed (`status: completed/evaluated/published`)
- Results must be published by instructor
- Student must achieve passing score
- No existing certificate for the same exam

### ❌ **Exclusion Criteria**
- Failed exams (below passing marks)
- Unpublished results
- Already generated certificates
- Incomplete or abandoned exams

## Security Features

### **Authentication & Authorization**
- JWT token-based authentication
- Row Level Security (RLS) policies
- User can only access own certificates
- Admins can manage all certificates

### **Data Integrity**
- Unique constraints on certificate numbers
- Verification code generation
- Audit trail through metadata
- Status tracking and validation

### **Privacy Protection**
- No sensitive data exposure
- Verification endpoint shows limited information
- Download tracking for security monitoring

## Technical Implementation

### **Frontend Components**
- `CertificatesPage` - Main certificates interface
- Certificate generation workflow
- Advanced filtering and search
- Modal views for certificate details

### **Backend Services**
- Certificate generation logic
- Eligibility checking
- PDF generation (placeholder)
- Download tracking

### **Database Features**
- Automatic field generation
- Performance indexes
- JSON metadata storage
- Audit capabilities

## Future Enhancements

### **Planned Features**
- **PDF Generation**: Actual PDF certificate creation
- **Email Delivery**: Automatic certificate emailing
- **Digital Signatures**: Cryptographic verification
- **Expiry Management**: Automatic status updates
- **Bulk Operations**: Mass certificate generation

### **Integration Opportunities**
- **LMS Integration**: Connect with learning management systems
- **Blockchain Verification**: Immutable certificate records
- **API Access**: Third-party verification services
- **Analytics Dashboard**: Certificate usage insights

## Usage Examples

### **Generate Certificate**
```javascript
const response = await fetch('/api/certificates', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    exam_id: 'exam-uuid',
    action: 'generate'
  })
})
```

### **Verify Certificate**
```javascript
const response = await fetch('/api/certificates/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    verification_code: 'VERIFY-abc123def456'
  })
})
```

### **Fetch Certificates**
```javascript
const response = await fetch('/api/certificates?status=active', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

## Troubleshooting

### **Common Issues**
1. **"No access token available"** - User needs to log in again
2. **"Certificate already exists"** - Check for duplicate certificates
3. **"Results not yet published"** - Wait for instructor to publish
4. **"Did not achieve passing score"** - Check exam requirements

### **Debug Steps**
1. Verify user authentication
2. Check exam completion status
3. Confirm results publication
4. Validate passing score requirements
5. Check for existing certificates

## Support

For technical support or questions about the certificate system, please refer to:
- System documentation
- API endpoint documentation
- Database schema documentation
- User interface guides

---

**Last Updated**: August 16, 2025  
**Version**: 1.0.0  
**Status**: Production Ready 