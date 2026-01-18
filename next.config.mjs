/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
   experimental: {
    serverComponentsExternalPackages: ['mysql2', 'bcryptjs'],
  },
};

export default nextConfig;
