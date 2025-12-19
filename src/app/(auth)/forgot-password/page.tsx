'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, Hash, Phone } from 'lucide-react'
import { Logo } from '@/components/Logo'

export default function ForgotPasswordPage() {
  const [resetMethod, setResetMethod] = useState<'email' | 'serial'>('email')
  const [email, setEmail] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [mobile, setMobile] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      let response
      let result

      if (resetMethod === 'email') {
        response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        })

        result = await response.json()

        if (!response.ok) {
          setError(result.error || 'Failed to send reset email')
          setLoading(false)
          return
        }

        if (result.success) {
          setSuccess(true)
          setSuccessMessage(`We've sent password reset instructions to ${email}`)
        } else {
          setError(result.error || 'Failed to send reset email')
        }
      } else {
        // Serial number reset
        response = await fetch('/api/auth/forgot-password-serial', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ serialNumber, mobile }),
        })

        result = await response.json()

        if (!response.ok) {
          setError(result.error || 'Failed to reset password')
          setLoading(false)
          return
        }

        if (result.success) {
          setSuccess(true)
          setSuccessMessage(result.message || 'Your password has been reset successfully. You can now login with your new password.')
          if (result.temporaryPassword) {
            setTemporaryPassword(result.temporaryPassword)
          }
        } else {
          setError(result.error || 'Failed to reset password')
        }
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleMethodChange = (method: 'email' | 'serial') => {
    setResetMethod(method)
    setError(null)
    setEmail('')
    setSerialNumber('')
    setMobile('')
  }

  return (
    <div className="flex items-center justify-center p-4 min-h-full">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Logo width={32} height={32} className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
          <p className="text-gray-600">
            {success
              ? resetMethod === 'email'
                ? 'Check your email for password reset instructions'
                : 'Your password has been reset successfully'
              : 'Choose your reset method below'}
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                {resetMethod === 'email' ? (
                  <Mail className="w-8 h-8 text-green-600" />
                ) : (
                  <Hash className="w-8 h-8 text-green-600" />
                )}
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {resetMethod === 'email' ? 'Email Sent!' : 'Password Reset Successful!'}
            </h2>
            <p className="text-gray-600 mb-4">
              {resetMethod === 'email' 
                ? successMessage 
                : 'Your password has been reset. Please use the temporary password below to login.'}
            </p>
            
            {resetMethod === 'serial' && temporaryPassword && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-semibold text-yellow-800 mb-2">Your Temporary Password:</p>
                <div className="flex items-center justify-between bg-white p-3 rounded border border-yellow-300">
                  <code className="text-lg font-mono font-bold text-gray-900">{temporaryPassword}</code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(temporaryPassword)
                      alert('Password copied to clipboard!')
                    }}
                    className="ml-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-yellow-700 mt-2">
                  ⚠️ Please save this password and change it immediately after logging in.
                </p>
              </div>
            )}
            
            {resetMethod === 'email' && (
              <p className="text-sm text-gray-500 mb-6">
                Please check your inbox and follow the instructions to reset your password.
                If you don't see the email, check your spam folder.
              </p>
            )}
            <Link
              href="/login"
              className="inline-block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        )}

        {/* Forgot Password Form */}
        {!success && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Reset Method Toggle */}
            <div className="mb-6">
              <div className="bg-gray-100 p-1 rounded-xl w-full">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0">
                  <button
                    type="button"
                    onClick={() => handleMethodChange('email')}
                    className={`flex-1 py-3 px-4 sm:px-6 rounded-lg font-semibold text-sm transition-all duration-200 ease-in-out ${
                      resetMethod === 'email'
                        ? 'bg-white text-blue-600 shadow-sm transform scale-105'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Mail className={`h-4 w-4 ${resetMethod === 'email' ? 'text-blue-600' : 'text-gray-500'}`} />
                      <span className="whitespace-nowrap">Email Reset</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMethodChange('serial')}
                    className={`flex-1 py-3 px-4 sm:px-6 rounded-lg font-semibold text-sm transition-all duration-200 ease-in-out ${
                      resetMethod === 'serial'
                        ? 'bg-white text-blue-600 shadow-sm transform scale-105'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Hash className={`h-4 w-4 ${resetMethod === 'serial' ? 'text-blue-600' : 'text-gray-500'}`} />
                      <span className="whitespace-nowrap">Serial Number</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Info Message for Serial Number */}
            {resetMethod === 'serial' && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <Hash className="w-3 h-3 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-blue-800 font-medium">
                      For Children / Users without Email
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Enter your registration number and mobile number to reset your password.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {resetMethod === 'email' ? (
                /* Email Field */
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>
              ) : (
                /* Serial Number and Mobile Fields */
                <>
                  <div>
                    <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Registration Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Hash className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="serialNumber"
                        name="serialNumber"
                        type="text"
                        required
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your registration number"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile Number
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
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your mobile number"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      We'll verify your mobile number matches your registration to reset your password.
                    </p>
                  </div>
                </>
              )}

              {/* Error Message */}
              {error && (
                <div className="text-red-600 text-sm text-center font-medium">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {resetMethod === 'email' ? 'Sending...' : 'Resetting...'}
                  </div>
                ) : (
                  resetMethod === 'email' ? 'Send Reset Link' : 'Reset Password'
                )}
              </button>
            </form>

            {/* Back to Login Link */}
            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

