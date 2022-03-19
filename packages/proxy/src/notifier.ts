import {
  PmAuth,
  PmBrowserTypePuppeteer,
  PmFetcher,
  createPmFetch,
  queryMessages,
} from '@protonmail-proxy/api'
import puppeteer from 'puppeteer'
import notifier from 'node-notifier'
import fetch from 'node-fetch'

export async function notifierLoop({
  username,
  password,
}: {
  username: string
  password: string
}) {
  const browserType = new PmBrowserTypePuppeteer({ puppeteer })

  const onAuth = async () => {
    const browser = await browserType.launch({
      userDataDir: '/tmp/pm-notifier',
      puppeteerOptions: {
        headless: false,
      },
    })
    const auth = new PmAuth({ browser })
    const info = await auth.login({
      username,
      password,
    })
    // TODO: reuse browser instance and close it by timeout
    await browser.close()
    return info
  }

  const fetcher = new PmFetcher({
    initAuthInfo: await onAuth(),
    onAuth,
    onFetch: createPmFetch(fetch),
  })

  const res = await fetcher.fetch(
    queryMessages({
      Page: 0,
      Unread: 1,
      LabelID: 0,
      PageSize: 10,
    })
  )

  console.dir(res.Messages)

  notifier.notify({
    'app-name': 'ProtonMail Notifier',
    title: `You have (${res.Messages.length}) unread mails <${
      username || 'unknown'
    }>`,
    message: res.Messages.map((i) => i.Subject).join('\n\n') || 'No message',
    icon: 'mail-unread-new',
  })
}
