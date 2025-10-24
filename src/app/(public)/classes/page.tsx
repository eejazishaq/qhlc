'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, MapPin, Phone, ExternalLink, Loader2 } from 'lucide-react'

interface ClassItem {
  id: string
  title: string
  description: string | null
  subject: string | null
  teacher_name: string
  area_id: string | null
  center_id: string | null
  address: string | null
  google_map_link: string | null
  contact_number: string | null
  email: string | null
  status: 'active' | 'inactive'
  created_at?: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function PublicClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 12, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState<string>('')
  const [pendingSearch, setPendingSearch] = useState<string>('')
  const [subject, setSubject] = useState<string>('')
  const [teacher, setTeacher] = useState<string>('')

  const buildQuery = () => {
    const params = new URLSearchParams()
    params.set('page', String(pagination.page))
    params.set('limit', String(pagination.limit))
    if (search.trim()) params.set('search', search.trim())
    if (subject.trim()) params.set('subject', subject.trim())
    if (teacher.trim()) params.set('teacher', teacher.trim())
    return params.toString()
  }

  const fetchClasses = async () => {
    try {
      setLoading(true)
      setError(null)
      const qs = buildQuery()
      const res = await fetch(`/api/classes?${qs}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Failed to load classes')
        setClasses([])
        setPagination(prev => ({ ...prev, total: 0, totalPages: 0 }))
        return
      }
      setClasses(data.classes || [])
      setPagination(prev => ({
        ...prev,
        page: data.pagination?.page ?? prev.page,
        limit: data.pagination?.limit ?? prev.limit,
        total: data.pagination?.total ?? prev.total,
        totalPages: data.pagination?.totalPages ?? prev.totalPages
      }))
    } catch {
      setError('Failed to load classes')
      setClasses([])
      setPagination(prev => ({ ...prev, total: 0, totalPages: 0 }))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const id = setTimeout(() => setSearch(pendingSearch), 450)
    return () => clearTimeout(id)
  }, [pendingSearch])

  useEffect(() => {
    fetchClasses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, subject, teacher, pagination.page, pagination.limit])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-600 mt-2">Browse our active classes across areas and centers.</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow p-4 md:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by title, description, or teacher"
              />
            </div>
            <div>
              <input
                type="text"
                value={subject}
                onChange={(e) => { setSubject(e.target.value); setPagination(prev => ({ ...prev, page: 1 })) }}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Filter by subject"
              />
            </div>
            <div>
              <input
                type="text"
                value={teacher}
                onChange={(e) => { setTeacher(e.target.value); setPagination(prev => ({ ...prev, page: 1 })) }}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Filter by teacher"
              />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-xl shadow p-4 md:p-6">
          {loading ? (
            <div className="py-16 flex items-center justify-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading classes...
            </div>
          ) : error ? (
            <div className="py-10 text-center text-red-600 font-medium">{error}</div>
          ) : classes.length === 0 ? (
            <div className="py-10 text-center text-gray-600">No classes found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((c) => (
                <div key={c.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate" title={c.title}>{c.title}</h3>
                      {c.subject && <div className="text-xs text-gray-500 mt-0.5">{c.subject}</div>}
                      <div className="text-sm text-gray-600 mt-1">Teacher: {c.teacher_name}</div>
                      {c.address && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 mt-2">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate" title={c.address}>{c.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-3">
                        {c.contact_number && (
                          <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {c.contact_number}</span>
                        )}
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        {c.google_map_link && (
                          <Link
                            href={c.google_map_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Open in Maps <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
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