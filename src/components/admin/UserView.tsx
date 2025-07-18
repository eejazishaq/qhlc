'use client'

import { useState, useEffect } from 'react'
import { X, User, Phone, Mail, MapPin, Calendar, FileText, Users, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Tables } from '@/lib/supabase/client'

interface UserViewProps {
  user: Tables<'profiles'> | null
  isOpen: boolean
  onClose: () => void
}

interface LocationData {
  area?: any
  center?: any
}

export default function UserView({
  user,
  isOpen,
  onClose
}: UserViewProps) {
  const [locationData, setLocationData] = useState<LocationData>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      fetchLocationData()
    }
  }, [isOpen, user])

  const fetchLocationData = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      // Fetch area and center data
      const [areaResult, centerResult] = await Promise.all([
        supabase
          .from('areas')
          .select('*')
          .eq('id', user.area_id)
          .single(),
        supabase
          .from('exam_centers')
          .select('*')
          .eq('id', user.center_id)
          .single()
      ])

      setLocationData({
        area: areaResult.data,
        center: centerResult.data
      })
    } catch (error) {
      console.error('Error fetching location data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadgeColor = (userType: string) => {
    switch (userType) {
      case 'super_admin':
        return 'bg-red-100 text-red-800'
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      case 'convener':
        return 'bg-blue-100 text-blue-800'
      case 'coordinator':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not provided'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const calculateAge = (dob: string | null) => {
    if (!dob) return null
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  if (!isOpen || !user) return null

  const age = calculateAge(user.dob)
  const isChild = !!user.father_name || !!user.dob || !!user.iqama_number

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">User Details</h2>
            <p className="text-sm text-gray-600">View complete user information</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profile Header */}
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {user.profile_image ? (
                <img
                  className="h-16 w-16 rounded-full object-cover"
                  src={user.profile_image}
                  alt={user.full_name}
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                  <Users className="w-8 h-8 text-gray-600" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{user.full_name}</h3>
              <p className="text-sm text-gray-500">{user.serial_number}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.user_type)}`}>
                  {user.user_type.replace('_', ' ').toUpperCase()}
                </span>
                <div className="flex items-center">
                  {user.is_active ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`ml-1 text-xs ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Users className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">{user.gender}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Mobile Number</p>
                  <p className="text-sm font-medium text-gray-900">{user.mobile}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">WhatsApp Number</p>
                  <p className="text-sm font-medium text-gray-900">
                    {user.whatsapp_no || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Child Information */}
          {isChild && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Child Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Father Name</p>
                    <p className="text-sm font-medium text-gray-900">{user.father_name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(user.dob)} {age && `(${age} years old)`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Iqama Number</p>
                    <p className="text-sm font-medium text-gray-900">{user.iqama_number}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Location Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Location Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Area</p>
                  <p className="text-sm font-medium text-gray-900">
                    {loading ? 'Loading...' : locationData.area?.name || 'Unknown'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Exam Center</p>
                  <p className="text-sm font-medium text-gray-900">
                    {loading ? 'Loading...' : locationData.center?.name || 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Account Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(user.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(user.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end pt-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 