/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
      domains: [
        'images.unsplash.com',
        'covers.openlibrary.org',
      ],
    },
    // 環境変数の設定
    publicRuntimeConfig: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    },
    serverRuntimeConfig: {
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    }
  };
  
  module.exports = nextConfig;