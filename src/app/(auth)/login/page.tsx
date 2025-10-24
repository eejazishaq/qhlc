'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, BookOpen, Hash } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loginMethod, setLoginMethod] = useState<'email' | 'serial'>('email')
  const [formData, setFormData] = useState({
    email: '',
    serialNumber: '',
    password: ''
  })
  const [formError, setFormError] = useState<string | null>(null)
  const router = useRouter()
  const { signIn, signInWithSerial, loading, user, profile } = useAuth()

  // Handle redirects based on user type after successful authentication
  useEffect(() => {
    if (user && profile && !loading) {
      console.log('User authenticated, profile loaded:', { 
        email: user.email, 
        userType: profile.user_type 
      })
      
      // Redirect based on user type
      if (profile.user_type === 'admin' || profile.user_type === 'super_admin') {
        console.log('Admin user detected, redirecting to admin dashboard')
        router.push('/admin')
      } else if (profile.user_type === 'convener') {
        console.log('Convener user detected, redirecting to user dashboard')
        router.push('/dashboard/user')
      } else {
        // Regular users and coordinators use the same dashboard
        console.log('User/Coordinator detected, redirecting to user dashboard')
        router.push('/dashboard/user')
      }
    }
  }, [user, profile, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    
    if (loginMethod === 'email') {
      console.log('Email login form submitted with:', { email: formData.email })
      
      const { error } = await signIn(formData.email, formData.password)
      if (error) {
        console.error('Login error:', error)
        setFormError(error)
      } else {
        console.log('Login successful, checking user type for redirect')
        // The redirect will be handled by useEffect in the component
      }
    } else {
      console.log('Serial number login form submitted with:', { serialNumber: formData.serialNumber })
      
      // For serial number login, we only need serial number and password
      const { error } = await signInWithSerial(formData.serialNumber, formData.password)
      if (error) {
        console.error('Serial number login error:', error)
        setFormError(error)
      } else {
        console.log('Serial number login successful, checking user type for redirect')
        // The redirect will be handled by useEffect in the component
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleLoginMethodChange = (method: 'email' | 'serial') => {
    setLoginMethod(method)
    setFormError(null)
    // Clear form data when switching methods
    setFormData({
      email: '',
      serialNumber: '',
      password: ''
    })
  }

  return (
    <div className="flex items-center justify-center p-4 min-h-full">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your QHLC account</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing...</p>
          </div>
        )}

        {/* Login Form */}
        {!loading && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Login Method Toggle */}
            <div className="mb-8">
              <div className="bg-gray-100 p-1 rounded-xl w-full">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0">
                  <button
                    type="button"
                    onClick={() => handleLoginMethodChange('email')}
                    className={`flex-1 py-3 px-4 sm:px-6 rounded-lg font-semibold text-sm transition-all duration-200 ease-in-out ${
                      loginMethod === 'email'
                        ? 'bg-white text-blue-600 shadow-sm transform scale-105'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Mail className={`h-4 w-4 ${loginMethod === 'email' ? 'text-blue-600' : 'text-gray-500'}`} />
                      <span className="whitespace-nowrap">Email Login</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoginMethodChange('serial')}
                    className={`flex-1 py-3 px-4 sm:px-6 rounded-lg font-semibold text-sm transition-all duration-200 ease-in-out ${
                      loginMethod === 'serial'
                        ? 'bg-white text-blue-600 shadow-sm transform scale-105'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Hash className={`h-4 w-4 ${loginMethod === 'serial' ? 'text-blue-600' : 'text-gray-500'}`} />
                      <span className="whitespace-nowrap">Registration Number</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Serial Number Login Info */}
            {loginMethod === 'serial' && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <Hash className="w-3 h-3 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-blue-800 font-medium">
                      Registration Number Login
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Enter your registration number and password to sign in.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email or Serial Number Field */}
              <div>
                <label htmlFor={loginMethod === 'email' ? 'email' : 'serialNumber'} className="block text-sm font-medium text-gray-700 mb-2">
                  {loginMethod === 'email' ? 'Email Address' : 'Registration Number'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {loginMethod === 'email' ? (
                      <Mail className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Hash className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <input
                    id={loginMethod === 'email' ? 'email' : 'serialNumber'}
                    name={loginMethod === 'email' ? 'email' : 'serialNumber'}
                    type={loginMethod === 'email' ? 'email' : 'text'}
                    required
                    value={loginMethod === 'email' ? formData.email : formData.serialNumber}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={loginMethod === 'email' ? 'Enter your email' : 'Enter your registration number'}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
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
                    placeholder="Enter your password"
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

              {/* Error Message */}
              {formError && (
                <div className="text-red-600 text-sm text-center font-medium">
                  {formError}
                </div>
              )}

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                >
                  Forgot password?
                </Link>
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
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>
            </div>

            {/* Social Login Buttons - Commented out Google login */}
            <div className="mt-6 space-y-3">
              {/* Google login button commented out as requested */}
              {/*
              <button
                type="button"
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              */}
            </div>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <Link
                  href="/register"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-blue-600 hover:text-blue-500">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 