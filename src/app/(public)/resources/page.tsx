'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Filter, FileText, Download, Loader2 } from 'lucide-react'

interface Resource {
  id: string
  title: string
  description: string | null
  file_url: string
  file_type: string
  file_size: number | null
  category: string | null
  is_public: boolean | null
  created_at?: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function PublicResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 12, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState<string>('')
  const [pendingSearch, setPendingSearch] = useState<string>('')
  const [category, setCategory] = useState<string>('all')

  // Derive categories from currently loaded data (simple approach without separate API)
  const categories = useMemo(() => {
    const set = new Set<string>()
    resources.forEach(r => {
      if (r.category) set.add(r.category)
    })
    return ['all', ...Array.from(set).sort()]
  }, [resources])

  const buildQuery = () => {
    const params = new URLSearchParams()
    params.set('is_public', 'true')
    params.set('page', String(pagination.page))
    params.set('limit', String(pagination.limit))
    if (search.trim()) params.set('search', search.trim())
    if (category !== 'all') params.set('category', category)
    return params.toString()
  }

  const fetchResources = async () => {
    try {
      setLoading(true)
      setError(null)
      const qs = buildQuery()
      const res = await fetch(`/api/resources?${qs}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Failed to load resources')
        setResources([])
        setPagination(prev => ({ ...prev, total: 0, totalPages: 0 }))
        return
      }
      setResources(data.resources || [])
      setPagination(prev => ({
        ...prev,
        page: data.pagination?.page ?? prev.page,
        limit: data.pagination?.limit ?? prev.limit,
        total: data.pagination?.total ?? prev.total,
        totalPages: data.pagination?.totalPages ?? prev.totalPages
      }))
    } catch {
      setError('Failed to load resources')
      setResources([])
      setPagination(prev => ({ ...prev, total: 0, totalPages: 0 }))
    } finally {
      setLoading(false)
    }
  }

  // Debounce search typing
  useEffect(() => {
    const id = setTimeout(() => setSearch(pendingSearch), 450)
    return () => clearTimeout(id)
  }, [pendingSearch])

  // Fetch when filters change
  useEffect(() => {
    fetchResources()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, pagination.page, pagination.limit])

  const onSelectCategory = (value: string) => {
    setCategory(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const onSearchChange = (value: string) => {
    setPendingSearch(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const humanFileSize = (bytes?: number | null) => {
    if (!bytes || bytes <= 0) return ''
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Resources</h1>
          <p className="text-gray-600 mt-2">Browse publicly available study materials and documents.</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={pendingSearch}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by title or description"
              />
            </div>

            {/* Category */}
            <div className="w-full md:w-64">
              <div className="relative">
                <Filter className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={category}
                  onChange={(e) => onSelectCategory(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Page size */}
            <div className="w-full md:w-40">
              <select
                value={pagination.limit}
                onChange={(e) => setPagination(prev => ({ ...prev, page: 1, limit: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[12, 24, 48].map(n => <option key={n} value={n}>{n} / page</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-xl shadow p-4 md:p-6">
          {loading ? (
            <div className="py-16 flex items-center justify-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading resources...
            </div>
          ) : error ? (
            <div className="py-10 text-center text-red-600 font-medium">{error}</div>
          ) : resources.length === 0 ? (
            <div className="py-10 text-center text-gray-600">No resources found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((r) => (
                <div key={r.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate" title={r.title}>{r.title}</h3>
                      {r.category && (
                        <div className="text-xs text-gray-500 mt-0.5">{r.category}</div>
                      )}
                      {r.description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-3">{r.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-3">
                        <span>{r.file_type?.toUpperCase() || 'FILE'}</span>
                        {r.file_size ? <span>• {humanFileSize(r.file_size)}</span> : null}
                      </div>
                      {r.file_url && (
                        <div className="mt-4">
                          <Link
                            href={r.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                          >
                            <Download className="w-4 h-4" /> Download
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && pagination.totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8">
              <div className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages} • {pagination.total} items
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page <= 1}
                  className="px-4 py-2 border rounded-md disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-4 py-2 border rounded-md disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 