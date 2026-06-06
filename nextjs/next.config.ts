import path from "node:path";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== 'production';
const buildRoot = process.cwd();
const turbopackRoot = process.env.VERCEL && path.basename(buildRoot) === 'nextjs'
  ? path.dirname(buildRoot)
  : buildRoot;

const connectSrc = [
  "'self'",
  'https://sarana-backend.onrender.com',
  'https://www.google-analytics.com',
  'https://api.anthropic.com',
  'https://maps.googleapis.com',
  'https://*.ingest.sentry.io',
  'https://*.sentry.io',
  'https://accounts.google.com',
  'https://oauth2.googleapis.com',
  'https://www.googleapis.com',
  ...(isDev
    ? [
        'http://localhost:*',
        'http://127.0.0.1:*',
        'ws://localhost:*',
        'ws://127.0.0.1:*',
      ]
    : []),
];

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https: http:",
      `connect-src ${connectSrc.join(' ')}`,
      "frame-src 'self' https://maps.google.com https://www.google.com",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  turbopack: {
    root: turbopackRoot,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/duo61k04v/**' },
      { protocol: 'https', hostname: 'api.qrserver.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdnp.cody.mn' },
      { protocol: 'https', hostname: 'public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'cdn.eseller.mn' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'fastly.picsum.photos' },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
  async rewrites() {
    // Production: proxy.ts handles *.eseller.mn → /shop-sub/:slug
    // Dev only: next.config handles *.localhost → /shop-sub/:slug
    return {
      beforeFiles: [
        {
          source: '/:path*',
          has: [{ type: 'host', value: '(?<slug>[^.]+)\\.localhost' }],
          destination: '/shop-sub/:slug/:path*',
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
