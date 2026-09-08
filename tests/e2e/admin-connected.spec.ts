import { expect, test, type Page } from '@playwright/test'

import { ensureAuthenticated, getTestUserPassword, saveEvidenceScreenshot, uniqueValue } from './helpers'

test.describe.configure({ mode: 'serial' })

test.beforeEach(async ({ page }) => {
  await ensureAuthenticated(page)
})

test('categorias: create, edit and delete', async ({ page }, testInfo) => {
  const categoryName = uniqueValue('categoria-e2e')
  const updatedCategoryName = `${categoryName}-editada`

  await page.getByRole('button', { name: 'Categorias' }).click()

  const categoryDialog = page.getByRole('dialog', { name: 'Gestion de categorias' })
  await expect(categoryDialog.getByRole('heading', { name: 'Gestion de categorias' })).toBeVisible()
  await categoryDialog.getByPlaceholder('Ej. Analgesicos').fill(categoryName)
  await categoryDialog.getByPlaceholder('Contexto breve para el equipo de inventario').fill('Categoria creada desde Playwright')
  await categoryDialog.getByRole('button', { name: 'Crear categoria' }).click()

  await expect(categoryDialog.getByRole('button', { name: 'Guardar cambios' })).toBeVisible()
  await expect(categoryDialog.getByPlaceholder('Ej. Analgesicos')).toHaveValue(categoryName)

  await categoryDialog.getByPlaceholder('Ej. Analgesicos').fill(updatedCategoryName)
  await categoryDialog.getByRole('button', { name: 'Guardar cambios' }).click()

  await expect(categoryDialog.getByRole('button', { name: updatedCategoryName })).toBeVisible()

  await saveEvidenceScreenshot(page, testInfo, 'categorias-modal.png')

  await categoryDialog.getByRole('button', { name: 'Eliminar categoria' }).click()
  await expect(categoryDialog.getByRole('button', { name: updatedCategoryName })).not.toBeVisible()
  await categoryDialog.getByRole('button', { name: 'Cerrar', exact: true }).click()
})

test('proveedores: create, edit and deactivate', async ({ page }, testInfo) => {
  const supplierName = uniqueValue('proveedor-e2e')
  const editedSupplierName = `${supplierName} Editado`
  const rif = `J-${Date.now().toString().slice(-8)}-1`

  await page.goto('/proveedores')
  await page.getByRole('button', { name: 'Nuevo proveedor' }).click()

  const createSupplierDialog = page.getByRole('dialog', { name: 'Nuevo proveedor' })
  await expect(createSupplierDialog.getByRole('heading', { name: 'Nuevo proveedor' })).toBeVisible()
  await createSupplierDialog.getByPlaceholder('Ej. Laboratorios Farma C.A.').fill(supplierName)
  await createSupplierDialog.getByPlaceholder('J-12345678-9').fill(rif)
  await createSupplierDialog.getByPlaceholder('412-000-0000').fill('4120000000')
  await createSupplierDialog.getByPlaceholder('Direccion completa').fill('Av. Principal de prueba')
  await createSupplierDialog.getByRole('button', { name: 'Crear proveedor' }).click()

  await page.reload()
  await page.getByPlaceholder('Buscar proveedor, RIF o direccion...').fill(supplierName)
  await expect(page.locator('tr', { hasText: supplierName }).first()).toBeVisible({ timeout: 15000 })

  const supplierRow = page.locator('tr', { hasText: supplierName }).first()
  await supplierRow.hover()
  await supplierRow.getByRole('button').first().click()

  const supplierDetailDialog = page.getByRole('dialog', { name: 'Modal de proveedor' })
  await expect(supplierDetailDialog.getByRole('heading', { name: supplierName })).toBeVisible()
  await supplierDetailDialog.getByRole('button', { name: 'Editar' }).click()

  const editSupplierDialog = page.getByRole('dialog', { name: 'Editar proveedor' })
  await expect(editSupplierDialog.getByRole('heading', { name: 'Editar proveedor' })).toBeVisible()
  await editSupplierDialog.getByPlaceholder('Ej. Laboratorios Farma C.A.').fill(editedSupplierName)
  await editSupplierDialog.getByRole('button', { name: 'Guardar cambios' }).click()

  await page.getByPlaceholder('Buscar proveedor, RIF o direccion...').fill(editedSupplierName)
  await expect(page.locator('tr', { hasText: editedSupplierName }).first()).toBeVisible({ timeout: 15000 })

  const editedRow = page.locator('tr', { hasText: editedSupplierName }).first()
  await editedRow.hover()
  await editedRow.getByRole('button').first().click()
  const editedSupplierDetailDialog = page.getByRole('dialog', { name: 'Modal de proveedor' })
  await expect(editedSupplierDetailDialog.getByRole('heading', { name: editedSupplierName })).toBeVisible()

  await saveEvidenceScreenshot(page, testInfo, 'proveedores-detalle.png')

  await editedSupplierDetailDialog.getByRole('button', { name: 'Desactivar proveedor' }).click()
  await page.getByRole('button', { name: 'Inactivos' }).click()
  await expect(page.getByText(editedSupplierName, { exact: true })).toBeVisible()
})

test('usuarios: create, edit and deactivate', async ({ page }, testInfo) => {
  const uniqueEmail = `${uniqueValue('usuario').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase()}@highmeds.local`
  const initialName = 'Usuario E2E Operativo'
  const editedName = 'Usuario E2E Operativo Editado'
  const testUserPassword = getTestUserPassword()

  await page.goto('/usuarios')
  await page.getByRole('button', { name: 'Nuevo usuario' }).click()

  const createUserDialog = page.getByRole('dialog', { name: 'Nuevo usuario' })
  await expect(createUserDialog.getByRole('heading', { name: 'Nuevo usuario' })).toBeVisible()
  await createUserDialog.getByPlaceholder('Ej. Ana Garcia').fill(initialName)
  await createUserDialog.getByPlaceholder('ana.garcia@highmeds.com').fill(uniqueEmail)
  await createUserDialog.locator('input[type="password"]').nth(0).fill(testUserPassword)
  await createUserDialog.locator('input[type="password"]').nth(1).fill(testUserPassword)
  await createUserDialog.getByRole('button', { name: 'Crear usuario' }).click()

  await page.getByPlaceholder('Buscar por nombre o correo').fill(uniqueEmail, { timeout: 15000 })
  await expect(page.locator('tr', { hasText: uniqueEmail }).first()).toBeVisible({ timeout: 15000 })

  const userRow = page.locator('tr', { hasText: uniqueEmail }).first()
  await userRow.getByRole('button').first().click()

  const editUserDialog = page.getByRole('dialog', { name: 'Modal de usuario' })
  await expect(editUserDialog.getByRole('heading', { name: 'Editar usuario' })).toBeVisible()
  await editUserDialog.locator('input[type="text"]').first().fill(editedName)
  await editUserDialog.getByRole('button', { name: 'Guardar cambios' }).click()

  await page.getByPlaceholder('Buscar por nombre o correo').fill(uniqueEmail)
  await expect(page.locator('tr', { hasText: editedName }).first()).toBeVisible({ timeout: 15000 })

  const editedUserRow = page.locator('tr', { hasText: uniqueEmail }).first()
  await editedUserRow.getByRole('button').first().click()
  const editedModal = page.getByRole('dialog', { name: 'Modal de usuario' })

  await saveEvidenceScreenshot(page, testInfo, 'usuarios-modal.png')

  await editedModal.getByRole('button', { name: 'Desactivar usuario' }).click()
  await expect(page.locator('tr', { hasText: uniqueEmail }).first().getByText('Inactivo')).toBeVisible()
})

test('productos: create, detail, edit, supplier link and deactivate', async ({ page }, testInfo) => {
  const productCategoryName = uniqueValue('categoria-producto')
  const supplierOneName = uniqueValue('proveedor-producto')
  const supplierTwoName = `${supplierOneName}-extra`
  const productCode = uniqueValue('sku').toUpperCase()
  const productName = uniqueValue('producto-e2e')
  const editedProductName = `${productName} Editado`

  await page.getByRole('button', { name: 'Categorias' }).click()
  const productCategoryDialog = page.getByRole('dialog', { name: 'Gestion de categorias' })
  await expect(productCategoryDialog.getByRole('heading', { name: 'Gestion de categorias' })).toBeVisible()
  await productCategoryDialog.getByPlaceholder('Ej. Analgesicos').fill(productCategoryName)
  await productCategoryDialog.getByRole('button', { name: 'Crear categoria' }).click()
  await productCategoryDialog.getByRole('button', { name: 'Cerrar', exact: true }).click()

  await page.goto('/proveedores')
  await createSupplierViaUi(page, supplierOneName, `J-${Date.now().toString().slice(-8)}-2`, false)
  await createSupplierViaUi(page, supplierTwoName, `J-${(Date.now() + 1).toString().slice(-8)}-3`, false)

  await page.goto('/productos')
  await page.getByRole('button', { name: 'Nuevo producto' }).click()
  const createProductDialog = page.getByRole('dialog', { name: 'Nuevo Producto' })
  await expect(createProductDialog.getByRole('heading', { name: 'Nuevo Producto' })).toBeVisible()

  await createProductDialog.getByPlaceholder('Ej. Amoxicilina 500mg').fill(productName)
  await createProductDialog.getByPlaceholder('SKU-').fill(productCode)
  await createProductDialog.getByPlaceholder('Ej. Ibuprofeno').fill('Paracetamol')
  await createProductDialog.locator('select').nth(0).selectOption({ label: productCategoryName })
  await createProductDialog.locator('input[type="number"]').nth(0).fill('12.50')
  await createProductDialog.locator('select').nth(1).selectOption({ label: supplierOneName })
  await createProductDialog.getByText('Marca').locator('..').locator('input').fill('Marca E2E')
  await createProductDialog.getByText('Presentacion').locator('..').locator('input').fill('Caja x 12')
  await createProductDialog.locator('input[type="number"]').nth(1).fill('25')
  await createProductDialog.locator('input[type="number"]').nth(2).fill('5')
  await createProductDialog.locator('select').nth(2).selectOption('UNIT')
  await createProductDialog.getByPlaceholder('Ej. 500').fill('12')
  await createProductDialog.getByPlaceholder('Detalles adicionales del producto').fill('Producto creado desde evidencia E2E')
  await createProductDialog.getByRole('button', { name: 'Guardar producto' }).click()

  await expect(createProductDialog).toBeHidden({ timeout: 15000 })

  await page.getByPlaceholder('Buscar por codigo, nombre o principio activo...').fill(productCode)
  await expect(page.locator('tr', { hasText: productCode }).first()).toBeVisible({ timeout: 15000 })

  const productRow = page.locator('tr', { hasText: productCode }).first()
  await productRow.click()
  const detailModal = page.getByRole('dialog', { name: 'Detalle del producto' })
  await expect(detailModal.locator('span').filter({ hasText: productCategoryName }).first()).toBeVisible()
  await detailModal.getByRole('button', { name: 'Editar' }).click()

  const editModal = page.getByRole('dialog', { name: 'Editar Producto' })
  await editModal.locator('input[type="text"]').nth(0).fill(editedProductName)
  await expect(editModal.getByText('Stock actual').locator('..').locator('input')).toHaveCount(0)
  await editModal.locator('input[type="number"]').nth(0).fill('8')
  await editModal.locator('select').nth(2).selectOption({ label: supplierTwoName })
  await editModal.getByRole('button', { name: 'Asociar' }).click()
  await expect(editModal.getByText(supplierTwoName, { exact: true })).toBeVisible()
  await editModal.locator('button', { hasText: 'Quitar' }).nth(0).click()
  await editModal.getByRole('button', { name: 'Guardar cambios' }).click()

  await page.getByPlaceholder('Buscar por codigo, nombre o principio activo...').fill(productCode, { timeout: 15000 })
  await expect(page.locator('tr', { hasText: editedProductName }).first()).not.toBeVisible({ timeout: 15000 })

  const editedProductRow = page.locator('tr', { hasText: productCode }).first()
  await editedProductRow.hover()
  await editedProductRow.getByRole('button').click()
  await page.getByRole('button', { name: 'Desactivar' }).click()

  const deactivateModal = page.getByRole('dialog', { name: 'Desactivar producto' })
  await saveEvidenceScreenshot(page, testInfo, 'productos-modal.png')
  await deactivateModal.getByRole('button', { name: 'Desactivar' }).click()
  await expect(page.getByText(editedProductName, { exact: true })).not.toBeVisible()
})

async function createSupplierViaUi(page: Page, name: string, rif: string, assertVisible = true) {
  await page.getByRole('button', { name: 'Nuevo proveedor' }).click()
  const modal = page.getByRole('dialog', { name: 'Nuevo proveedor' })
  await modal.getByPlaceholder('Ej. Laboratorios Farma C.A.').fill(name)
  await modal.getByPlaceholder('J-12345678-9').fill(rif)
  await modal.getByPlaceholder('412-000-0000').fill('4121234567')
  await modal.getByPlaceholder('Direccion completa').fill(`Direccion ${name}`)
  await modal.getByRole('button', { name: 'Crear proveedor' }).click()
  await expect(modal).toBeHidden({ timeout: 15000 })

  if (!assertVisible) {
    await page.reload()
    return
  }

  await page.reload()
  await page.getByPlaceholder('Buscar proveedor, RIF o direccion...').fill(name)
  await expect(page.locator('tr', { hasText: name }).first()).toBeVisible({ timeout: 15000 })
}
