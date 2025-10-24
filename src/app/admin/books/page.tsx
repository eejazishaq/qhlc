'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { Plus, Search, X, Edit, Trash2, FileText, Download, Eye, Upload, BookOpen } from 'lucide-react'

interface Book {
  id: string
  title: string
  description: string
  author: string
  category: string
  book_type: string
  pdf_url: string
  file_size: number
  is_public: boolean
  download_count: number
  uploaded_by: string
  created_at: string
  profile?: {
    full_name: string
  }
}

interface BookFormData {
  title: string
  description: string
  author: string
  category: string
  book_type: string
  is_public: boolean
}

export default function BooksPage() {
  const { user, profile, loading, session } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [books, setBooks] = useState<Book[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  
  // Form data
  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    description: '',
    author: '',
    category: '',
    book_type: '',
    is_public: false
  })
  
  // File upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalBooks, setTotalBooks] = useState(0)

  const categories = [
    'Academic',
    'Reference',
    'Textbook',
    'Study Guide',
    'Practice Test',
    'Manual',
    'Other'
  ]

  // Reset pagination when filters change
  const resetPagination = () => {
    setCurrentPage(1)
  }

  const handleCategoryFilterChange = (category: string) => {
    setSelectedCategoryFilter(category)
    resetPagination()
  }

  const handleStatusFilterChange = (status: string) => {
    setSelectedStatusFilter(status)
    resetPagination()
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }
    
    if (!loading && profile && !['admin', 'super_admin'].includes(profile.user_type)) {
      router.push('/dashboard/user')
      return
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    if (user && session?.access_token) {
      fetchBooks()
    }
  }, [user, session, selectedCategoryFilter, selectedStatusFilter, currentPage])

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '' && user && session?.access_token) {
        resetPagination()
        fetchBooks()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm, user, session])

  const fetchBooks = async () => {
    try {
      setLoadingData(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '100', // Assuming a fixed limit for now, can be adjusted
        search: searchTerm,
        category: selectedCategoryFilter,
        status: selectedStatusFilter
      })
      
      const response = await fetch(`/api/admin/books?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch books: ${response.status} ${errorText}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setBooks(data.books || [])
        setTotalBooks(data.pagination?.total || 0)
        setTotalPages(data.pagination?.pages || 1)
      } else {
        console.error('API returned success: false:', data);
        setBooks([])
        setTotalBooks(0)
        setTotalPages(1)
      }
    } catch (err) {
      console.error('Error fetching books:', err)
      setBooks([])
      setTotalBooks(0)
      setTotalPages(1)
    } finally {
      setLoadingData(false)
    }
  }



  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
    } else {
      alert('Please select a PDF file')
    }
  }

  const uploadPDF = async (): Promise<string | null> => {
    if (!selectedFile) return null
    
    try {
      setUploadProgress(0)
      
      // Validate file type
      if (selectedFile.type !== 'application/pdf') {
        alert('Please select a valid PDF file')
        return null
      }
      
      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024 // 10MB in bytes
      if (selectedFile.size > maxSize) {
        alert('File size must be less than 10MB')
        return null
      }
      
      // Generate unique filename
      const timestamp = Date.now()
      const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fileName = `${timestamp}_${sanitizedName}`
      const filePath = `books/${fileName}`
      
      // Upload to Supabase storage
      const { error } = await supabase.storage
        .from('books')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (error) {
        console.error('Storage upload error:', error)
        throw new Error(`Upload failed: ${error.message}`)
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('books')
        .getPublicUrl(filePath)
      
      setUploadProgress(100)
      
      return publicUrl
    } catch (error) {
      console.error('Error uploading PDF:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload PDF'
      alert(`Upload failed: ${errorMessage}`)
      return null
    }
  }

  const handleAddBook = async () => {
    if (!formData.title || !formData.author || !formData.book_type || !selectedFile) {
      alert('Please fill all required fields (Title, Author, Book Type) and select a PDF file')
      return
    }
    
    try {
      setFormLoading(true)
      
      // Upload PDF first
      const pdfUrl = await uploadPDF()
      if (!pdfUrl) return
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }
      
      const bookData = {
        ...formData,
        pdf_url: pdfUrl,
        file_size: selectedFile.size,
        category: formData.category || 'Other'
      }
      
      const response = await fetch('/api/admin/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(bookData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create book')
      }
      
      // Reset form and close modal
      setFormData({
        title: '',
        description: '',
        author: '',
        category: '',
        book_type: '',
        is_public: false
      })
      setSelectedFile(null)
      setUploadProgress(0)
      setShowAddModal(false)
      
      // Refresh books list
      fetchBooks()
      
      alert('Book created successfully!')
    } catch (error) {
      console.error('Error creating book:', error)
      alert(error instanceof Error ? error.message : 'Failed to create book')
    } finally {
      setFormLoading(false)
    }
  }

  const openEditModal = (book: Book) => {
    setSelectedBook(book)
    setFormData({
      title: book.title,
      description: book.description,
      author: book.author,
      category: book.category,
      book_type: book.book_type || '',
      is_public: book.is_public
    })
    setShowEditModal(true)
  }

  const handleEditBook = async () => {
    if (!selectedBook || !formData.title || !formData.author || !formData.book_type) {
      alert('Please fill all required fields (Title, Author, Book Type)')
      return
    }
    
    try {
      setFormLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }
      
      const updateData = {
        id: selectedBook.id,
        ...formData,
        category: formData.category || 'Other'
      }
      
      const response = await fetch(`/api/admin/books/${selectedBook.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(updateData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update book')
      }
      
      setShowEditModal(false)
      fetchBooks()
      alert('Book updated successfully!')
    } catch (error) {
      console.error('Error updating book:', error)
      alert('Failed to update book')
    } finally {
      setFormLoading(false)
    }
  }

  const openDeleteModal = (book: Book) => {
    setSelectedBook(book)
    setShowDeleteModal(true)
  }

  const handleDeleteBook = async () => {
    if (!selectedBook) return
    
    try {
      setDeleteLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }
      
      const response = await fetch(`/api/admin/books?id=${selectedBook.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete book')
      }
      
      setShowDeleteModal(false)
      fetchBooks()
      alert('Book deleted successfully!')
    } catch (error) {
      console.error('Error deleting book:', error)
      alert('Failed to delete book')
    } finally {
      setDeleteLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || !['admin', 'super_admin'].includes(profile?.user_type || '')) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Books Management</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage educational books and PDF resources</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Book</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search books by title, author, or description..."
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select 
                value={selectedCategoryFilter}
                onChange={(e) => handleCategoryFilterChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select 
                value={selectedStatusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Books Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Books</h3>
        </div>
        
        {/* Mobile Cards View */}
        <div className="block sm:hidden">
          {loadingData ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">No books found</p>
              <p className="text-xs text-gray-500">Books will appear here once they are uploaded</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {books.map((book) => (
                <div key={book.id} className="bg-gray-50 rounded-lg p-4 border">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{book.title}</div>
                        <div className="text-xs text-gray-500">{book.author}</div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      book.is_public 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {book.is_public ? 'Public' : 'Private'}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-3">
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Category:</span> {book.category}
                    </div>
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Size:</span> {formatFileSize(book.file_size)}
                    </div>
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Downloads:</span> {book.download_count}
                    </div>
                    {book.description && (
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Description:</span> {book.description}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(book)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(book)}
                        className="text-red-600 hover:text-red-900 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex space-x-2">
                      <a
                        href={book.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </a>
                      <a
                        href={book.pdf_url}
                        download
                        className="inline-flex items-center text-xs text-green-600 hover:text-green-800"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Book Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingData ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : books.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No books found</p>
                    <p className="text-sm">Books will appear here once they are uploaded</p>
                  </td>
                </tr>
              ) : (
                books.map((book) => (
                  <tr key={book.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{book.title}</div>
                          <div className="text-sm text-gray-500">{book.description || 'No description'}</div>
                          <div className="text-xs text-gray-400">Added {formatDate(book.created_at)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{book.author}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {book.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center space-x-1">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span>{formatFileSize(book.file_size)}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Downloads: {book.download_count}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        book.is_public 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {book.is_public ? 'Public' : 'Private'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(book)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(book)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <a
                          href={book.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-900"
                          title="View PDF"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <a
                          href={book.pdf_url}
                          download
                          className="text-purple-600 hover:text-purple-900"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                Showing {((currentPage - 1) * 100) + 1} to {Math.min(currentPage * 100, totalBooks)} of {totalBooks} books
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setCurrentPage(prev => Math.max(1, prev - 1))
                }}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => {
                  setCurrentPage(prev => Math.min(totalPages, prev + 1))
                }}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Book Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-11/12 sm:w-96 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Book</h3>
              <BookForm
                formData={formData}
                setFormData={setFormData}
                selectedFile={selectedFile}
                onFileSelect={handleFileSelect}
                uploadProgress={uploadProgress}
                onSubmit={handleAddBook}
                onCancel={() => setShowAddModal(false)}
                loading={formLoading}
                submitText="Create Book"
                categories={categories}
                onRemoveFile={() => setSelectedFile(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Book Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-11/12 sm:w-96 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Book</h3>
              <BookForm
                formData={formData}
                setFormData={setFormData}
                selectedFile={null}
                onFileSelect={() => {}}
                uploadProgress={0}
                onSubmit={handleEditBook}
                onCancel={() => setShowEditModal(false)}
                loading={formLoading}
                submitText="Update Book"
                categories={categories}
                isEdit={true}
                onRemoveFile={() => {}}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-11/12 sm:w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <FileText className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Book</h3>
              <p className="text-sm text-gray-500 mt-2">
                Are you sure you want to delete &quot;{selectedBook?.title}&quot;? This action cannot be undone.
              </p>
              <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteBook}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Book Form Component
interface BookFormProps {
  formData: BookFormData
  setFormData: (data: BookFormData) => void
  selectedFile: File | null
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void
  uploadProgress: number
  onSubmit: () => void
  onCancel: () => void
  loading: boolean
  submitText: string
  categories: string[]
  isEdit?: boolean
  onRemoveFile?: () => void
}

function BookForm({ 
  formData, 
  setFormData, 
  selectedFile, 
  onFileSelect, 
  uploadProgress, 
  onSubmit, 
  onCancel, 
  loading, 
  submitText, 
  categories,
  isEdit = false,
  onRemoveFile
}: BookFormProps) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Author *</label>
        <input
          type="text"
          value={formData.author}
          onChange={(e) => setFormData({ ...formData, author: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select Category</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Book Type *</label>
        <select
          value={formData.book_type}
          onChange={(e) => setFormData({ ...formData, book_type: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="">Select Book Type</option>
          <option value="quran">Quran</option>
          <option value="tafseer">Tafseer</option>
          <option value="other">Other</option>
        </select>
      </div>

      {!isEdit && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PDF File *</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                  <span>Upload a PDF</span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={onFileSelect}
                    className="sr-only"
                    required
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500">PDF up to 10MB</p>
            </div>
          </div>
          
          {selectedFile && (
            <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">{selectedFile.name}</p>
                    <p className="text-xs text-blue-700">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onRemoveFile}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            </div>
          )}
          
          {uploadProgress === 100 && (
            <div className="mt-3 p-2 bg-green-50 rounded-md border border-green-200">
              <div className="flex items-center space-x-2 text-green-700">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-sm">File uploaded successfully!</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center">
        <input
          id="is_public"
          type="checkbox"
          checked={formData.is_public}
          onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="is_public" className="ml-2 block text-sm text-gray-900">
          Make this book public (visible to all users)
        </label>
      </div>

      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : submitText}
        </button>
      </div>
    </form>
  )
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
} 