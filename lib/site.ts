/**
 * Where the site lives. `basePath` must match the repository name on GitHub
 * Pages, and it is empty in development — so anything that has to write an
 * absolute path (the manifest, social images) asks here rather than guessing.
 */
export const REPO_NAME = 'angklung-simulator'

export const IS_PROD = process.env.NODE_ENV === 'production'

export const BASE_PATH = IS_PROD ? `/${REPO_NAME}` : ''

export const SITE_ORIGIN = 'https://andifathulms.github.io'

export const SITE_URL = `${SITE_ORIGIN}${BASE_PATH}`

/** Prefix a public-folder asset with the basePath. */
export function asset(path: string): string {
  return `${BASE_PATH}${path}`
}
