const path = require('path')
const http = require('http')
const https = require('https')
const { URL } = require('url')
const { getDefaultConfig } = require('expo/metro-config')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot)

config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

/** Proxy same-origin /laplasse-api → API préprod (contourne CORS en preview web). */
const API_PROXY_PREFIX = '/laplasse-api'
const API_PROXY_TARGET =
  process.env.EXPO_PUBLIC_API_PROXY_TARGET ??
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/api\/?$/, '') ??
  'https://api-preprod.laplasse.tech'

function proxyApiRequest(req, res) {
  const incoming = req.url ?? ''
  const targetPath = incoming.replace(API_PROXY_PREFIX, '/api')
  let targetUrl
  try {
    targetUrl = new URL(targetPath, API_PROXY_TARGET)
  } catch {
    res.writeHead(502, { 'Content-Type': 'text/plain' })
    res.end('Invalid proxy target')
    return
  }

  const lib = targetUrl.protocol === 'https:' ? https : http
  const headers = { ...req.headers, host: targetUrl.host }

  const proxyReq = lib.request(
    {
      method: req.method,
      hostname: targetUrl.hostname,
      port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
      path: `${targetUrl.pathname}${targetUrl.search}`,
      headers,
    },
    proxyRes => {
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers)
      proxyRes.pipe(res)
    },
  )

  proxyReq.on('error', err => {
    res.writeHead(502, { 'Content-Type': 'text/plain' })
    res.end(`API proxy error: ${err.message}`)
  })

  req.pipe(proxyReq)
}

config.server = {
  ...config.server,
  enhanceMiddleware: middleware => {
    return (req, res, next) => {
      if (req.url?.startsWith(API_PROXY_PREFIX)) {
        proxyApiRequest(req, res)
        return
      }
      return middleware(req, res, next)
    }
  },
}

module.exports = config
