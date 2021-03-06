import { PmAuthInfo } from './types'

export async function pRetry<T>(run: () => Promise<T>, times = 3): Promise<T> {
  const errors = []
  do {
    try {
      return await run()
    } catch (e) {
      errors.push(e)
    }
  } while (--times >= 0)

  const lastErr = errors[errors.length - 1] as any
  if (lastErr instanceof Object) {
    lastErr.retryErrors = errors
  }
  throw lastErr
}

export function pAny<T extends readonly unknown[] | []>(
  promises: T
): Promise<Awaited<T[number]>> {
  return new Promise((resolve, reject) => {
    let completed = false
    let count = promises.length
    const onFulfilled = (value: any) => {
      if (completed) return
      resolve(value)
      completed = true
    }
    const onRejected = (reason: any) => {
      if (completed || --count > 0) return
      reject(reason)
      completed = true
    }
    promises.forEach((p) => {
      if (p instanceof Promise) {
        p.then(onFulfilled, onRejected)
      } else {
        onFulfilled(p)
      }
    })
  })
}

export function guessCurrentPersistedSession(
  authInfo: PmAuthInfo
): Record<string, any> | undefined {
  const psPattern = /^ps-([0-9]+)$/

  let maxLocalId = -1
  for (let name in authInfo.localStorage) {
    const r = name.match(psPattern)
    if (!r) continue
    const localId = +r[1]
    if (localId > maxLocalId) maxLocalId = localId
  }

  if (maxLocalId < 0) return undefined
  try {
    return JSON.parse(authInfo.localStorage[`ps-${maxLocalId}`])
  } catch (_) {
    return undefined
  }
}

export function combineURLs(relativeURL: string, baseURL?: string) {
  return baseURL
    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : relativeURL
}
