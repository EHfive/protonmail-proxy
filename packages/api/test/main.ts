import path from 'path'
import { mkdir } from 'fs/promises'
import { PmBrowserTypePlaywright } from '../src/browser/playwright'
import { PmBrowserTypePuppeteer } from '../src/browser/puppeteer'
import { PmAuth } from '../src/auth'
import { PmFetcher, createPmFetch } from '../src/fetch'
import loginInfo from './auth.json'
import { queryMessages } from '../src/api/messages'

const _importDynamic = new Function('modulePath', 'return import(modulePath)')

async function run() {
  const { default: fetch, FormData } = (await _importDynamic(
    'node-fetch'
  )) as typeof import('node-fetch')

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
      headless: false,
      userDataDir: path.join(outputDir, 'puppeteer-chromium'),
    },
  })

  const auth = new PmAuth({ browser })

  const info = await auth.login({
    ...loginInfo,
  })

  const fetcher = new PmFetcher({
    initAuthInfo: info,
    async onAuth(_) {
      return await auth.login({ ...loginInfo })
    },
    onFetch: createPmFetch(fetch),
  })

  const res = await fetcher.fetch(
    queryMessages({
      Desc: 1,
      Page: 0,
      PageSize: 1,
    })
  )

  console.log(res)

  await browser.close()
}

run().catch((e) => {
  throw e
})
