/**
 * Static export for GitHub Pages. basePath must match the repository name.
 * No backend, no runtime network, no audio assets.
 */
const isProd = process.env.NODE_ENV === 'production'
const repoName = 'angklung-simulator'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: isProd ? `/${repoName}` : '',
  assetPrefix: isProd ? `/${repoName}/` : undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
}

module.exports = nextConfig
