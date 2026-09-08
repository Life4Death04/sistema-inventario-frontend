import { expect, type Page, type TestInfo } from '@playwright/test'

function requireE2ECredential(name: 'E2E_ADMIN_EMAIL' | 'E2E_ADMIN_PASSWORD' | 'E2E_NEW_USER_PASSWORD') {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required E2E credential: ${name}. Set it in the environment or in .env.e2e.`)
  }

  return value
}

export const adminCredentials = {
  email: requireE2ECredential('E2E_ADMIN_EMAIL'),
  password: requireE2ECredential('E2E_ADMIN_PASSWORD'),
} as const

export function getTestUserPassword() {
  return requireE2ECredential('E2E_NEW_USER_PASSWORD')
}

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
