import { test as setup } from '@playwright/test'

import { loginAsAdmin } from './helpers'

setup('authenticate admin and save storage state', async ({ page }) => {
  await loginAsAdmin(page)
  await page.context().storageState({ path: 'playwright/.auth/admin.json' })
})
