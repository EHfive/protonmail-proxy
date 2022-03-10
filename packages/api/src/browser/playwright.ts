import EventEmitter from 'events'
import { Browser, BrowserContext, Page, ElementHandle } from 'playwright'
import { PmBrowser, PmBrowserType, PmCookie, PmElement, PmPage } from '../types'
import { access } from 'fs/promises'

type Playwright = typeof import('playwright')

type PmBrowserTypeStr = 'chromium' | 'firefox' | 'webkit'

const saveStatePath = '/tmp/pm/state.json'

export class PmBrowserTypePlaywright implements PmBrowserType {
  private _playwright?: Playwright
  private _browserType: PmBrowserTypeStr

  constructor(options?: { type?: PmBrowserTypeStr; playwright?: Playwright }) {
    this._browserType = options?.type || 'chromium'
    this._playwright = options?.playwright
  }

  async launch(): Promise<PmBrowser> {
    const playwright = this._playwright || (await import('playwright'))
    const browser = await playwright[this._browserType].launch({
      headless: false,
    })
    let loadStatePath
    try {
      await access(saveStatePath)
      loadStatePath = saveStatePath
    } catch {
      loadStatePath = undefined
    }
    const context = await browser.newContext({ storageState: loadStatePath })
    return new PmBrowserPlaywrightImpl(context, {
      onBeforeClose() {
        return context.storageState({ path: saveStatePath })
      },
      onAfterClose() {
        return browser.close()
      },
    })
  }
}

interface BrowserHooks {
  onBeforeClose: () => void | PromiseLike<any>
  onAfterClose: () => void | PromiseLike<any>
}

class PmBrowserPlaywrightImpl implements PmBrowser {
  private _browser: Browser | BrowserContext
  private _hooks: Partial<BrowserHooks>
  constructor(
    browser: Browser | BrowserContext,
    options?: Partial<BrowserHooks>
  ) {
    this._browser = browser
    this._hooks = options || {}
  }

  async newPage(): Promise<PmPage> {
    const page = await this._browser.newPage()
    return new PmPagePlayWrightImpl(page)
  }

  async close() {
    if (this._hooks.onBeforeClose) {
      await this._hooks.onBeforeClose()
    }
    await this._browser.close()

    if (this._hooks.onAfterClose) {
      await this._hooks.onAfterClose()
    }
  }
}

class PmPagePlayWrightImpl implements PmPage {
  private _page: Page
  constructor(page: Page) {
    this._page = page
  }

  async goto(url: string): Promise<void> {
    await this._page.goto(url)
  }

  async waitForSelector(
    selector: string,
    visible?: boolean
  ): Promise<PmElement> {
    const el = await this._page.waitForSelector(selector, {
      state: visible ? 'visible' : undefined,
    })
    return new PmElementPlaywrightImpl(el)
  }

  async waitForTimeout(timeout: number): Promise<void> {
    await this._page.waitForTimeout(timeout)
  }

  async cookies(urls?: string | string[]): Promise<PmCookie[]> {
    return await this._page.context().cookies(urls || this._page.url())
  }

  async close(): Promise<void> {
    await this._page.close()
  }
}

class PmElementPlaywrightImpl implements PmElement {
  private _el: ElementHandle
  constructor(element: ElementHandle) {
    this._el = element
  }

  async innerText(): Promise<string> {
    return await this._el.innerText()
  }

  async check(): Promise<void> {
    await this._el.check()
  }

  async click(): Promise<void> {
    await this._el.click()
  }

  async fill(value: string): Promise<void> {
    await this._el.fill(value)
  }
}
