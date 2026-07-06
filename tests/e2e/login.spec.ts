import { expect, test } from '@playwright/test'

import { adminCredentials, saveEvidenceScreenshot } from './helpers'

test.use({ storageState: { cookies: [], origins: [] } })

test('admin login navigates to protected area', async ({ page }, testInfo) => {
  await page.goto('/login')

  await page.getByPlaceholder('Correo electronico').fill(adminCredentials.email)
  await page.getByPlaceholder('Contrasena').fill(adminCredentials.password)
  await page.getByRole('button', { name: 'Iniciar sesion' }).click()
  await expect
    .poll(async () => page.evaluate(() => window.localStorage.getItem('inventory-access-token')), {
      timeout: 15000,
    })
    .not.toBeNull()
  await page.goto('/productos')
  await expect(page.getByRole('heading', { name: 'Catalogo de Productos' })).toBeVisible({ timeout: 15000 })

  await saveEvidenceScreenshot(page, testInfo, 'login-admin.png')
})
