import { PmAuthInfo, PmBrowser, PmError, PmPage } from './types'
import { pAny } from './utils'

async function waitForMailboxPage(page: PmPage, timeout?: number) {
  await page.waitForSelector('button.user-dropdown-button', { timeout })
}

async function getAuthInfo(page: PmPage) {
  const cookies = await page.cookies([
    'https://mail.protonmail.com/api/',
    // 'https://account.protonmail.com/api/',
  ])
  const localStorage = await page.localStorage()
  return {
    cookies,
    localStorage,
  }
}

export class PmAuth {
  private _browser: PmBrowser
  constructor(options: { browser: PmBrowser }) {
    this._browser = options.browser
  }

  async login(options?: {
    username?: string
    password?: string
    manually?: boolean
  }): Promise<PmAuthInfo> {
    const page = await this._browser.newPage()
    await page.goto('https://account.protonmail.com/login')

    const waitForSelector = (selector: string) =>
      page.waitForSelector(selector, { visible: true })

    const formPromise = Promise.all([
      waitForSelector('form #username'),
      waitForSelector('form #password'),
      waitForSelector('form button[type=submit]'),
    ]).then((value) => {
      if (value.some((i) => !i)) throw new PmError()
      return value
    })

    const form = await pAny([formPromise, waitForMailboxPage(page)])

    if (form) {
      const staySignedInEl = await waitForSelector('#staySignedIn')
      await staySignedInEl.check()

      if (options?.manually) {
        // wait for 20 minutes
        await waitForMailboxPage(page, 1000 * 60 * 20)
      } else {
        if (!(options?.username && options?.password)) {
          throw new PmError('require both username and password')
        }

        const [usernameEl, passwordEl, submitEl] = form as Awaited<
          typeof formPromise
        >

        await usernameEl.fill(options.username)
        await passwordEl.fill(options.password)
        await submitEl.click()

        const errMsgEl = await Promise.race([
          waitForMailboxPage(page),
          waitForSelector('.notification.notification-danger'),
        ])
        if (errMsgEl) {
          throw new PmError('login failed: ' + (await errMsgEl.innerText()))
        }
      }
    } else {
      console.log('already logged in')
    }

    const authInfo = await getAuthInfo(page)

    await page.close()
    return authInfo
  }
}
