'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Search, Filter, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

interface GalleryItem {
  id: string
  title: string
  description: string
  image_url: string
  category: string | null
  is_featured?: boolean
  created_at?: string
}

export default function PublicGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [pendingSearch, setPendingSearch] = useState('')
  const [category, setCategory] = useState('all')

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const categories = useMemo(() => {
    const s = new Set<string>()
    items.forEach(i => { if (i.category) s.add(i.category) })
    return ['all', ...Array.from(s).sort()]
  }, [items])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter(i => {
      const matchesCat = category === 'all' || i.category === category
      const matchesQ = !q || i.title.toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q)
      return matchesCat && matchesQ
    })
  }, [items, search, category])

  useEffect(() => {
    const id = setTimeout(() => setSearch(pendingSearch), 350)
    return () => clearTimeout(id)
  }, [pendingSearch])

  const fetchGallery = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/gallery')
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Failed to load gallery')
        setItems([])
        return
      }
      setItems(Array.isArray(data?.data) ? data.data : [])
    } catch (e) {
      setError('Failed to load gallery')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchGallery() }, [])

  const openLightbox = (idx: number) => setLightboxIndex(idx)
  const closeLightbox = () => setLightboxIndex(null)
  const prev = () => setLightboxIndex(v => (v === null ? v : (v - 1 + filtered.length) % filtered.length))
  const next = () => setLightboxIndex(v => (v === null ? v : (v + 1) % filtered.length))

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Gallery</h1>
          <p className="text-gray-600 mt-2">Explore moments and milestones from QHLC.</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by title or description"
              />
            </div>
            <div className="w-full md:w-64 relative">
              <Filter className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="bg-white rounded-xl shadow p-4 md:p-6">
          {loading ? (
            <div className="py-16 flex items-center justify-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading gallery...
            </div>
          ) : error ? (
            <div className="py-10 text-center text-red-600 font-medium">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-gray-600">No items found.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filtered.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => openLightbox(idx)}
                  className="group relative rounded-lg overflow-hidden border focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label={`View ${item.title}`}
                >
                  <div className="relative w-full pt-[75%] bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 via-black/20 to-transparent text-left">
                    <div className="text-white font-medium truncate" title={item.title}>{item.title}</div>
                    {item.category && (
                      <div className="text-white/80 text-xs">{item.category}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && filtered[lightboxIndex] && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={prev}
            className="absolute left-4 md:left-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
            aria-label="Previous"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
          <div className="max-w-5xl w-full px-6">
            <div className="relative w-full pt-[66%] bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={filtered[lightboxIndex].image_url}
                alt={filtered[lightboxIndex].title}
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
            <div className="text-white mt-4">
              <div className="text-lg font-semibold">{filtered[lightboxIndex].title}</div>
              {filtered[lightboxIndex].description && (
                <div className="text-white/80 mt-1">{filtered[lightboxIndex].description}</div>
              )}
            </div>
          </div>
          <button
            onClick={next}
            className="absolute right-4 md:right-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
            aria-label="Next"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        </div>
      )}
    </div>
  )
} 