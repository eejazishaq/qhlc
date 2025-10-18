'use client'

import { useState } from 'react'
import { Globe, MapPin, Building2, Users, X } from 'lucide-react'

interface LocationFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  title: string
  type: 'country' | 'region' | 'area' | 'center'
  initialData?: any
  countries?: Array<{ id: string; name: string; code: string }>
  regions?: Array<{ id: string; name: string; code: string }>
  areas?: Array<{ id: string; name: string; code: string }>
}

export default function LocationForm({
  isOpen,
  onClose,
  onSubmit,
  title,
  type,
  initialData,
  countries = [],
  regions = [],
  areas = []
}: LocationFormProps) {
  const [formData, setFormData] = useState(() => {
    if (initialData) {
      return {
        name: initialData.name || '',
        code: initialData.code || '',
        country_id: initialData.country_id || '',
        region_id: initialData.region_id || '',
        area_id: initialData.area_id || '',
        address: initialData.address || '',
        capacity: initialData.capacity || 50,
        contact_person: initialData.contact_person || '',
        contact_phone: initialData.contact_phone || '',
        is_active: initialData.is_active ?? true
      }
    }
    return {
      name: '',
      code: '',
      country_id: '',
      region_id: '',
      area_id: '',
      address: '',
      capacity: 50,
      contact_person: '',
      contact_phone: '',
      is_active: true
    }
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Code is required'
    }

    if (type === 'region' && !formData.country_id) {
      newErrors.country_id = 'Country is required'
    }

    if (type === 'area' && !formData.region_id) {
      newErrors.region_id = 'Region is required'
    }

    if (type === 'center') {
      if (!formData.area_id) {
        newErrors.area_id = 'Area is required'
      }
      if (!formData.capacity || formData.capacity < 1 || formData.capacity > 1000) {
        newErrors.capacity = 'Capacity must be between 1 and 1000'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // Prepare data based on type
    let submitData: any = {
      name: formData.name.trim(),
      code: formData.code.trim(),
      is_active: formData.is_active
    }

    switch (type) {
      case 'country':
        // Only name, code, and is_active for countries
        break
      case 'region':
        submitData.country_id = formData.country_id
        break
      case 'area':
        submitData.region_id = formData.region_id
        break
      case 'center':
        submitData.area_id = formData.area_id
        submitData.capacity = parseInt(formData.capacity.toString())
        submitData.address = formData.address.trim() || null
        submitData.contact_person = formData.contact_person.trim() || null
        submitData.contact_phone = formData.contact_phone.trim() || null
        break
    }

    onSubmit(submitData)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-4 sm:p-6 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === 'country' && <Globe className="w-4 h-4 inline mr-1" />}
              {type === 'region' && <MapPin className="w-4 h-4 inline mr-1" />}
              {type === 'area' && <Building2 className="w-4 h-4 inline mr-1" />}
              {type === 'center' && <Users className="w-4 h-4 inline mr-1" />}
              {type.charAt(0).toUpperCase() + type.slice(1)} Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder={`Enter ${type} name`}
            />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
          </div>

          {/* Code Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
              className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                errors.code ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder={`Enter ${type} code`}
              maxLength={type === 'country' ? 3 : type === 'center' ? 10 : 5}
            />
            {errors.code && <p className="text-sm text-red-600 mt-1">{errors.code}</p>}
          </div>

          {/* Country Field (for regions) */}
          {type === 'region' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Globe className="w-4 h-4 inline mr-1" />
                Country *
              </label>
              <select
                value={formData.country_id}
                onChange={(e) => handleInputChange('country_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errors.country_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select a country</option>
                {countries.map(country => (
                  <option key={country.id} value={country.id}>
                    {country.name} ({country.code})
                  </option>
                ))}
              </select>
              {errors.country_id && <p className="text-sm text-red-600 mt-1">{errors.country_id}</p>}
            </div>
          )}

          {/* Region Field (for areas) */}
          {type === 'area' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                Region *
              </label>
              <select
                value={formData.region_id}
                onChange={(e) => handleInputChange('region_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errors.region_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select a region</option>
                {regions.map(region => (
                  <option key={region.id} value={region.id}>
                    {region.name} ({region.code})
                  </option>
                ))}
              </select>
              {errors.region_id && <p className="text-sm text-red-600 mt-1">{errors.region_id}</p>}
            </div>
          )}

          {/* Area Field (for centers) */}
          {type === 'center' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Building2 className="w-4 h-4 inline mr-1" />
                Area *
              </label>
              <select
                value={formData.area_id}
                onChange={(e) => handleInputChange('area_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errors.area_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select an area</option>
                {areas.map(area => (
                  <option key={area.id} value={area.id}>
                    {area.name} ({area.code})
                  </option>
                ))}
              </select>
              {errors.area_id && <p className="text-sm text-red-600 mt-1">{errors.area_id}</p>}
            </div>
          )}

          {/* Address Field (for centers) */}
          {type === 'center' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter full address"
                rows={2}
              />
            </div>
          )}

          {/* Capacity Field (for centers) */}
          {type === 'center' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacity *
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={formData.capacity}
                onChange={(e) => handleInputChange('capacity', parseInt(e.target.value))}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errors.capacity ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter capacity (1-1000)"
              />
              {errors.capacity && <p className="text-sm text-red-600 mt-1">{errors.capacity}</p>}
            </div>
          )}

          {/* Contact Person Field (for centers) */}
          {type === 'center' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => handleInputChange('contact_person', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter contact person name"
              />
            </div>
          )}

          {/* Contact Phone Field (for centers) */}
          {type === 'center' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter phone number"
              />
            </div>
          )}


          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              Active
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm sm:text-base w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm sm:text-base w-full sm:w-auto"
            >
              {initialData ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
