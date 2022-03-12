import path from 'path'
import { mkdir } from 'fs/promises'
import { PmBrowserTypePlaywright } from '../src/browser/playwright'
import { PmBrowserTypePuppeteer } from '../src/browser/puppeteer'
import { PmAuth } from '../src/auth'
import authInfo from './auth.json'

async function run() {
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
    ...authInfo,
  })

  console.log(info.cookies)

  await browser.close()
}

run().catch((e) => {
  throw e
})
