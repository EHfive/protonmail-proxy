import {
  PmAuthInfo,
  PmError,
  PmFetch,
  PmFetchRequest,
  PmFetchResponse,
} from './types'
import { pRetry, guessCurrentPersistedSession } from './utils'

export interface PmFetcherOptions {
  onFetch: PmFetch
  onAuth(oldAuthInfo: PmAuthInfo): Promise<PmAuthInfo>
  initAuthInfo: PmAuthInfo
}

export class PmFetcher {
  private _authInfo!: PmAuthInfo
  private _uid!: string
  private _opt: PmFetcherOptions
  constructor(options: PmFetcherOptions) {
    this._opt = options
    this.setAuthInfo(options.initAuthInfo)
  }

  private setAuthInfo(authInfo: PmAuthInfo) {
    this._authInfo = {
      cookies: [...authInfo.cookies],
      localStorage: {
        ...authInfo.localStorage,
      },
    }
    this._uid = guessCurrentPersistedSession(this._authInfo)?.UID
    if (!this._uid) throw new PmError('Cannot found UID from auth info')
  }

  private async _fetch(options: PmFetchRequest) {
    const cookie = this._authInfo.cookies
      .filter((i) => {
        // TODO: also filter by path
        return i.domain === 'mail.protonmail.com'
      })
      .map((i) => `${i.name}=${i.value}`)
      .join('; ')
    options = {
      ...options,
      base: options.base || 'https://mail.protonmail.com',
      headers: {
        ...options.headers,
        'x-pm-appversion': 'web-mail@4.17.5',
        'x-pm-uid': this._uid,
        Cookie: cookie,
      },
    }
    return await pRetry(() => this._opt.onFetch(options))
  }

  async fetch<R>(options: PmFetchRequest<R>): Promise<R> {
    let res = await this._fetch(options)
    if (res.status == 401) {
      const newAuthInfo = await pRetry(() => this._opt.onAuth(this._authInfo))
      this.setAuthInfo(newAuthInfo)
      res = await this._fetch(options)
    }

    if (res.status == 200) {
      return res.data as R
    }

    throw new PmFetchError({
      message: `fetch failed ${res.status}`,
      request: options,
      response: res,
    })
  }
}

export class PmFetchError extends PmError {
  request?: PmFetchRequest
  response?: PmFetchResponse
  constructor(options: {
    message?: string
    request?: PmFetchRequest
    response?: PmFetchResponse
  }) {
    super(options.message)
    this.request = options.request
    this.response = options.response
  }
}
