/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove output: 'export' for Netlify with Next.js runtime
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  experimental: {
    appDir: true
  }
}

module.exports = nextConfig