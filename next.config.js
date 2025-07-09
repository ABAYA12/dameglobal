/** @type {import('next').NextConfig} */
const config = {
  experimental: {
    typedRoutes: false,
  },
  images: {
    domains: ['localhost', 'uploadthing.com', 'utfs.io'],
  },
  // Skip static optimization for dashboard pages
  async generateBuildId() {
    return 'debt-recovery-portal-build'
  },
  output: 'standalone'
};

module.exports = config;
