/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'smartkollect.co.za',
        'mahikeng.smartkollect.co.za',
        'triplem.smartkollect.co.za',
        '*.smartkollect.co.za',
        'localhost:3000'
      ]
    }
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  },
  async redirects() {
    return [
      // Redirect www to non-www for all subdomains
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.smartkollect.co.za'
          }
        ],
        destination: 'https://smartkollect.co.za/:path*',
        permanent: true
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.mahikeng.smartkollect.co.za'
          }
        ],
        destination: 'https://mahikeng.smartkollect.co.za/:path*',
        permanent: true
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.triplem.smartkollect.co.za'
          }
        ],
        destination: 'https://triplem.smartkollect.co.za/:path*',
        permanent: true
      }
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
