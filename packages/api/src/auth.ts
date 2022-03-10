import { PmBrowser, PmCookie, PmError, PmPage } from './types'

async function waitForMailboxPage(page: PmPage) {
  await page.waitForSelector('button.user-dropdown-button')
}

interface LoginResponse {
  cookies: PmCookie[]
}

export class PmAuth {
  private _browser: PmBrowser
  constructor(options: { browser: PmBrowser }) {
    this._browser = options.browser
  }

  async login(options?: {
    username?: string
    password?: string
  }): Promise<LoginResponse> {
    const page = await this._browser.newPage()
    await page.goto('https://account.protonmail.com/login')

    const formPromise = Promise.all([
      page.waitForSelector('form #username', true),
      page.waitForSelector('form #password', true),
      page.waitForSelector('form button[type=submit]', true),
    ])
    const form = await new Promise((resolve, reject) => {
      let count = 2
      const onRejected = (reason: any) => {
        if (--count == 0) reject(reason)
      }
      formPromise.then((value) => {
        if (value.every((i) => i)) resolve(value)
        onRejected(value)
      }, onRejected)

      waitForMailboxPage(page).then((_) => resolve(null), onRejected)
    })

    if (form) {
      if (!(options?.username && options?.password)) {
        throw new PmError('require both username and password')
      }

      const [usernameEl, passwordEl, submitEl] = form as Awaited<
        typeof formPromise
      >
      const staySignedInEl = await page.waitForSelector('#staySignedIn', true)

      await usernameEl.fill(options.username)
      await passwordEl.fill(options.password)
      await staySignedInEl.check()
      await submitEl.click()

      const errMsgEl = await Promise.race([
        waitForMailboxPage(page).then((_) => null),
        page.waitForSelector('.notification.notification-danger'),
      ])
      if (errMsgEl) {
        throw new PmError('login failed: ' + (await errMsgEl.innerText()))
      }
    } else {
      console.log('already logged in')
    }

    const cookies = await page.cookies([
      'https://mail.protonmail.com/api/',
      'https://account.protonmail.com/api/',
    ])

    await page.close()
    return {
      cookies,
    }
  }
}
