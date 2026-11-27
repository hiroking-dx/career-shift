// Supabase Auth REST interface. Only a publishable key is accepted here.
                                                 
                       
                      
                       
                    
             
 
const prefix = 'career-shift:' + new URL('.', location.href).pathname + ':'
export const authKey = prefix + 'session'
function get   (key        )           {
  const raw = globalThis.localStorage?.getItem(prefix + key)
  return raw ? JSON.parse(raw) : null
}
function put(key        , value         ) {
  localStorage.setItem(prefix + key, JSON.stringify(value))
}
export const config = () => ({
  url: 'https://jztnblahuusepwyxgswe.supabase.co',
  key: 'sb_publishable_-UU3jRtZYKa0UNjda_u32A_M167Ff2P',
})
export const session = () => get         ('session')
export class ApiError extends Error {
           status        
           code        
  constructor(status        , code        ) {
    super(
      status === 403 || code === '42501'
        ? '本人の利用許可をSupabaseで確認してください。'
        : status === 401
        ? 'Googleで再ログインしてください。'
        : code === '22023'
        ? '同期サイズ上限（3 MB）を超えたか、データ形式が無効です。'
        : 'クラウド通信を完了できませんでした。設定と接続を確認してください。'
    )
    this.status = status
    this.code = code
  }
}
export async function api(path        , body          , token         ) {
  const c = config()
  if (!c) throw Error('Supabaseの接続設定が必要です。')
  const res = await fetch(c.url + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      apikey: c.key,
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'omit',
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(18000),
  })
  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    throw Error('Supabaseの応答を確認できません。')
  }
  if (!res.ok)
    throw new ApiError(res.status, String(data?.code || data?.error_code || ''))
  return data
}
const encode = (bytes            ) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '')
export async function login() {
  const c = config()
  if (!c) throw Error('先に接続設定を保存してください。')
  if (!navigator.locks)
    throw Error('同期に対応した最新版のSafariまたはChromeで開いてください。')
  const settings = await api('/auth/v1/settings')
  if (settings?.external?.google !== true)
    throw Error(
      'SupabaseでGoogleログインを有効にしてください（Authentication → Sign In / Providers → Google）。'
    )
  const verifier = encode(crypto.getRandomValues(new Uint8Array(48)))
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier)
  )
  const redirect = location.origin + location.pathname
  put('oauth', { verifier, project: c.url, at: Date.now() })
  const params = new URLSearchParams({
    provider: 'google',
    redirect_to: redirect,
    code_challenge: encode(new Uint8Array(digest)),
    code_challenge_method: 's256',
    prompt: 'select_account',
  })
  location.assign(c.url + '/auth/v1/authorize?' + params)
}
function persist(data                         , expected         ) {
  const uid = (data.user                   )?.id
  if (
    !uid ||
    (expected && expected !== uid) ||
    typeof data.access_token !== 'string' ||
    typeof data.refresh_token !== 'string' ||
    !Number.isFinite(data.expires_in)
  )
    throw Error('ログイン情報を確認できません。')
  const s          = {
    uid,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + Number(data.expires_in) * 1000,
  }
  put('session', s)
  return s
}
export async function finishLogin(raw        , owner         ) {
  const u = new URL(raw)
  if (u.origin !== location.origin || u.pathname !== location.pathname)
    throw Error('このアプリに戻ったURLを指定してください。')
  const code = u.searchParams.get('code'),
    flow = get                                                   ('oauth')
  if (
    !code ||
    !flow ||
    flow.project !== config()?.url ||
    Date.now() - flow.at > 12 * 60000
  )
    throw Error('ログインを開始した画面で再試行してください。')
  await navigator.locks.request(prefix + 'auth', async () => {
    const data = await api('/auth/v1/token?grant_type=pkce', {
      auth_code: code,
      code_verifier: flow.verifier,
    })
    persist(data, owner)
    localStorage.removeItem(prefix + 'oauth')
  })
}
export async function access() {
  return navigator.locks.request(prefix + 'auth', async () => {
    const s = session()
    if (!s) throw Error('Googleログインが必要です。')
    if (s.expires_at > Date.now() + 60000) return s
    try {
      return persist(
        await api('/auth/v1/token?grant_type=refresh_token', {
          refresh_token: s.refresh_token,
        }),
        s.uid
      )
    } catch (e) {
      if (e instanceof ApiError && [400, 401].includes(e.status))
        localStorage.removeItem(authKey)
      throw e
    }
  })
}
export async function logout() {
  await navigator.locks.request(prefix + 'auth', async () => {
    const s = session()
    localStorage.removeItem(authKey)
    localStorage.removeItem(prefix + 'oauth')
    if (s && navigator.onLine)
      try {
        await api('/auth/v1/logout?scope=local', {}, s.access_token)
      } catch {
        /* This device has already discarded the tokens. */
      }
  })
}
