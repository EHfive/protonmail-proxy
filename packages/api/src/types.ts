export interface PmBrowserType {
  launch(): Promise<PmBrowser>
}

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
  close(): Promise<void>
}

export interface PmElement {
  innerText(): Promise<string>
  check(): Promise<void>
  click(): Promise<void>
  fill(value: string): Promise<void>
}

export class PmError extends Error {}
