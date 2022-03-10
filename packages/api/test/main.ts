import { PmBrowserTypePlaywright } from '../src/browser/playwright'
import { PmBrowserTypePuppeteer } from '../src/browser/puppeteer'
import { PmAuth } from '../src/auth'

async function run() {
  const browser = await new PmBrowserTypePlaywright({
    type: 'chromium',
  }).launch()
  // const browser = await new PmBrowserTypePuppeteer().launch()

  const auth = new PmAuth({ browser })

  const info = await auth.login({
    username: 'xxxx@protonmail.com',
    password: 'xxxxxxxx',
  })

  console.log(info.cookies)

  // await auth.login()

  await browser.close()
}

run().catch((e) => {
  throw e
})
