'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { User, Mail, Phone, MapPin, Calendar, Edit, Save, X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import ProfileImageUpload from '@/components/forms/ProfileImageUpload'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function UserProfilePage() {
  const { user, profile, updateProfile, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [areas, setAreas] = useState<{ id: string; name: string; code: string; is_active: boolean }[]>([])
  const [centers, setCenters] = useState<{ id: string; name: string; area_id: string; is_active: boolean }[]>([])
  const [filteredCenters, setFilteredCenters] = useState<{ id: string; name: string; area_id: string; is_active: boolean }[]>([])
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    mobile: profile?.mobile || '',
    whatsapp_no: profile?.whatsapp_no || '',
    gender: profile?.gender || '' as 'male' | 'female' | '',
    father_name: profile?.father_name || '',
    dob: profile?.dob || '',
    iqama_number: profile?.iqama_number || '',
    area_id: profile?.area_id || '',
    center_id: profile?.center_id || '',
  })
  const [profileImageUrl, setProfileImageUrl] = useState(profile?.profile_image || '')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    console.log('Profile page - loading:', loading, 'profile:', profile, 'user:', user)
    if (!loading && !profile) {
      console.log('Redirecting to login - no profile found')
      router.push('/login')
    }
  }, [profile, loading, router, user])

  // Fetch areas and centers from Supabase
  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClientComponentClient()
      const { data: areaData } = await supabase.from('areas').select('id, name, code, is_active').eq('is_active', true)
      const { data: centerData } = await supabase.from('exam_centers').select('id, name, area_id, is_active').eq('is_active', true)
      setAreas(areaData || [])
      setCenters(centerData || [])
    }
    fetchData()
  }, [])

  // Filter centers by selected area
  useEffect(() => {
    if (formData.area_id) {
      setFilteredCenters(centers.filter((c) => c.area_id === formData.area_id))
    } else {
      setFilteredCenters([])
    }
  }, [formData.area_id, centers])

  // Sync formData with profile when profile changes
  useEffect(() => {
    setFormData({
      full_name: profile?.full_name || '',
      mobile: profile?.mobile || '',
      whatsapp_no: profile?.whatsapp_no || '',
      gender: profile?.gender || '' as 'male' | 'female' | '',
      father_name: profile?.father_name || '',
      dob: profile?.dob || '',
      iqama_number: profile?.iqama_number || '',
      area_id: profile?.area_id || '',
      center_id: profile?.center_id || '',
    })
    setProfileImageUrl(profile?.profile_image || '')
  }, [profile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSave = async () => {
    try {
      const updateData = {
        ...formData,
        gender: formData.gender as 'male' | 'female' | undefined,
        dob: formData.dob === '' ? null : formData.dob,
      }
      const result = await updateProfile(updateData)
      if (!result.error) {
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const handleCancel = () => {
    setFormData({
      full_name: profile?.full_name || '',
      mobile: profile?.mobile || '',
      whatsapp_no: profile?.whatsapp_no || '',
      gender: profile?.gender || '' as 'male' | 'female' | '',
      father_name: profile?.father_name || '',
      dob: profile?.dob || '',
      iqama_number: profile?.iqama_number || '',
      area_id: profile?.area_id || '',
      center_id: profile?.center_id || '',
    })
    setIsEditing(false)
  }

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600">Manage your personal information</p>
            </div>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="flex items-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Image */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileImageUpload
                currentImageUrl={profileImageUrl}
                onImageUpdate={setProfileImageUrl}
                onError={(error) => console.error('Profile image error:', error)}
                disabled={!isEditing}
              />
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  leftIcon={<User className="w-4 h-4" />}
                  disabled={!isEditing}
                />
                <Input
                  label="Mobile Number"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  leftIcon={<Phone className="w-4 h-4" />}
                  disabled={!isEditing}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="WhatsApp Number"
                  name="whatsapp_no"
                  value={formData.whatsapp_no}
                  onChange={handleInputChange}
                  leftIcon={<Phone className="w-4 h-4" />}
                  disabled={!isEditing}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Father's Name"
                  name="father_name"
                  value={formData.father_name}
                  onChange={handleInputChange}
                  leftIcon={<User className="w-4 h-4" />}
                  disabled={!isEditing}
                />
                <Input
                  label="Date of Birth"
                  name="dob"
                  type="date"
                  value={formData.dob}
                  onChange={handleInputChange}
                  leftIcon={<Calendar className="w-4 h-4" />}
                  disabled={!isEditing}
                />
              </div>

              <Input
                label="Iqama Number"
                name="iqama_number"
                value={formData.iqama_number}
                onChange={handleInputChange}
                leftIcon={<User className="w-4 h-4" />}
                disabled={!isEditing}
              />

              {/* Area and Exam Center Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Area</label>
                  <select
                    name="area_id"
                    value={formData.area_id}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  >
                    <option value="">Select area</option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>{area.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exam Center</label>
                  <select
                    name="center_id"
                    value={formData.center_id}
                    onChange={handleInputChange}
                    disabled={!isEditing || !formData.area_id}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  >
                    <option value="">Select center</option>
                    {filteredCenters.map((center) => (
                      <option key={center.id} value={center.id}>{center.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {isEditing && (
                <div className="flex space-x-3 pt-4">
                  <Button onClick={handleSave} className="flex items-center">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button onClick={handleCancel} variant="outline" className="flex items-center">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Serial Number</p>
                  <p className="text-sm text-gray-500">{profile?.serial_number || 'QHLC-00000'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-500">{user?.email || 'user@example.com'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">User Type</p>
                  <p className="text-sm text-gray-500 capitalize">{profile?.user_type || 'user'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 