'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { authenticatedFetch } from '@/lib/utils/api'
import { ChevronDown, Globe, MapPin, Building2, Users } from 'lucide-react'

interface Country {
  id: string
  name: string
  code: string
}

interface Region {
  id: string
  name: string
  code: string
  country_id: string
}

interface Area {
  id: string
  name: string
  code: string
  region_id: string
}

interface ExamCenter {
  id: string
  name: string
  capacity: number
  area_id: string
}

interface LocationSelectorProps {
  selectedCountry?: string
  selectedRegion?: string
  selectedArea?: string
  selectedCenter?: string
  onCountryChange?: (countryId: string) => void
  onRegionChange?: (regionId: string) => void
  onAreaChange?: (areaId: string) => void
  onCenterChange?: (centerId: string) => void
  showCenter?: boolean
  disabled?: boolean
  directMode?: boolean // When true, shows area/center selectors directly without country/region
}

export default function LocationSelector({
  selectedCountry,
  selectedRegion,
  selectedArea,
  selectedCenter,
  onCountryChange,
  onRegionChange,
  onAreaChange,
  onCenterChange,
  showCenter = false,
  disabled = false,
  directMode = false
}: LocationSelectorProps) {
  const { user } = useAuth()
  const [countries, setCountries] = useState<Country[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [centers, setCenters] = useState<ExamCenter[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCountries()
    
    // Fetch areas and centers for direct mode immediately
    if (directMode) {
      fetchAllAreas()
      if (showCenter) {
        fetchAllCenters()
      }
    }
  }, [directMode, showCenter])

  useEffect(() => {
    if (selectedCountry) {
      fetchRegions(selectedCountry)
    } else {
      setRegions([])
      setAreas([])
      setCenters([])
    }
  }, [selectedCountry])

  useEffect(() => {
    if (selectedRegion) {
      fetchAreas(selectedRegion)
    } else {
      setAreas([])
      setCenters([])
    }
  }, [selectedRegion])

  useEffect(() => {
    if (selectedArea && showCenter) {
      fetchCenters(selectedArea)
    } else {
      setCenters([])
    }
  }, [selectedArea, showCenter])

  const fetchCountries = async () => {
    try {
      setLoading(true)
      const response = await authenticatedFetch('/api/admin/locations/countries?limit=1000')

      if (response.ok) {
        const data = await response.json()
        setCountries(data.countries || [])
      }
    } catch (error) {
      console.error('Error fetching countries:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRegions = async (countryId: string) => {
    try {
      setLoading(true)
      const response = await authenticatedFetch(`/api/admin/locations/regions?countryId=${countryId}&limit=1000`)

      if (response.ok) {
        const data = await response.json()
        setRegions(data.regions || [])
      }
    } catch (error) {
      console.error('Error fetching regions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAreas = async (regionId: string) => {
    try {
      setLoading(true)
      const response = await authenticatedFetch(`/api/admin/locations/areas?regionId=${regionId}&limit=1000`)

      if (response.ok) {
        const data = await response.json()
        setAreas(data.areas || [])
      }
    } catch (error) {
      console.error('Error fetching areas:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCenters = async (areaId: string) => {
    try {
      setLoading(true)
      const response = await authenticatedFetch(`/api/admin/locations/centers?areaId=${areaId}&limit=1000`)

      if (response.ok) {
        const data = await response.json()
        setCenters(data.centers || [])
      }
    } catch (error) {
      console.error('Error fetching centers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllAreas = async () => {
    try {
      setLoading(true)
      const response = await authenticatedFetch('/api/admin/locations/areas?limit=1000')

      if (response.ok) {
        const data = await response.json()
        setAreas(data.areas || [])
      }
    } catch (error) {
      console.error('Error fetching all areas:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllCenters = async () => {
    try {
      setLoading(true)
      const response = await authenticatedFetch('/api/admin/locations/centers?limit=1000')

      if (response.ok) {
        const data = await response.json()
        setCenters(data.centers || [])
      }
    } catch (error) {
      console.error('Error fetching all centers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAreaHierarchy = async (areaId: string) => {
    try {
      setLoading(true)
      // Fetch area details with region and country information
      const response = await authenticatedFetch(`/api/admin/locations/areas/${areaId}`)
      
      if (response.ok) {
        const data = await response.json()
        const area = data.area
        
        if (area?.regions?.countries) {
          // Set the country, region, and areas based on the hierarchy
          const country = area.regions.countries
          const region = area.regions
          
          // Update the parent selections if we have them
          if (onCountryChange && country.id !== selectedCountry) {
            onCountryChange(country.id)
          }
          if (onRegionChange && region.id !== selectedRegion) {
            onRegionChange(region.id)
          }
          
          // Fetch regions for this country
          await fetchRegions(country.id)
          // Fetch areas for this region  
          await fetchAreas(region.id)
        }
      }
    } catch (error) {
      console.error('Error fetching area hierarchy:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4" style={{ position: 'relative' }}>
      {/* Country Selector - only show in hierarchical mode */}
      {!directMode && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Globe className="w-4 h-4 inline mr-1" />
            Country *
          </label>
          <select
            value={selectedCountry || ''}
            onChange={(e) => {
              onCountryChange?.(e.target.value)
              onRegionChange?.('')
              onAreaChange?.('')
              onCenterChange?.('')
            }}
            disabled={disabled || loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Select a country</option>
            {countries.map(country => (
              <option key={country.id} value={country.id}>
                {country.name} ({country.code})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Region Selector - only show in hierarchical mode */}
      {!directMode && selectedCountry && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin className="w-4 h-4 inline mr-1" />
            Region *
          </label>
          <select
            value={selectedRegion || ''}
            onChange={(e) => {
              onRegionChange?.(e.target.value)
              onAreaChange?.('')
              onCenterChange?.('')
            }}
            disabled={disabled || loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Select a region</option>
            {regions.map(region => (
              <option key={region.id} value={region.id}>
                {region.name} ({region.code})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Area Selector */}
      {((!directMode && selectedRegion) || directMode) && (
        <div className="relative" style={{ isolation: 'isolate' }}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Building2 className="w-4 h-4 inline mr-1" />
            Area *
          </label>
          <select
            value={selectedArea || ''}
            onChange={(e) => {
              onAreaChange?.(e.target.value)
              onCenterChange?.('')
            }}
            disabled={disabled || loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed appearance-none bg-white relative z-10"
            style={{
              position: 'relative',
              zIndex: 10,
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none'
            }}
          >
            <option value="">Select an area</option>
            {areas.map(area => (
              <option key={area.id} value={area.id}>
                {area.name} ({area.code})
              </option>
            ))}
          </select>
          {/* Custom dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none z-20" style={{ top: '1.75rem' }}>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      )}

      {/* Exam Center Selector */}
      {selectedArea && showCenter && (
        <div className="relative" style={{ isolation: 'isolate' }}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Users className="w-4 h-4 inline mr-1" />
            Exam Center *
          </label>
          <select
            value={selectedCenter || ''}
            onChange={(e) => onCenterChange?.(e.target.value)}
            disabled={disabled || loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed appearance-none bg-white relative z-10"
            style={{
              position: 'relative',
              zIndex: 10,
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none'
            }}
          >
            <option value="">Select an exam center</option>
            {centers
              .filter(center => 
                // In direct mode, filter by selectedArea
                directMode 
                  ? center.area_id === selectedArea 
                  : true
              )
              .map(center => (
                <option key={center.id} value={center.id}>
                  {center.name} (Capacity: {center.capacity})
                </option>
              ))}
          </select>
          {/* Custom dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none z-20" style={{ top: '1.75rem' }}>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}
