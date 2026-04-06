import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  pageExtensions: ['ts', 'tsx', 'mdx'],
  experimental: {
    mdxRs: true,
  },
  images: {
    domains: [],
  },
  async rewrites() {
    return {
      // Runs before static file serving — ensures uploaded images added after
      // container startup are always served dynamically via the API route.
      beforeFiles: [
        {
          source: '/images/journal/:path*',
          destination: '/api/images/:path*',
        },
      ],
    }
  },
}

export default withNextIntl(nextConfig)
