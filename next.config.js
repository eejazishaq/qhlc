/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove output: 'export' for Netlify with Next.js runtime
  trailingSlash: true,
  images: {
    unoptimized: true,
    trailingSlash: true,
  },
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript checking during builds
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig