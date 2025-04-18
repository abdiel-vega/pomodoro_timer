/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xiojgcphcxqgqfvlesrp.supabase.co',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
