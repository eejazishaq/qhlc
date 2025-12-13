'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Users, Calendar, Plus, Edit, Eye, CheckCircle, XCircle } from 'lucide-react'
import { Logo } from '@/components/Logo'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'

interface Student {
  id: string
  full_name: string
  serial_number: string
}

interface Book {
  id: string
  user_id: string
  book_type: 'quran' | 'tafseer' | 'other'
  title: string
  issued_date: string
  return_date: string
  returned_date?: string
  status: 'issued' | 'returned' | 'overdue'
  issued_by: string
  created_at: string
  profiles?: {
    full_name: string
    serial_number: string
  }
}

export default function BooksPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  // Data states
  const [students, setStudents] = useState<Student[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [loadingBooks, setLoadingBooks] = useState(true)
  
  // UI states
  const [showIssueBookModal, setShowIssueBookModal] = useState(false)
  const [showReturnBookModal, setShowReturnBookModal] = useState(false)
  const [showBookDetailsModal, setShowBookDetailsModal] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  
  // Form states
  const [bookForm, setBookForm] = useState({
    studentId: '',
    book_type: 'quran' as 'quran' | 'tafseer' | 'other',
    title: '',
    return_date: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
    if (!loading && profile && profile.user_type !== 'coordinator') {
      router.push('/dashboard/user')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    if (user && profile?.user_type === 'coordinator') {
      fetchStudents()
      fetchBooks()
    }
  }, [user, profile])

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, serial_number')
        .eq('center_id', profile?.center_id)
        .eq('user_type', 'user')
        .eq('is_active', true)
        .order('full_name')

      if (error) {
        console.error('Error fetching students:', error)
        return
      }

      setStudents(data || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoadingStudents(false)
    }
  }

  const fetchBooks = async () => {
    try {
      setLoadingBooks(true)
      
      const { data, error } = await supabase
        .from('books')
        .select(`
          *,
          profiles:user_id(full_name, serial_number)
        `)
        .in('user_id', students.map(s => s.id))
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching books:', error)
        return
      }

      setBooks(data || [])
    } catch (error) {
      console.error('Error fetching books:', error)
    } finally {
      setLoadingBooks(false)
    }
  }

  // Refetch books when students change
  useEffect(() => {
    if (students.length > 0) {
      fetchBooks()
    }
  }, [students])

  const handleIssueBook = async () => {
    try {
      setSubmitting(true)
      
      const { error } = await supabase
        .from('books')
        .insert({
          user_id: bookForm.studentId,
          book_type: bookForm.book_type,
          title: bookForm.title,
          issued_date: new Date().toISOString().split('T')[0],
          return_date: bookForm.return_date,
          status: 'issued',
          issued_by: user?.id,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error issuing book:', error)
        alert('Failed to issue book. Please try again.')
        return
      }

      alert('Book issued successfully!')
      setShowIssueBookModal(false)
      setBookForm({
        studentId: '',
        book_type: 'quran',
        title: '',
        return_date: ''
      })
      fetchBooks()
    } catch (error) {
      console.error('Error issuing book:', error)
      alert('Failed to issue book. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReturnBook = async (bookId: string) => {
    try {
      const { error } = await supabase
        .from('books')
        .update({
          returned_date: new Date().toISOString().split('T')[0],
          status: 'returned'
        })
        .eq('id', bookId)

      if (error) {
        console.error('Error returning book:', error)
        alert('Failed to return book. Please try again.')
        return
      }

      alert('Book returned successfully!')
      setShowReturnBookModal(false)
      setSelectedBook(null)
      fetchBooks()
    } catch (error) {
      console.error('Error returning book:', error)
      alert('Failed to return book. Please try again.')
    }
  }

  const getBooksStats = () => {
    const issued = books.filter(book => book.status === 'issued').length
    const returned = books.filter(book => book.status === 'returned').length
    const overdue = books.filter(book => {
      if (book.status === 'issued') {
        return new Date(book.return_date) < new Date()
      }
      return false
    }).length
    const total = books.length
    
    return { issued, returned, overdue, total }
  }

  const stats = getBooksStats()

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || profile?.user_type !== 'coordinator') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Books Management
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Issue and track books for your students
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Button
              onClick={() => setShowIssueBookModal(true)}
              className="inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Issue Book
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Logo width={24} height={24} className="h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Books</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Issued</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.issued}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Returned</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.returned}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircle className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Overdue</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.overdue}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Books Table */}
        <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Books Records
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Track all book issuances and returns
            </p>
          </div>

          {loadingBooks ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading books records...</p>
            </div>
          ) : books.length === 0 ? (
            <div className="p-6 text-center">
              <div className="flex justify-center">
                <Logo width={48} height={48} className="h-12 w-12 opacity-40" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No books records</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start managing books by issuing them to students.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Book Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issue Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Return Date
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
                  {books.map((book) => (
                    <tr key={book.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {book.profiles?.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {book.profiles?.serial_number}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{book.title}</div>
                          <div className="text-sm text-gray-500 capitalize">
                            {book.book_type}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(book.issued_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(book.return_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={
                            book.status === 'returned' ? 'success' :
                            book.status === 'overdue' ? 'danger' : 'warning'
                          }
                        >
                          {book.status === 'overdue' ? 'Overdue' : 
                           book.status.charAt(0).toUpperCase() + book.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedBook(book)
                            setShowBookDetailsModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {book.status === 'issued' && (
                          <button
                            onClick={() => {
                              setSelectedBook(book)
                              setShowReturnBookModal(true)
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Issue Book Modal */}
        <Modal
          isOpen={showIssueBookModal}
          onClose={() => setShowIssueBookModal(false)}
          title="Issue Book"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student
              </label>
              <select
                value={bookForm.studentId}
                onChange={(e) => setBookForm({...bookForm, studentId: e.target.value})}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              >
                <option value="">Select a student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name} ({student.serial_number})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Book Type
                </label>
                <select
                  value={bookForm.book_type}
                  onChange={(e) => setBookForm({...bookForm, book_type: e.target.value as any})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="quran">Quran</option>
                  <option value="tafseer">Tafseer</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Return Date
                </label>
                <input
                  type="date"
                  value={bookForm.return_date}
                  onChange={(e) => setBookForm({...bookForm, return_date: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Book Title
              </label>
              <input
                type="text"
                value={bookForm.title}
                onChange={(e) => setBookForm({...bookForm, title: e.target.value})}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter book title"
                required
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setShowIssueBookModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleIssueBook}
                disabled={submitting || !bookForm.studentId || !bookForm.title || !bookForm.return_date}
              >
                {submitting ? 'Issuing...' : 'Issue Book'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Return Book Modal */}
        <Modal
          isOpen={showReturnBookModal}
          onClose={() => setShowReturnBookModal(false)}
          title="Return Book"
          size="md"
        >
          {selectedBook && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p><span className="font-medium">Student:</span> {selectedBook.profiles?.full_name}</p>
                <p><span className="font-medium">Book:</span> {selectedBook.title}</p>
                <p><span className="font-medium">Issued:</span> {new Date(selectedBook.issued_date).toLocaleDateString()}</p>
                <p><span className="font-medium">Due:</span> {new Date(selectedBook.return_date).toLocaleDateString()}</p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setShowReturnBookModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleReturnBook(selectedBook.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Confirm Return
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Book Details Modal */}
        <Modal
          isOpen={showBookDetailsModal}
          onClose={() => setShowBookDetailsModal(false)}
          title="Book Details"
          size="lg"
        >
          {selectedBook && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Student Information</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Name</dt>
                      <dd className="text-sm text-gray-900">{selectedBook.profiles?.full_name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Serial Number</dt>
                      <dd className="text-sm text-gray-900">{selectedBook.profiles?.serial_number}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Book Information</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Title</dt>
                      <dd className="text-sm text-gray-900">{selectedBook.title}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Type</dt>
                      <dd className="text-sm text-gray-900 capitalize">{selectedBook.book_type}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="text-sm text-gray-900">
                        <Badge 
                          variant={
                            selectedBook.status === 'returned' ? 'success' :
                            selectedBook.status === 'overdue' ? 'danger' : 'warning'
                          }
                        >
                          {selectedBook.status === 'overdue' ? 'Overdue' : 
                           selectedBook.status.charAt(0).toUpperCase() + selectedBook.status.slice(1)}
                        </Badge>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Dates</h3>
                <dl className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Issue Date</dt>
                    <dd className="text-sm text-gray-900">{new Date(selectedBook.issued_date).toLocaleDateString()}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Return Date</dt>
                    <dd className="text-sm text-gray-900">{new Date(selectedBook.return_date).toLocaleDateString()}</dd>
                  </div>
                  {selectedBook.returned_date && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Returned Date</dt>
                      <dd className="text-sm text-gray-900">{new Date(selectedBook.returned_date).toLocaleDateString()}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}
