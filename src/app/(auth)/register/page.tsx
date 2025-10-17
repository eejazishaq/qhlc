'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, User, Phone, BookOpen, Users, Baby, Copy, Check } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [mounted, setMounted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChild, setIsChild] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    whatsapp: '',
    gender: '',
    fatherName: '',
    dateOfBirth: '',
    iqamaNumber: '',
    password: '',
    confirmPassword: '',
    area: '',
    examCenter: ''
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<{ serialNumber: string; email: string } | null>(null)
  const [copiedField, setCopiedField] = useState<'serial' | 'email' | null>(null)
  const [areas, setAreas] = useState<Array<{ id: string; name: string }>>([])
  const [centers, setCenters] = useState<Array<{ id: string; name: string; area_id: string }>>([])
  const [loadingLocations, setLoadingLocations] = useState(false)
  const router = useRouter()
  const { loading, user, profile } = useAuth()

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load locations (areas and centers)
  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLoadingLocations(true)
        // Include Authorization header if a session token exists (not required for public mode)
        const { data: { session } } = await supabase.auth.getSession()
        const headers: HeadersInit = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
        const res = await fetch('/api/locations?public=true', { headers })
        const data = await res.json()
        if (!res.ok) {
          console.error('Failed to load locations', data)
          return
        }
        setAreas(data.areas || [])
        setCenters(data.centers || [])
      } catch (e) {
        console.error('Error loading locations', e)
      } finally {
        setLoadingLocations(false)
      }
    }
    loadLocations()
  }, [])

  // Handle redirects based on user type after successful registration
  useEffect(() => {
    if (user && profile && !loading) {
      console.log('User registered and authenticated, profile loaded:', { 
        email: user.email, 
        userType: profile.user_type 
      })
      // Redirect based on user type
      if (profile.user_type === 'admin' || profile.user_type === 'super_admin') {
        console.log('Admin user detected, redirecting to admin dashboard')
        router.push('/admin')
      } else if (profile.user_type === 'convener') {
        console.log('Convener user detected, redirecting to convener dashboard')
        router.push('/dashboard/convener')
      } else {
        // Regular users and coordinators use the same dashboard
        console.log('User/Coordinator detected, redirecting to user dashboard')
        router.push('/dashboard/user')
      }
    }
  }, [user, profile, loading, router])

  // Handle successful registration from API
  useEffect(() => {
    const checkRegistrationSuccess = async () => {
      // Check if user is authenticated after registration
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        console.log('User authenticated after registration:', session.user.email)
        // The redirect will be handled by the first useEffect
      }
    }

    // Check every 2 seconds for successful authentication
    const interval = setInterval(checkRegistrationSuccess, 2000)
    
    return () => clearInterval(interval)
  }, [])

  const handleCopy = async (text: string, field: 'serial' | 'email') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 1500)
    } catch (e) {
      console.error('Copy failed', e)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    
    // Validate required fields
    if (!formData.fullName.trim()) {
      setFormError('Full name is required')
      return
    }
    
    // Only require email for adult registration
    if (!isChild && !formData.email.trim()) {
      setFormError('Email is required for adult registration')
      return
    }
    
    if (!formData.mobile.trim()) {
      setFormError('Mobile number is required')
      return
    }
    
    if (!formData.gender) {
      setFormError('Gender is required')
      return
    }
    
    if (!formData.area) {
      setFormError('Area is required')
      return
    }
    
    if (!formData.examCenter) {
      setFormError('Exam center is required')
      return
    }
    
    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters long')
      return
    }
    
    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match')
      return
    }

    // Validate child-specific fields
    if (isChild) {
      if (!formData.fatherName.trim()) {
        setFormError('Father\'s name is required for child registration')
        return
      }
      if (!formData.dateOfBirth) {
        setFormError('Date of birth is required for child registration')
        return
      }
      if (!formData.iqamaNumber.trim()) {
        setFormError('Iqama number is required for child registration')
        return
      }
    }

    // Prepare profile data for API
    const profileData = {
      full_name: formData.fullName.trim(),
      mobile: formData.mobile.trim(),
      whatsapp_no: formData.whatsapp.trim() || null,
      gender: formData.gender as 'male' | 'female',
      father_name: isChild ? formData.fatherName.trim() : null,
      dob: isChild ? formData.dateOfBirth : null,
      iqama_number: isChild ? formData.iqamaNumber.trim() : null,
      area_id: formData.area,
      center_id: formData.examCenter,
      user_type: 'user' as const
    }

    try {
      setFormError(null)
      
      // Use the new API endpoint for registration
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: isChild ? '' : formData.email.trim(), // Empty email for children
          password: formData.password,
          profileData
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Registration error:', result.error)
        setFormError(result.error || 'Registration failed')
        return
      }

      if (result.success) {
        console.log('Registration successful:', result.message)
        // Show success screen with serial and email + copy buttons
        setSuccessData({ serialNumber: result.serialNumber, email: result.email })
      } else {
        setFormError(result.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setFormError('Registration failed. Please try again.')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset center when area changes
      ...(name === 'area' ? { examCenter: '' } : {})
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join QHLC</h1>
          <p className="text-gray-600">Create your account to start your Quranic learning journey</p>
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {!mounted ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : successData ? (
            // Success Screen
            <div className="space-y-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900">Registration Successful</h2>
              <p className="text-gray-600">Please save your serial number and login email for future use.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                <div className="border rounded-lg p-4 text-left">
                  <div className="text-sm text-gray-500 mb-1">Serial Number</div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-gray-900 break-all">{successData.serialNumber}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(successData.serialNumber, 'serial')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50"
                    >
                      {copiedField === 'serial' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedField === 'serial' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="border rounded-lg p-4 text-left">
                  <div className="text-sm text-gray-500 mb-1">Login Email</div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-gray-900 break-all">{successData.email}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(successData.email, 'email')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50"
                    >
                      {copiedField === 'email' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedField === 'email' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="w-full sm:w-auto bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Go to Login
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Registration Type */}
              <div className="mb-8">
                <div className="bg-gray-100 p-1 rounded-xl w-full">
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0">
                    <button
                      type="button"
                      onClick={() => setIsChild(false)}
                      className={`flex-1 py-3 px-4 sm:px-6 rounded-lg font-semibold text-sm transition-all duration-200 ease-in-out ${
                        !isChild
                          ? 'bg-white text-blue-600 shadow-sm transform scale-105'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Users className={`h-4 w-4 ${!isChild ? 'text-blue-600' : 'text-gray-500'}`} />
                        <span className="whitespace-nowrap">Adult Registration</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsChild(true)}
                      className={`flex-1 py-3 px-4 sm:px-6 rounded-lg font-semibold text-sm transition-all duration-200 ease-in-out ${
                        isChild
                          ? 'bg-white text-blue-600 shadow-sm transform scale-105'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Baby className={`h-4 w-4 ${isChild ? 'text-blue-600' : 'text-gray-500'}`} />
                        <span className="whitespace-nowrap">Child Registration</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {formError && (
                <div className="text-red-600 text-sm text-center font-medium">
                  {formError}
                </div>
              )}

              {/* Personal Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="lg:col-span-2">
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                {/* Email - Only show for adult registration */}
                {!isChild && (
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required={!isChild}
                        value={formData.email}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>
                )}

                {/* Mobile */}
                <div>
                  <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="mobile"
                      name="mobile"
                      type="tel"
                      required
                      value={formData.mobile}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your mobile number"
                    />
                  </div>
                </div>

                {/* WhatsApp */}
                <div>
                  <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp Number (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="whatsapp"
                      name="whatsapp"
                      type="tel"
                      value={formData.whatsapp}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your WhatsApp number"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    required
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              {/* Child-specific fields */}
              {isChild && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 border-t pt-6">
                  <div>
                    <label htmlFor="fatherName" className="block text-sm font-medium text-gray-700 mb-2">
                      Father&apos;s Name *
                    </label>
                    <input
                      id="fatherName"
                      name="fatherName"
                      type="text"
                      required={isChild}
                      value={formData.fatherName}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter father&apos;s name"
                    />
                  </div>

                  <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth *
                    </label>
                    <input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      required={isChild}
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label htmlFor="iqamaNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Iqama Number *
                    </label>
                    <input
                      id="iqamaNumber"
                      name="iqamaNumber"
                      type="text"
                      required={isChild}
                      value={formData.iqamaNumber}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter Iqama number"
                    />
                  </div>
                </div>
              )}

              {/* Location Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 border-t pt-6">
                <div>
                  <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-2">
                    Area *
                  </label>
                  <select
                    id="area"
                    name="area"
                    required
                    value={formData.area}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select area</option>
                    {loadingLocations ? (
                      <option value="">Loading areas...</option>
                    ) : areas.length === 0 ? (
                      <option value="">No areas available</option>
                    ) : (
                      areas.map(area => (
                        <option key={area.id} value={area.id}>
                          {area.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label htmlFor="examCenter" className="block text-sm font-medium text-gray-700 mb-2">
                    Exam Center *
                  </label>
                  <select
                    id="examCenter"
                    name="examCenter"
                    required
                    value={formData.examCenter}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select exam center</option>
                    {loadingLocations ? (
                      <option value="">Loading centers...</option>
                    ) : centers.length === 0 ? (
                      <option value="">No centers available for this area</option>
                    ) : (
                      centers
                        .filter(center => center.area_id === formData.area)
                        .map(center => (
                          <option key={center.id} value={center.id}>
                            {center.name}
                          </option>
                        ))
                    )}
                  </select>
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 border-t pt-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                  I agree to the{' '}
                  <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          )}

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 