/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@jeeto/shared-types', '@jeeto/config', '@jeeto/validation'],
};

module.exports = nextConfig;
