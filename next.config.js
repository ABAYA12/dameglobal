/** @type {import('next').NextConfig} */
const config = {
  experimental: {
    typedRoutes: true,
  },
  images: {
    domains: ['localhost', 'uploadthing.com', 'utfs.io'],
  },
};

module.exports = config;
