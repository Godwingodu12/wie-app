/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'lh3.googleusercontent.com', 'res.cloudinary.com'],
  },
  reactStrictMode: true,
  experimental: {
    appDir: true,
  },
};
module.exports = nextConfig;