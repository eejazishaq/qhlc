'use client'

import React from 'react'
import { Modal, Badge, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { User, Phone, Mail, MapPin, Calendar, IdCard, UserCheck, Clock, Hash } from 'lucide-react'

interface User {
  id: string
  full_name: string
  mobile: string
  whatsapp_no?: string
  gender: 'Male' | 'Female'
  user_type: 'user' | 'coordinator' | 'convener' | 'admin' | 'super_admin'
  area_id: string
  center_id: string
  father_name?: string
  dob?: string
  iqama_number?: string
  serial_number: string
  is_active: boolean
  created_at: string
  areas?: { name: string }
  centers?: { name: string }
}

interface UserDetailsModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  user,
  isOpen,
  onClose
}) => {
  if (!user) return null

  const getRoleBadgeVariant = (userType: string) => {
    switch (userType) {
      case 'super_admin':
        return 'danger'
      case 'admin':
        return 'warning'
      case 'convener':
        return 'info'
      case 'coordinator':
        return 'primary'
      case 'user':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const getRoleDisplayName = (userType: string) => {
    switch (userType) {
      case 'super_admin':
        return 'Super Admin'
      case 'admin':
        return 'Admin'
      case 'convener':
        return 'Convener'
      case 'coordinator':
        return 'Coordinator'
      case 'user':
        return 'User'
      default:
        return userType
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="User Details"
      size="lg"
    >
      <div className="space-y-6">
        {/* User Header */}
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900">{user.full_name}</h3>
            <p className="text-gray-500">{user.serial_number}</p>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={getRoleBadgeVariant(user.user_type) as any}>
                {getRoleDisplayName(user.user_type)}
              </Badge>
              <Badge variant={user.is_active ? 'success' : 'danger'}>
                {user.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="w-5 h-5 mr-2" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Mobile</p>
                  <p className="text-sm text-gray-600">{user.mobile}</p>
                </div>
              </div>
              
              {user.whatsapp_no && (
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">WhatsApp</p>
                    <p className="text-sm text-gray-600">{user.whatsapp_no}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Gender</p>
                  <p className="text-sm text-gray-600">{user.gender}</p>
                </div>
              </div>
              
              {user.dob && (
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Date of Birth</p>
                    <p className="text-sm text-gray-600">{formatDateOnly(user.dob)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Child-specific information */}
            {user.user_type === 'user' && (user.father_name || user.iqama_number) && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Child Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.father_name && (
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Father's Name</p>
                        <p className="text-sm text-gray-600">{user.father_name}</p>
                      </div>
                    </div>
                  )}
                  
                  {user.iqama_number && (
                    <div className="flex items-center space-x-3">
                      <IdCard className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Iqama Number</p>
                        <p className="text-sm text-gray-600">{user.iqama_number}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Location Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Area</p>
                  <p className="text-sm text-gray-600">{user.areas?.name || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <UserCheck className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Exam Center</p>
                  <p className="text-sm text-gray-600">{user.centers?.name || 'N/A'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Hash className="w-5 h-5 mr-2" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Hash className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Registration Number</p>
                  <p className="text-sm font-mono text-gray-600">{user.serial_number}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Member Since</p>
                  <p className="text-sm text-gray-600">{formatDate(user.created_at)}</p>
                </div>
              </div>
            </div>
            
            {/* Note: updated_at field removed from User interface */}
          </CardContent>
        </Card>
      </div>
    </Modal>
  )
}

export default UserDetailsModal 