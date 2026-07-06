import { expect, type Page, type TestInfo } from '@playwright/test'

export const adminCredentials = {
  email: 'santiagodrm@gmail.com',
  password: 'papimami2',
} as const

export function uniqueValue(prefix: string) {
  return `${prefix}-${Date.now()}`
}

export async function loginAsAdmin(page: Page) {
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
}

export async function ensureAuthenticated(page: Page) {
  await page.goto('/productos')

  const loginButton = page.getByRole('button', { name: 'Iniciar sesion' })

  if (await loginButton.isVisible().catch(() => false)) {
    await loginAsAdmin(page)
    return
  }

  await expect(page.getByRole('heading', { name: 'Catalogo de Productos' })).toBeVisible({ timeout: 15000 })
}

export async function saveEvidenceScreenshot(page: Page, testInfo: TestInfo, fileName: string) {
  await page.screenshot({
    path: testInfo.outputPath(fileName),
    fullPage: true,
  })
}
