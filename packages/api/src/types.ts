export interface PmBrowserType<A extends any[]> {
  /***
   * Launch browser with shared context
   */
  launch(...args: A): Promise<PmBrowser>
}

/***
 * Browser context
 */
export interface PmBrowser {
  newPage(): Promise<PmPage>
  close(): Promise<void>
}

export interface PmCookie {
  name: string
  value: string
  domain: string
  path: string
  expires: number
  httpOnly: boolean
  secure: boolean
  sameSite?: 'Strict' | 'Lax' | 'None'
}

export interface PmPage {
  goto(url: string): Promise<void>
  waitForSelector(selector: string, visible?: boolean): Promise<PmElement>
  waitForTimeout(timeout: number): Promise<void>
  cookies(urls?: string | string[]): Promise<PmCookie[]>
  localStorage(): Promise<{ [key: string]: any }>
  close(): Promise<void>
}

export interface PmElement {
  innerText(): Promise<string>
  check(): Promise<void>
  click(): Promise<void>
  fill(value: string): Promise<void>
}

export interface PmAuthInfo {
  cookies: PmCookie[]
  localStorage: { [key: string]: any }
}

export interface PmFetchRequest<R = any> {
  method?: 'get' | 'post'
  base?: string
  url: string
  params?: { [key: string]: string }
  headers?: { [key: string]: string }
  data?: any
}

export interface PmFetchResponse {
  status: number
  headers: { [key: string]: string }
  data?: any
}

export type PmFetch = (options: PmFetchRequest) => Promise<PmFetchResponse>

export class PmError extends Error {}
