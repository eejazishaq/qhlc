'use client'

import Link from 'next/link'
import { Users, Award, Smartphone, Globe, Shield, ChevronLeft, ChevronRight } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { useEffect, useState } from 'react'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/PublicFooter'

interface Banner {
  id: string
  title: string
  description: string
  image_url: string
  link_url: string
  display_order: number
}

export default function LandingPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBanners()
  }, [])

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length <= 1) return

    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length)
    }, 5000) // Change banner every 5 seconds

    return () => clearInterval(interval)
  }, [banners.length])

  const fetchBanners = async () => {
    try {
      const response = await fetch('/api/banners')
      
      if (response.ok) {
        const data = await response.json()
        setBanners(data.banners || [])
      } else {
        console.error('Failed to fetch banners:', response.status)
      }
    } catch (error) {
      console.error('Error fetching banners:', error)
    } finally {
      setLoading(false)
    }
  }

  const nextBanner = () => {
    setCurrentBannerIndex((prev) => (prev + 1) % banners.length)
  }

  const prevBanner = () => {
    setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }

  const goToBanner = (index: number) => {
    setCurrentBannerIndex(index)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <PublicHeader />

      {/* Banner Carousel */}
      {loading ? (
        <section className="relative bg-white py-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading banners...</p>
          </div>
        </section>
      ) : banners.length > 0 ? (
        <section className="relative bg-white">
          <div className="w-full">
            {/* Full-width banner carousel */}
            <div className="relative overflow-hidden" style={{ height: '80vh' }}>
              <div className="flex transition-transform duration-500 ease-in-out h-full" style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}>
                {banners.map((banner, index) => (
                  <div key={banner.id} className="w-full flex-shrink-0 h-full">
                    <div className="relative w-full h-full">
                      <img
                        src={banner.image_url}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                        onError={() => {
                          console.error('Image failed to load:', banner.image_url, 'for banner:', banner.title)
                        }}
                        loading={index === 0 ? 'eager' : 'lazy'}
                      />
                      {/* Gradient overlay for better text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                      
                      {/* Content overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-white px-8 max-w-4xl mx-auto">
                          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                            {banner.title}
                          </h1>
                          {banner.description && (
                            <p className="text-xl md:text-2xl lg:text-3xl mb-8 max-w-3xl mx-auto leading-relaxed opacity-90">
                              {banner.description}
                            </p>
                          )}
                          {banner.link_url && (
                            <Link
                              href={banner.link_url}
                              className="inline-block bg-white text-gray-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
                            >
                              Learn More
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Navigation Arrows */}
              {banners.length > 1 && (
                <>
                  <button
                    onClick={prevBanner}
                    className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                  <button
                    onClick={nextBanner}
                    className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </>
              )}
              
              {/* Dots Indicator */}
              {banners.length > 1 && (
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
                  {banners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToBanner(index)}
                      className={`w-4 h-4 rounded-full transition-all duration-300 ${
                        index === currentBannerIndex 
                          ? 'bg-white scale-125' 
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="relative bg-white py-8">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-gray-500">No active banners available</p>
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-16">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-gray-900 mb-8 leading-tight">
              Qur&apos;an Hadees &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Learning Course
              </span>
            </h1>
            <p className="text-2xl md:text-3xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed">
              A comprehensive web platform for Qur&apos;an Hadees learning, Learning Course, and educational administration in GCC.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                href="/register"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-5 rounded-full font-semibold text-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                Get Started Today
              </Link>
              <Link
                href="/resources"
                className="border-2 border-blue-600 text-blue-600 px-12 py-5 rounded-full font-semibold text-xl hover:bg-blue-600 hover:text-white transition-all duration-300 transform hover:scale-105"
              >
                Explore Resources
              </Link>
            </div>
          </div>
          
          {/* Mobile App Preview */}
          <div className="relative max-w-md mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl p-3 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="text-white text-sm font-semibold">QHLC</div>
                </div>
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white text-center">
                  <div className="flex justify-center mb-3">
                    <Logo width={48} height={48} className="w-12 h-12" />
                  </div>
                  <div className="text-lg font-semibold">Quranic Learning Portal</div>
                  <div className="text-sm opacity-90 mt-1">Access anywhere, anytime</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      {/* <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Learn Qur&apos;an, Hadees & Islamic Studies Online
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              We carefully choose our qualified tutors who are certified in Islamic studies to maintain the highest quality of education throughout your learning journey. Experience interactive, live sessions that provide both deep understanding and practical application of Islamic teachings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {/* Students */}
            {/* <div className="text-center">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">500+</h3>
              <p className="text-gray-600">Active Students</p>
            </div>
            
            {/* Courses */}
            {/* <div className="text-center">
              <div className="bg-gradient-to-br from-green-100 to-green-200 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">15+</h3>
              <p className="text-gray-600">Specialized Courses</p>
            </div>
            
            {/* Tutors */}
            {/* <div className="text-center">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">25+</h3>
              <p className="text-gray-600">Certified Tutors</p>
            </div>
            
            {/* Countries */}
            {/* <div className="text-center">
              <div className="bg-gradient-to-br from-orange-100 to-orange-200 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Globe className="w-10 h-10 text-orange-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">12+</h3>
              <p className="text-gray-600">Countries Served</p>
            </div>
          </div>
        </div>
      </section> */}

      {/* Why Choose Section */}
      {/* <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">QHLC</span>?
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We provide you with the best values for price among all other Islamic learning platforms online. Our platform offers a unique and personalized learning experience designed for all ages and skill levels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Flexible Learning */}
            {/* <div className="text-center p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Smartphone className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Attend Classes Anytime From Anywhere</h3>
              <p className="text-gray-600 leading-relaxed">
                Convenient home learning and time-saving opportunity. Study Qur'an and Islamic studies at the comfort of your home through our advanced learning platform.
              </p>
            </div>

            {/* Experience */}
            {/* <div className="text-center p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-br from-green-100 to-green-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Award className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">15+ Years of Teaching Experience</h3>
              <p className="text-gray-600 leading-relaxed">
                Since 2009, we bring the best in Islamic education, delivering on our promise of highest quality, convenience and offering a variety of courses suited to each student's needs.
              </p>
            </div>

            {/* Qualified Tutors */}
            {/* <div className="text-center p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Qualified Male and Female Tutors</h3>
              <p className="text-gray-600 leading-relaxed">
                Our tutors are highly educated and qualified to teach Qur'an, Hadees, Arabic language and Islamic studies. All are certified from recognized Islamic institutions.
              </p>
            </div>

            {/* Student-Centered */}
            {/* <div className="text-center p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-br from-orange-100 to-orange-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Student-Centered Teaching Methods</h3>
              <p className="text-gray-600 leading-relaxed">
                We have developed wonderful teaching methods that are centered on students' needs. We consider students to be the core component of the class.
              </p>
            </div>
          </div>
        </div>
      </section> */}

      {/* Courses Section */}
      {/* <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Best Online Courses
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Our Learning Programs - We have designed special learning programs for you. QHLC strives to deliver the best Islamic education online including Qur'an recitation, Hadees studies, and Islamic jurisprudence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Quran Classes for Kids */}
            {/* <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Qur'an Classes for Kids</h3>
                <p className="text-gray-600 mb-4">
                  Do you wish your child to learn and memorize Qur'an by heart? QHLC offers the best course of Qur'an learning with Tajweed for kids.
                </p>
                <Link href="/register" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  Start Free Trial
                </Link>
              </div>
            </div>

            {/* Islamic Studies */}
            {/* <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className="h-48 bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                <Award className="w-16 h-16 text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Islamic Studies Course</h3>
                <p className="text-gray-600 mb-4">
                  Comprehensive Islamic studies covering core principles, rituals, and historical significance of Islam for all levels.
                </p>
                <Link href="/register" className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                  Start Free Trial
                </Link>
              </div>
            </div>

            {/* Arabic Course */}
            {/* <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className="h-48 bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Globe className="w-16 h-16 text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Arabic Language Course</h3>
                <p className="text-gray-600 mb-4">
                  Learn Arabic through our comprehensive curriculum covering grammar, vocabulary, conversation skills and cultural insights.
                </p>
                <Link href="/register" className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                  Start Free Trial
                </Link>
              </div>
            </div>

            {/* Hadees Course */}
            {/* <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className="h-48 bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Hadees Studies</h3>
                <p className="text-gray-600 mb-4">
                  Deep dive into the teachings of Prophet Muhammad (PBUH) with authentic narrations and scholarly interpretations.
                </p>
                <Link href="/register" className="inline-block bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors">
                  Start Free Trial
                </Link>
              </div>
            </div>

            {/* Exam Management */}
            {/* <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className="h-48 bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                <Shield className="w-16 h-16 text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Exam Management</h3>
                <p className="text-gray-600 mb-4">
                  Comprehensive exam system for Islamic studies with automated grading, progress tracking, and certification.
                </p>
                <Link href="/register" className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                  Start Free Trial
                </Link>
              </div>
            </div>

            {/* Advanced Studies */}
            {/* <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className="h-48 bg-gradient-to-br from-teal-500 to-green-600 flex items-center justify-center">
                <Award className="w-16 h-16 text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Advanced Islamic Studies</h3>
                <p className="text-gray-600 mb-4">
                  Advanced courses in Islamic jurisprudence, theology, and specialized studies for serious learners.
                </p>
                <Link href="/register" className="inline-block bg-teal-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors">
                  Start Free Trial
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Testimonials Section */}
      {/* <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Real Reviews of Our Students
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Hear from our students and parents about their experience with QHLC's comprehensive Islamic education platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            {/* <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold">S</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Sarah Ahmed</h4>
                  <p className="text-gray-600">Canada</p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                "The teacher is awesome. My son loves her. Her kindness and sweet way of teaching makes my son speak out rather than being stubborn. Today an hour before the class itself he was asking for the teacher."
              </p>
            </div>

            {/* Testimonial 2 */}
            {/* <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-green-600 font-bold">A</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Ahmed Hassan</h4>
                  <p className="text-gray-600">UK</p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                "Classes were really nice! The Ustadh was clear in his explanation, so I understood quickly Alhamdulillah. The exam management system is excellent for tracking progress."
              </p>
            </div>

            {/* Testimonial 3 */}
            {/* <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-purple-600 font-bold">F</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Fatima Ali</h4>
                  <p className="text-gray-600">USA</p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                "I've tried other Islamic learning platforms but I really loved this one Alhamdulillah. The teacher was so good SubhanAllah and the platform is very user-friendly."
              </p>
            </div>
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Ready to Start Your Quranic Learning Journey?
          </h2>
          <p className="text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join thousands of students and educators using QHLC for Quranic education and exam management.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              href="/register"
              className="bg-white text-blue-600 px-12 py-5 rounded-full font-semibold text-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-xl"
            >
              Register Now
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white text-white px-12 py-5 rounded-full font-semibold text-xl hover:bg-white hover:text-blue-600 transition-all duration-300 transform hover:scale-105"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
} 