'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { authenticatedFetch } from '@/lib/utils/api'
import { 
  Globe, 
  MapPin, 
  Building2, 
  Users,
  ChevronRight,
  ChevronDown,
  Eye,
  Edit,
  Plus,
  Search,
  RefreshCw
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Country {
  id: string
  name: string
  code: string
  is_active: boolean
  regions: Region[]
}

interface Region {
  id: string
  name: string
  code: string
  is_active: boolean
  country_id: string
  areas: Area[]
}

interface Area {
  id: string
  name: string
  code: string
  is_active: boolean
  region_id: string
  exam_centers: ExamCenter[]
}

interface ExamCenter {
  id: string
  name: string
  capacity: number
  is_active: boolean
  area_id: string
}

export default function HierarchyPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [hierarchy, setHierarchy] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [selectedItem, setSelectedItem] = useState<any>(null)

  useEffect(() => {
    if (profile?.user_type === 'admin' || profile?.user_type === 'super_admin') {
      fetchHierarchy()
    }
  }, [profile])

  const fetchHierarchy = async () => {
    try {
      setLoading(true)
      const response = await authenticatedFetch('/api/admin/locations/hierarchy')

      if (!response.ok) {
        throw new Error('Failed to fetch hierarchy')
      }

      const data = await response.json()
      setHierarchy(data.hierarchy || [])
    } catch (error) {
      console.error('Error fetching hierarchy:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const filterHierarchy = (items: Country[]): Country[] => {
    if (!searchTerm) return items

    return items.filter(country => {
      const countryMatches = country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           country.code.toLowerCase().includes(searchTerm.toLowerCase())

      const filteredRegions = country.regions.filter(region => {
        const regionMatches = region.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            region.code.toLowerCase().includes(searchTerm.toLowerCase())

        const filteredAreas = region.areas.filter(area => {
          const areaMatches = area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            area.code.toLowerCase().includes(searchTerm.toLowerCase())

          const filteredCenters = area.exam_centers.filter(center =>
            center.name.toLowerCase().includes(searchTerm.toLowerCase())
          )

          if (filteredCenters.length > 0 || areaMatches) {
            return { ...area, exam_centers: filteredCenters }
          }
          return false
        })

        if (filteredAreas.length > 0 || regionMatches) {
          return { ...region, areas: filteredAreas }
        }
        return false
      })

      if (filteredRegions.length > 0 || countryMatches) {
        return { ...country, regions: filteredRegions }
      }
      return false
    })
  }

  const getTotalStats = () => {
    let totalCountries = 0
    let totalRegions = 0
    let totalAreas = 0
    let totalCenters = 0
    let totalCapacity = 0

    hierarchy.forEach(country => {
      totalCountries++
      country.regions.forEach(region => {
        totalRegions++
        region.areas.forEach(area => {
          totalAreas++
          area.exam_centers.forEach(center => {
            totalCenters++
            totalCapacity += center.capacity
          })
        })
      })
    })

    return { totalCountries, totalRegions, totalAreas, totalCenters, totalCapacity }
  }

  const renderCountry = (country: Country) => {
    const isExpanded = expandedItems.has(country.id)
    const filteredRegions = searchTerm ? 
      country.regions.filter(region => region.areas.some(area => 
        area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        area.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        area.exam_centers.some(center => 
          center.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )) : country.regions

    return (
      <div key={country.id} className="border border-gray-200 rounded-lg mb-2">
        <div 
          className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer"
          onClick={() => toggleExpanded(country.id)}
        >
          <div className="flex items-center">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500 mr-2" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500 mr-2" />
            )}
            <Globe className="w-5 h-5 text-blue-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">{country.name}</h3>
              <p className="text-sm text-gray-500">Code: {country.code} • {filteredRegions.length} regions</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              country.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {country.is_active ? 'Active' : 'Inactive'}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/admin/locations/countries`)
              }}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="p-4 bg-white">
            <div className="space-y-3">
              {filteredRegions.map(region => renderRegion(region))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderRegion = (region: Region) => {
    const isExpanded = expandedItems.has(region.id)
    const filteredAreas = searchTerm ? 
      region.areas.filter(area => 
        area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        area.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        area.exam_centers.some(center => 
          center.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      ) : region.areas

    return (
      <div key={region.id} className="border border-gray-200 rounded-lg">
        <div 
          className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 cursor-pointer"
          onClick={() => toggleExpanded(region.id)}
        >
          <div className="flex items-center">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500 mr-2" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500 mr-2" />
            )}
            <MapPin className="w-4 h-4 text-green-600 mr-3" />
            <div>
              <h4 className="font-medium text-gray-900">{region.name}</h4>
              <p className="text-sm text-gray-500">Code: {region.code} • {filteredAreas.length} areas</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              region.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {region.is_active ? 'Active' : 'Inactive'}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/admin/locations/regions`)
              }}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="p-3 bg-white">
            <div className="space-y-2">
              {filteredAreas.map(area => renderArea(area))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderArea = (area: Area) => {
    const isExpanded = expandedItems.has(area.id)
    const filteredCenters = searchTerm ? 
      area.exam_centers.filter(center => 
        center.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) : area.exam_centers

    return (
      <div key={area.id} className="border border-gray-200 rounded-lg">
        <div 
          className="flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 cursor-pointer"
          onClick={() => toggleExpanded(area.id)}
        >
          <div className="flex items-center">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500 mr-2" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500 mr-2" />
            )}
            <Building2 className="w-4 h-4 text-purple-600 mr-3" />
            <div>
              <h5 className="font-medium text-gray-900">{area.name}</h5>
              <p className="text-sm text-gray-500">Code: {area.code} • {filteredCenters.length} centers</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              area.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {area.is_active ? 'Active' : 'Inactive'}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/admin/locations/areas`)
              }}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="p-3 bg-white">
            <div className="space-y-2">
              {filteredCenters.map(center => renderCenter(center))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderCenter = (center: ExamCenter) => (
    <div key={center.id} className="flex items-center justify-between p-3 bg-orange-50 hover:bg-orange-100 border border-gray-200 rounded-lg">
      <div className="flex items-center">
        <Users className="w-4 h-4 text-orange-600 mr-3" />
        <div>
          <h6 className="font-medium text-gray-900">{center.name}</h6>
          <p className="text-sm text-gray-500">Capacity: {center.capacity} seats</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          center.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {center.is_active ? 'Active' : 'Inactive'}
        </span>
        <button
          onClick={() => router.push(`/admin/locations/centers`)}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <Edit className="w-4 h-4" />
        </button>
      </div>
    </div>
  )

  if (profile?.user_type !== 'admin' && profile?.user_type !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  const stats = getTotalStats()
  const filteredHierarchy = filterHierarchy(hierarchy)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-2">
                <button
                  onClick={() => router.back()}
                  className="mr-4 p-2 hover:bg-gray-100 rounded-md"
                >
                  ← Back
                </button>
                <Eye className="w-8 h-8 text-blue-600 mr-3" />
                <h1 className="text-3xl font-bold text-gray-900">Location Hierarchy</h1>
              </div>
              <p className="text-gray-600">Complete location structure overview</p>
            </div>
            <button
              onClick={fetchHierarchy}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Globe className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Countries</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalCountries}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <MapPin className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Regions</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalRegions}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Building2 className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Areas</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalAreas}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Centers</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalCenters}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Capacity</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalCapacity}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Hierarchy */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Location Structure</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading hierarchy...</p>
              </div>
            ) : filteredHierarchy.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No locations found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHierarchy.map(country => renderCountry(country))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
