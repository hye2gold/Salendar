/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Expose API KEY to server side only
    API_KEY: process.env.API_KEY,
  },
};

export default nextConfig;