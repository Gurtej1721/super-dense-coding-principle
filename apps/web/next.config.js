/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@quantum/contracts', '@quantum/core'],
  webpack: (config) => {
    return config;
  }
};

module.exports = nextConfig;
