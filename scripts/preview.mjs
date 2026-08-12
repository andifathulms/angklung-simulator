/**
 * Serve ./out under the production basePath, so what you check is what GitHub
 * Pages will serve — including the basePath, which is the part that breaks.
 */
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'

const BASE_PATH = '/angklung-simulator'
const OUT = join(process.cwd(), 'out')
const PORT = Number(process.env.PORT ?? 4321)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
}

if (!existsSync(OUT)) {
  console.error('Belum ada ./out — jalankan `pnpm build` dulu.')
  process.exit(1)
}

createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://localhost:${PORT}`)
  let pathname = decodeURIComponent(url.pathname)

  if (pathname === '/' || pathname === BASE_PATH) {
    response.writeHead(302, { Location: `${BASE_PATH}/` })
    response.end()
    return
  }
  if (!pathname.startsWith(BASE_PATH)) {
    response.writeHead(404, { 'content-type': 'text/plain' })
    response.end(`Di produksi situs ini dilayani dari ${BASE_PATH}/`)
    return
  }

  pathname = pathname.slice(BASE_PATH.length) || '/'
  let file = join(OUT, normalize(pathname))
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  if (!existsSync(file) && existsSync(`${file}.html`)) file = `${file}.html`

  if (!existsSync(file) || !file.startsWith(OUT)) {
    const notFound = join(OUT, '404.html')
    response.writeHead(404, { 'content-type': 'text/html; charset=utf-8' })
    if (existsSync(notFound)) createReadStream(notFound).pipe(response)
    else response.end('404')
    return
  }

  response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
  createReadStream(file).pipe(response)
}).listen(PORT, () => {
  console.log(`preview: http://localhost:${PORT}${BASE_PATH}/`)
})
