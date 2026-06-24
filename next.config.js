/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin project root when a parent folder also has package-lock.json (avoids wrong Turbopack root).
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
