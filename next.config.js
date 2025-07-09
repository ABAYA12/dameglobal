/** @type {import('next').NextConfig} */
const config = {
  experimental: {
    typedRoutes: false,
  },
  images: {
    domains: ['localhost', 'uploadthing.com', 'utfs.io'],
  },
};

module.exports = config;
