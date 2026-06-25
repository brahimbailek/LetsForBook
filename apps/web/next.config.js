const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Required for monorepo: trace files up to the repo root so workspace packages are included
  outputFileTracingRoot: path.join(__dirname, '../../'),
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
