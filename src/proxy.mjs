export function resolveProxyConfig(baseEnv = process.env) {
  const httpProxy = baseEnv.HTTP_PROXY || baseEnv.http_proxy || 'http://127.0.0.1:7890'
  const httpsProxy = baseEnv.HTTPS_PROXY || baseEnv.https_proxy || httpProxy
  const allProxy = baseEnv.ALL_PROXY || baseEnv.all_proxy || 'socks5://127.0.0.1:7890'
  const noProxy = baseEnv.NO_PROXY || baseEnv.no_proxy || 'localhost,127.0.0.1,::1'

  return {
    httpProxy,
    httpsProxy,
    allProxy,
    noProxy,
  }
}

export function buildProxyEnv(baseEnv = process.env) {
  const proxy = resolveProxyConfig(baseEnv)

  return {
    ...baseEnv,
    HTTP_PROXY: proxy.httpProxy,
    HTTPS_PROXY: proxy.httpsProxy,
    ALL_PROXY: proxy.allProxy,
    NO_PROXY: proxy.noProxy,
  }
}
