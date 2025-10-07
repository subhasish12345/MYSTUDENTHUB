import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image2url.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // This is to allow cross-origin requests in development.
  allowedDevOrigins: [
    'https://6000-firebase-studio-1758095471202.cluster-6dx7corvpngoivimwvvljgokdw.cloudworkstations.dev',
  ],
};

export default nextConfig;
