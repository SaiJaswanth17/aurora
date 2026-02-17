/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    domains: ['localhost', '*.supabase.co'],
  },
  transpilePackages: ['@aurora/shared'],
  async rewrites() {
    return [
      {
        source: '/api/socket',
        destination: 'http://localhost:3002/',
      },
    ];
  },
};

module.exports = nextConfig;
