const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@astro-shine/shared-types'],

  // The repo is an npm-workspaces monorepo, so the correct tracing root is the
  // repo root, not whichever lockfile Next happens to find first walking up
  // from web/. Pinning it removes the "inferred your workspace root" warning
  // that appears when another lockfile exists above the repo.
  outputFileTracingRoot: path.join(__dirname, '..'),

  webpack: (config, { dev }) => {
    if (dev) {
      // The repo shares one node_modules across app/, web/ and server/. Those
      // packages are already installed and never change while `next dev` runs,
      // so watching them only burns inotify limits (ENOSPC on Linux).
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
          '**/android/**',
          '**/ios/**',
          '**/dist/**',
        ],
      };
    }
    return config;
  },
};

module.exports = nextConfig;
