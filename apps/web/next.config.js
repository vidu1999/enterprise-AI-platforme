/** @type {import('next').NextConfig} */
const apiTarget = (
  process.env.INTERNAL_API_URL ||
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:3001'
).replace(/\/$/, '');

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${apiTarget}/api/:path*` },
      { source: '/docs', destination: `${apiTarget}/docs` },
      { source: '/docs/:path*', destination: `${apiTarget}/docs/:path*` },
      { source: '/socket.io/:path*', destination: `${apiTarget}/socket.io/:path*` },
    ];
  },
};

module.exports = nextConfig;
