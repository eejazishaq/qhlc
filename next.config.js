/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove output: 'export' for Netlify with Next.js runtime
  trailingSlash: true,
  images: {
    unoptimized: true
  },
      experimental: {
        // App directory is now stable in Next.js 15
      }
}

module.exports = nextConfig