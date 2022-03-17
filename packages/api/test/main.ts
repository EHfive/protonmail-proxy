import path from 'path'
import { mkdir } from 'fs/promises'
import { URL, URLSearchParams } from 'url'
import { PmBrowserTypePlaywright } from '../src/browser/playwright'
import { PmBrowserTypePuppeteer } from '../src/browser/puppeteer'
import { PmAuth } from '../src/auth'
import { PmFetcher } from '../src/fetch'
import loginInfo from './auth.json'

const _importDynamic = new Function('modulePath', 'return import(modulePath)')

async function run() {
  const fetch = (await _importDynamic('node-fetch')).default
  const outputDir = path.join(__dirname, 'output')
  try {
    await mkdir(outputDir)
  } catch (e: any) {
    if (e.code != 'EEXIST') throw e
  }

  // const browser = await new PmBrowserTypePlaywright({
  //   type: 'chromium',
  // }).launch({ storageState: path.join(outputDir, 'playwright-state.json') })
  // const browser = await new PmBrowserTypePlaywright({
  //   type: 'chromium',
  // }).launch({ userDataDir: path.join(outputDir, 'playwright-chromium') })
  const browser = await new PmBrowserTypePuppeteer().launch({
    puppeteerOptions: {
      userDataDir: path.join(outputDir, 'puppeteer-chromium'),
    },
  })

  const auth = new PmAuth({ browser })

  const info = await auth.login({
    ...loginInfo,
  })

  const fetcher = new PmFetcher({
    initAuthInfo: info,
    async onAuth() {
      return await auth.login({ ...loginInfo })
    },
    async onFetch(options) {
      const url = new URL(options.url, options.base)
      url.search = new URLSearchParams({
        ...options.params,
      }).toString()
      console.log(url)
      const res = await fetch(url.toString(), {
        headers: options.headers,
        body: options.data ? JSON.stringify(options.data) : null,
      })
      return {
        headers: { ...res.headers },
        status: res.status,
        data: await res.json(),
      }
    },
  })

  const res = await fetcher.fetch({
    url: 'api/mail/v4/conversations',
  })

  console.log(res)

  await browser.close()
}

run().catch((e) => {
  throw e
})
