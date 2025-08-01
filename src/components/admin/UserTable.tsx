'use client'

import React from 'react'
import { Table, Badge, Button } from '@/components/ui'
import { Edit, Trash2, Eye, MoreHorizontal, User, Phone, Mail, Calendar, MapPin } from 'lucide-react'

interface User {
  id: string
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
  serial_number: string
  is_active: boolean
  created_at: string
  areas?: { name: string }
  centers?: { name: string }
}

interface UserTableProps {
  users: User[]
  loading?: boolean
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  onView: (user: User) => void
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
  onSort?: (column: string) => void
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  loading = false,
  onEdit,
  onDelete,
  onView,
  sortColumn,
  sortDirection,
  onSort
}) => {
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
      month: 'short',
      day: 'numeric'
    })
  }

  const columns = [
    {
      key: 'serial_number',
      label: 'Serial No',
      sortable: true,
      className: 'w-24',
      render: (value: string) => (
        <span className="font-mono text-sm text-gray-600">{value}</span>
      )
    },
    {
      key: 'full_name',
      label: 'Name',
      sortable: true,
      className: 'min-w-48',
      render: (value: string, user: User) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="ml-3 min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 truncate">{value}</div>
            <div className="text-sm text-gray-500 truncate">{user.mobile}</div>
          </div>
        </div>
      )
    },
    {
      key: 'user_type',
      label: 'Role',
      sortable: true,
      className: 'w-32',
      render: (value: string) => (
        <Badge variant={getRoleBadgeVariant(value) as any}>
          {getRoleDisplayName(value)}
        </Badge>
      )
    },
    {
      key: 'areas',
      label: 'Location',
      sortable: false,
      className: 'min-w-40',
      render: (value: any, user: User) => (
        <div className="text-sm text-gray-900">
          <div className="truncate">{user.areas?.name || 'N/A'}</div>
          <div className="text-gray-500 truncate">{user.centers?.name || 'N/A'}</div>
        </div>
      )
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      className: 'w-20',
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'danger'}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'created_at',
      label: 'Joined',
      sortable: true,
      className: 'w-24',
      render: (value: string) => (
        <span className="text-sm text-gray-500">{formatDate(value)}</span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      className: 'w-32 text-right',
      render: (_: any, user: User) => (
        <div className="flex items-center justify-end space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(user)}
            className="text-blue-600 hover:text-blue-800 p-1"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(user)}
            className="text-green-600 hover:text-green-800 p-1"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(user)}
            className="text-red-600 hover:text-red-800 p-1"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  // Mobile Card Component
  const UserCard = ({ user }: { user: User }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{user.full_name}</h3>
            <p className="text-xs text-gray-500">{user.serial_number}</p>
          </div>
        </div>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(user)}
            className="text-blue-600 hover:text-blue-800 p-1"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(user)}
            className="text-green-600 hover:text-green-800 p-1"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(user)}
            className="text-red-600 hover:text-red-800 p-1"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center">
          <Phone className="h-3 w-3 text-gray-400 mr-1" />
          <span className="text-gray-600">{user.mobile}</span>
        </div>
        <div className="flex items-center">
          <Calendar className="h-3 w-3 text-gray-400 mr-1" />
          <span className="text-gray-600">{formatDate(user.created_at)}</span>
        </div>
        <div className="flex items-center">
          <MapPin className="h-3 w-3 text-gray-400 mr-1" />
          <span className="text-gray-600">{user.areas?.name || 'N/A'}</span>
        </div>
        <div className="flex items-center">
          <span className="text-gray-600">{user.centers?.name || 'N/A'}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <Badge variant={getRoleBadgeVariant(user.user_type) as any} className="text-xs">
          {getRoleDisplayName(user.user_type)}
        </Badge>
        <Badge variant={user.is_active ? 'success' : 'danger'} className="text-xs">
          {user.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="animate-pulse">
          <div className="bg-gray-200 h-12"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-100 h-16 border-t border-gray-200"></div>
          ))}
        </div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">No users found. Users will appear here once they register.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Desktop Table View */}
      <div className="hidden xl:block">
        <Table
          columns={columns}
          data={users}
          loading={loading}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={onSort}
          emptyMessage="No users found. Users will appear here once they register."
        />
      </div>

      {/* Tablet and Mobile Card View */}
      <div className="xl:hidden">
        <div className="space-y-4">
          {users.map((user, index) => (
            <UserCard key={user.id || index} user={user} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default UserTable 