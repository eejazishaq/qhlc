'use client'

import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react'
import Link from 'next/link'

export default function PublicContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero */}
      <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900">Contact Us</h1>
            <p className="mt-3 md:mt-4 text-gray-600 text-base md:text-lg max-w-3xl mx-auto">
              Were here to help. Reach out for admissions, classes, exams, or general inquiries.
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* WhatsApp */}
            <div className="bg-white rounded-2xl shadow p-6 md:p-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">WhatsApp Support</h3>
                  <p className="text-sm text-gray-500">Fastest response</p>
                </div>
              </div>
              <div className="mt-4 text-gray-700">
                <p className="text-sm">Message us on WhatsApp for quick help with registration, classes, or exams.</p>
                <div className="mt-4">
                  <a
                    href="https://wa.me/966500000000"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full md:w-auto px-5 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700"
                  >
                    Chat on WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="bg-white rounded-2xl shadow p-6 md:p-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Call Us</h3>
                  <p className="text-sm text-gray-500">Sun 	 Thu, 9:00 AM 	 6:00 PM</p>
                </div>
              </div>
              <div className="mt-4 text-gray-700">
                <p className="text-sm">Speak to our support team about classes, scheduling and exam process.</p>
                <div className="mt-4 space-y-1">
                  <a href="tel:+966500000000" className="text-blue-600 hover:text-blue-700 font-medium">+966 50 000 0000</a>
                  <div className="text-sm text-gray-500">Arabic & English</div>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="bg-white rounded-2xl shadow p-6 md:p-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Email</h3>
                  <p className="text-sm text-gray-500">We reply within 24 hours</p>
                </div>
              </div>
              <div className="mt-4 text-gray-700">
                <p className="text-sm">For detailed queries, certifications or documentation requests.</p>
                <div className="mt-4">
                  <a href="mailto:support@qhlc.com" className="text-blue-600 hover:text-blue-700 font-medium">support@qhlc.com</a>
                </div>
              </div>
            </div>
          </div>

          {/* Locations & Hours */}
          <div className="mt-10 md:mt-16 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-white rounded-2xl shadow p-6 md:p-8 lg:col-span-2">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" /> Our Center
              </h3>
              <div className="mt-4 text-gray-700 space-y-1 text-sm">
                <div>QHLC Riyadh Center</div>
                <div>King Fahd Rd, Riyadh, Saudi Arabia</div>
                <div className="text-gray-500">Open: Sun 	 Thu, 9:00 AM 	 6:00 PM</div>
              </div>
              <div className="mt-5">
                <div className="w-full h-64 md:h-80 rounded-xl overflow-hidden border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1600&auto=format&fit=crop"
                    alt="QHLC Center Map"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-3">
                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50"
                  >
                    Open in Google Maps
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-6 md:p-8">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" /> Support Hours
              </h3>
              <div className="mt-4 text-gray-700 text-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span>Sunday 	 Thursday</span>
                  <span className="font-medium">9:00 AM 	 6:00 PM</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Friday 	 Saturday</span>
                  <span className="font-medium text-gray-500">Closed</span>
                </div>
              </div>

              <h3 className="mt-8 text-lg md:text-xl font-semibold text-gray-900">Quick Links</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li><Link href="/resources" className="text-blue-600 hover:text-blue-700 font-medium">Public Resources</Link></li>
                <li><Link href="/books" className="text-blue-600 hover:text-blue-700 font-medium">Books Library</Link></li>
                <li><Link href="/classes" className="text-blue-600 hover:text-blue-700 font-medium">Active Classes</Link></li>
                <li><Link href="/faq" className="text-blue-600 hover:text-blue-700 font-medium">FAQ</Link></li>
              </ul>

              <h3 className="mt-8 text-lg md:text-xl font-semibold text-gray-900">Social</h3>
              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <a href="#" className="block w-full text-center py-2 rounded-lg border hover:bg-gray-50">Facebook</a>
                <a href="#" className="block w-full text-center py-2 rounded-lg border hover:bg-gray-50">Instagram</a>
                <a href="#" className="block w-full text-center py-2 rounded-lg border hover:bg-gray-50">Twitter</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 