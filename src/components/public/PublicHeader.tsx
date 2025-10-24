import Link from 'next/link'

export function PublicHeader() {
  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="text-2xl font-bold text-blue-600">QHLC</Link>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 whitespace-nowrap">
            <Link href="/resources" className="text-gray-700 hover:text-blue-600 transition-colors px-1">
              Resources
            </Link>
            <Link href="/gallery" className="text-gray-700 hover:text-blue-600 transition-colors px-1">
              Gallery
            </Link>
            <Link href="/books" className="text-gray-700 hover:text-blue-600 transition-colors px-1">
              Books
            </Link>
            <Link href="/classes" className="text-gray-700 hover:text-blue-600 transition-colors px-1">
              Classes
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-blue-600 transition-colors px-1">
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <Link 
                href="/login" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                Login
              </Link>
            </div>
            <div className="md:hidden">
              <Link href="/login" className="text-gray-700 hover:text-blue-600 text-sm">
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
} 