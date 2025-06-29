/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sử dụng SWC thay vì Babel để có hiệu suất tốt hơn
  swcMinify: true,
  
  // Cấu hình experimental cho SWC
  experimental: {
    // Sử dụng SWC compiler thay vì Babel
    forceSwcTransforms: true,
  },
  
  // Cấu hình cho TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Cấu hình cho ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Cấu hình CORS headers
  async headers() {
    return [
      {
        // matching all API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
          },
        ],
      },
    ];
  },

  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Cấu hình để xử lý các module ES6
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Thêm rule cho các file không được xử lý bởi SWC
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });

    return config;
  },
};

export default nextConfig;
