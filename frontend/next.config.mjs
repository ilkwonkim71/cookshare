/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@cookshare/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
