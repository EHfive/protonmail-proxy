import { type } from 'os'
import { Browser, BrowserContext, Page, ElementHandle } from 'puppeteer'
import {
  PmBrowser,
  PmBrowserType,
  PmElement,
  PmPage,
  PmError,
  PmCookie,
} from '../types'

type PuppeteerNode = typeof import('puppeteer')

interface LaunchOptions {
  userDataDir?: string
  puppeteerOptions?: Parameters<PuppeteerNode['launch']>[0]
}

export class PmBrowserTypePuppeteer implements PmBrowserType<[LaunchOptions]> {
  private _puppeteer?: PuppeteerNode
  constructor(options?: { puppeteer?: PuppeteerNode }) {
    this._puppeteer = options?.puppeteer
  }

  private async getPuppeteer() {
    if (!this._puppeteer) {
      this._puppeteer = (await import('puppeteer')).default
    }
    return this._puppeteer
  }

  async launch(options?: LaunchOptions) {
    const puppeteer = await this.getPuppeteer()
    const userDataDir =
      options?.userDataDir || options?.puppeteerOptions?.userDataDir
    return new PmBrowserPuppeteerImpl(
      await puppeteer.launch({
        ...options?.puppeteerOptions,
        userDataDir,
      })
    )
  }
}

class PmBrowserPuppeteerImpl implements PmBrowser {
  private _browser: Browser | BrowserContext
  constructor(browser: Browser | BrowserContext) {
    this._browser = browser
  }

  async newPage(): Promise<PmPage> {
    const page = await this._browser.newPage()
    return new PmPagePuppeteerImpl(page)
  }

  async close() {
    await this._browser.close()
  }
}

class PmPagePuppeteerImpl implements PmPage {
  private _page: Page
  constructor(page: Page) {
    this._page = page
  }

  async goto(url: string): Promise<void> {
    await this._page.goto(url, { waitUntil: 'load' })
  }

  async waitForSelector(
    selector: string,
    visible?: boolean
  ): Promise<PmElement> {
    const el = await this._page.waitForSelector(selector, {
      visible: !!visible,
    })
    if (!el) {
      throw new PmError(`no matching element for selector "${selector}"`)
    }
    return new PmElementPuppeteerImpl(el)
  }

  async waitForTimeout(timeout: number): Promise<void> {
    await this._page.waitForTimeout(timeout)
  }

  async cookies(urls?: string | string[]): Promise<PmCookie[]> {
    if (!Array.isArray(urls)) {
      urls = urls ? [urls] : []
    }
    return await this._page.cookies(...urls)
  }

  async localStorage() {
    return await this._page.evaluate('Object.assign({}, window.localStorage)')
  }

  async close(): Promise<void> {
    await this._page.close()
  }
}

class PmElementPuppeteerImpl implements PmElement {
  private _el: ElementHandle
  constructor(element: ElementHandle) {
    this._el = element
  }

  async innerText(): Promise<string> {
    return await this._el.evaluate((e) => (e as any).innerText)
  }

  async check(): Promise<void> {
    const checked = await this._el.evaluate((e) => (e as any).checked)
    if (checked === false) await this._el.click()
  }

  async click(): Promise<void> {
    await this._el.click()
  }

  async fill(value: string): Promise<void> {
    await this._el.type(value)
  }
}
