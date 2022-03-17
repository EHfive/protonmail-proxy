import { access } from 'fs/promises'
import {
  Browser,
  BrowserType,
  BrowserContext,
  Page,
  ElementHandle,
} from 'playwright'
import { PmBrowser, PmBrowserType, PmCookie, PmElement, PmPage } from '../types'

type Playwright = typeof import('playwright')

type PmBrowserTypeStr = 'chromium' | 'firefox' | 'webkit'

interface LaunchOptions {
  userDataDir?: string
  storageState?: string
  playwrightOptions?: Parameters<BrowserType['launch']>[0]
}

export class PmBrowserTypePlaywright implements PmBrowserType<[LaunchOptions]> {
  private _playwright?: Playwright
  private _browserType: PmBrowserTypeStr

  constructor(options?: { type?: PmBrowserTypeStr; playwright?: Playwright }) {
    this._browserType = options?.type || 'chromium'
    this._playwright = options?.playwright
  }

  private async getPlaywright() {
    if (!this._playwright) {
      this._playwright = await import('playwright')
    }
    return this._playwright
  }

  async launch(options?: LaunchOptions) {
    const playwright = await this.getPlaywright()
    const browserType = playwright[this._browserType]

    const playwrightOptions = {
      ...options?.playwrightOptions,
    }

    if (options?.userDataDir) {
      const context = await browserType.launchPersistentContext(
        options?.userDataDir,
        playwrightOptions
      )
      return new PmBrowserPlaywrightImpl(context)
    }

    const browser = await browserType.launch(playwrightOptions)

    const saveStatePath = options?.storageState
    let loadStatePath = saveStatePath
    if (loadStatePath)
      try {
        await access(loadStatePath)
      } catch {
        loadStatePath = undefined
      }
    const context = await browser.newContext({ storageState: loadStatePath })

    return new PmBrowserPlaywrightImpl(context, {
      onBeforeClose() {
        if (!saveStatePath) return
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

  async localStorage(): Promise<{ [key: string]: any }> {
    return await this._page.evaluate('Object.assign({}, window.localStorage)')
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
