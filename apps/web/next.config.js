/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@letsforbook/api',
    '@letsforbook/database',
    '@letsforbook/validation',
    '@letsforbook/types',
    '@letsforbook/utils',
    '@letsforbook/constants',
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
