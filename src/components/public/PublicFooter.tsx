import Link from 'next/link'
import { BookOpen, Mail, Phone } from 'lucide-react'

export function PublicFooter() {
  return (
    <footer className="text-white border-t border-gray-800 flex flex-col min-h-0" style={{ backgroundColor: '#12214b' }}>
      {/* Main Content */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Brand Section */}
            <div className="md:col-span-1 min-w-0">
              <div className="flex items-center mb-6">
                <div className="bg-blue-600 p-2 rounded-lg mr-3 flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">QHLC</span>
              </div>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'oklch(0.85 0.02 240)' }}>
                Quranic Learning and Exam Management Portal for Saudi Arabia. Empowering education through technology.
              </p>
            </div>

            {/* Links Section */}
            <div className="md:col-span-1 min-w-0">
              <h4 className="font-semibold text-white mb-6 text-base">Quick Links</h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div className="space-y-3 min-w-0">
                  <Link href="/resources" className="block text-gray-300 hover:text-white transition-colors text-sm leading-5">
                    Resources
                  </Link>
                  <Link href="/gallery" className="block text-gray-300 hover:text-white transition-colors text-sm leading-5">
                    Gallery
                  </Link>
                  <Link href="/books" className="block text-gray-300 hover:text-white transition-colors text-sm leading-5">
                    Books
                  </Link>
                </div>
                <div className="space-y-3 min-w-0">
                  <Link href="/classes" className="block text-gray-300 hover:text-white transition-colors text-sm leading-5">
                    Classes
                  </Link>
                  <Link href="/contact" className="block text-gray-300 hover:text-white transition-colors text-sm leading-5">
                    Contact
                  </Link>
                  <Link href="/register" className="block text-gray-300 hover:text-white transition-colors text-sm leading-5">
                    Register
                  </Link>
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="md:col-span-1 min-w-0">
              <h4 className="font-semibold text-white mb-6 text-base">Contact Info</h4>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 min-w-0">
                  <Mail className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm leading-5 break-all">support@qhlc.com</span>
                </div>
                <div className="flex items-center space-x-3 min-w-0">
                  <Phone className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-gray-300 text-sm leading-5">+966-XX-XXX-XXXX</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Always at bottom */}
      <div className="border-t border-gray-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 min-w-0">
            <div className="text-gray-300 text-sm leading-relaxed">
              &copy; 2025 QHLC. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-300 flex-wrap justify-center sm:justify-end">
              <Link href="/privacy" className="hover:text-white transition-colors whitespace-nowrap leading-relaxed">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors whitespace-nowrap leading-relaxed">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}