'use client'

import React, { useState, useEffect } from 'react'
import { Input, Button, Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui'
import LocationSelector from './LocationSelector'
import { User, Phone, Mail, MapPin, Calendar, IdCard, UserCheck } from 'lucide-react'

interface UserFormData {
  full_name: string
  mobile: string
  whatsapp_no?: string
  gender: 'male' | 'female'
  user_type: 'user' | 'coordinator' | 'convener' | 'admin' | 'super_admin'
  area_id: string
  center_id: string
  father_name?: string
  dob?: string
  iqama_number?: string
  is_active: boolean
  email?: string // Add email for new user creation
  password?: string // Add password for new user creation
}

interface Area {
  id: string
  name: string
}

interface Center {
  id: string
  name: string
  area_id: string
}

interface UserFormProps {
  user?: UserFormData
  areas: Area[]
  centers: Center[]
  onSubmit: (data: UserFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const UserForm: React.FC<UserFormProps> = ({
  user,
  areas,
  centers,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [formData, setFormData] = useState<UserFormData>({
    full_name: '',
    mobile: '',
    whatsapp_no: '',
    gender: 'male',
    user_type: 'user',
    area_id: '',
    center_id: '',
    father_name: '',
    dob: '',
    iqama_number: '',
    is_active: true,
    email: '',
    password: '',
    ...user
  })

  const [errors, setErrors] = useState<Partial<UserFormData>>({})
  const [filteredCenters, setFilteredCenters] = useState<Center[]>([])

  useEffect(() => {
    if (formData.area_id) {
      const centersInArea = centers.filter(center => 
        center.area_id === formData.area_id
      )
      setFilteredCenters(centersInArea)
    } else {
      setFilteredCenters([])
    }
  }, [formData.area_id, centers])

  const validateForm = (): boolean => {
    const newErrors: Partial<UserFormData> = {}

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required'
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required'
    } else if (!/^[0-9+\-\s()]+$/.test(formData.mobile)) {
      newErrors.mobile = 'Invalid mobile number format'
    }

    if (formData.whatsapp_no && !/^[0-9+\-\s()]+$/.test(formData.whatsapp_no)) {
      newErrors.whatsapp_no = 'Invalid WhatsApp number format'
    }

    // Email and password validation only for new users
    if (!user) {
      if (!formData.email?.trim()) {
        newErrors.email = 'Email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email format'
      }

      if (!formData.password?.trim()) {
        newErrors.password = 'Password is required'
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters'
      }
    }

    if (!formData.area_id) {
      newErrors.area_id = 'Area is required'
    }

    if (!formData.center_id) {
      newErrors.center_id = 'Exam center is required'
    }

    // Child-specific validations
    if (formData.user_type === 'user') {
      if (!formData.father_name?.trim()) {
        newErrors.father_name = 'Father name is required for child registration'
      }
      if (!formData.dob) {
        newErrors.dob = 'Date of birth is required for child registration'
      }
      if (!formData.iqama_number?.trim()) {
        newErrors.iqama_number = 'Iqama number is required for child registration'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      await onSubmit(formData)
    }
  }

  const handleInputChange = (field: keyof UserFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="w-5 h-5 mr-2" />
          {user ? 'Edit User' : 'Add New User'}
        </CardTitle>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Full Name *"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              error={errors.full_name}
              leftIcon={<User className="w-4 h-4" />}
              placeholder="Enter full name"
            />
            
            <Input
              label="Mobile Number *"
              value={formData.mobile}
              onChange={(e) => handleInputChange('mobile', e.target.value)}
              error={errors.mobile}
              leftIcon={<Phone className="w-4 h-4" />}
              placeholder="Enter mobile number"
            />
          </div>

          {/* Email and Password fields only for new users */}
          {!user && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Email *"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={errors.email}
                leftIcon={<Mail className="w-4 h-4" />}
                placeholder="Enter email address"
              />
              
              <Input
                label="Password *"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                error={errors.password}
                leftIcon={<UserCheck className="w-4 h-4" />}
                placeholder="Enter password (min 6 characters)"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="WhatsApp Number"
              value={formData.whatsapp_no}
              onChange={(e) => handleInputChange('whatsapp_no', e.target.value)}
              error={errors.whatsapp_no}
              leftIcon={<Phone className="w-4 h-4" />}
              placeholder="Enter WhatsApp number (optional)"
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User Role *
            </label>
            <select
              value={formData.user_type}
              onChange={(e) => handleInputChange('user_type', e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="user">User</option>
              <option value="coordinator">Coordinator</option>
              <option value="convener">Convener</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          {/* Location Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Location Assignment</h3>
            <LocationSelector
              selectedArea={formData.area_id}
              selectedCenter={formData.center_id}
              onAreaChange={(areaId) => handleInputChange('area_id', areaId)}
              onCenterChange={(centerId) => handleInputChange('center_id', centerId)}
              showCenter={true}
            />
            {errors.area_id && (
              <p className="text-sm text-red-600 mt-1">{errors.area_id}</p>
            )}
            {errors.center_id && (
              <p className="text-sm text-red-600 mt-1">{errors.center_id}</p>
            )}
          </div>

          {/* Child-specific fields (only for user role) */}
          {formData.user_type === 'user' && (
            <div className="border-t pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Child Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="Father Name *"
                  value={formData.father_name}
                  onChange={(e) => handleInputChange('father_name', e.target.value)}
                  error={errors.father_name}
                  leftIcon={<User className="w-4 h-4" />}
                  placeholder="Enter father's name"
                />
                
                <Input
                  label="Date of Birth *"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleInputChange('dob', e.target.value)}
                  error={errors.dob}
                  leftIcon={<Calendar className="w-4 h-4" />}
                />
                
                <Input
                  label="Iqama Number *"
                  value={formData.iqama_number}
                  onChange={(e) => handleInputChange('iqama_number', e.target.value)}
                  error={errors.iqama_number}
                  leftIcon={<IdCard className="w-4 h-4" />}
                  placeholder="Enter Iqama number"
                />
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Active Account
            </label>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
          >
            {user ? 'Update User' : 'Create User'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

export default UserForm 