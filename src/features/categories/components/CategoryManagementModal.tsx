import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import type { TFunction } from 'i18next'
import { FolderTree, LoaderCircle, Pencil, Plus, RefreshCcw, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Trans, useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  createCategory,
  deleteCategory,
  updateCategory,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from '@/features/categories/api/categories.api'
import { useCategories } from '@/features/categories/api/useCategories'
import { queryKeys } from '@/lib/queryKeys'
import type { Category, ApiErrorEnvelope } from '@/types/api.types'

interface CategoryManagementModalProps {
  open: boolean
  onClose: () => void
}

type FormMode = 'create' | 'edit'

type CategoriesTFunction = TFunction<['categories', 'common']>

const CATEGORY_LIST_PARAMS = { limit: 100 }

export function CategoryManagementModal({ open, onClose }: CategoryManagementModalProps) {
  const { t } = useTranslation(['categories', 'common'])
  const queryClient = useQueryClient()
  const { data, error, isLoading, isFetching, refetch } = useCategories(CATEGORY_LIST_PARAMS)
  const [mode, setMode] = useState<FormMode>('create')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const categories = data?.data ?? []
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) ?? null

  useEffect(() => {
    if (!open) {
      return
    }

    if (mode === 'edit' && selectedCategory) {
      setName(selectedCategory.name)
      setDescription(selectedCategory.description ?? '')
      return
    }

    if (mode === 'create') {
      setName('')
      setDescription('')
    }
  }, [mode, open, selectedCategory])

  const invalidateCategoryViews = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
    ])
  }

  const createMutation = useMutation({
    mutationFn: (input: CreateCategoryInput) => createCategory(input),
    onSuccess: async (createdCategory) => {
      await invalidateCategoryViews()
      setMode('edit')
      setSelectedCategoryId(createdCategory.id)
      setName(createdCategory.name)
      setDescription(createdCategory.description ?? '')
      toast.success(t('categories:toasts.created'))
    },
    onError: (mutationError: unknown) => {
      toast.error(getCategoryErrorMessage(mutationError, 'create', t))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ categoryId, input }: { categoryId: string; input: UpdateCategoryInput }) =>
      updateCategory(categoryId, input),
    onSuccess: async (updatedCategory) => {
      await invalidateCategoryViews()
      setSelectedCategoryId(updatedCategory.id)
      setName(updatedCategory.name)
      setDescription(updatedCategory.description ?? '')
      toast.success(t('categories:toasts.updated'))
    },
    onError: (mutationError: unknown) => {
      toast.error(getCategoryErrorMessage(mutationError, 'update', t))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (categoryId: string) => deleteCategory(categoryId),
    onSuccess: async () => {
      await invalidateCategoryViews()
      setMode('create')
      setSelectedCategoryId(null)
      setName('')
      setDescription('')
      toast.success(t('categories:toasts.deleted'))
    },
    onError: (mutationError: unknown) => {
      toast.error(getCategoryErrorMessage(mutationError, 'delete', t))
    },
  })

  if (!open) {
    return null
  }

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  const handleCreateMode = () => {
    setMode('create')
    setSelectedCategoryId(null)
    setName('')
    setDescription('')
  }

  const handleEditMode = (category: Category) => {
    setMode('edit')
    setSelectedCategoryId(category.id)
    setName(category.name)
    setDescription(category.description ?? '')
  }

  const handleSubmit = () => {
    const trimmedName = name.trim()
    const trimmedDescription = description.trim()

    if (!trimmedName) {
      toast.error(t('categories:validation.nameRequired'))
      return
    }

    if (mode === 'create') {
      createMutation.mutate({
        name: trimmedName,
        description: trimmedDescription || undefined,
      })
      return
    }

    if (!selectedCategoryId) {
      toast.error(t('categories:validation.selectToEdit'))
      return
    }

    updateMutation.mutate({
      categoryId: selectedCategoryId,
      input: {
        name: trimmedName,
        description: trimmedDescription || null,
      },
    })
  }

  const handleDelete = () => {
    if (!selectedCategoryId) {
      toast.error(t('categories:validation.selectToDelete'))
      return
    }

    deleteMutation.mutate(selectedCategoryId)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-5">
      <button className="absolute inset-0 bg-[#0e1d27]/40 backdrop-blur-[2px]" onClick={onClose} type="button" />
      <div aria-label={t('categories:modal.title')} aria-modal="true" className="relative flex max-h-[90vh] w-full max-w-[920px] flex-col overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_8px_30px_rgba(0,0,0,0.12)]" role="dialog">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4 sm:px-6">
          <div>
            <h3 className="text-[20px] font-semibold leading-7 text-[var(--color-text)]">{t('categories:modal.title')}</h3>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{t('categories:modal.subtitle')}</p>
          </div>
          <button
            className="rounded-[var(--radius-control)] p-1 text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-strong)] hover:text-[var(--color-text)]"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid flex-1 gap-5 overflow-y-auto px-5 py-5 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="space-y-4 p-0">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">{t('categories:list.heading')}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{t('categories:list.availableCount', { count: categories.length })}</p>
              </div>
              <Button onClick={handleCreateMode} type="button" variant="secondary">
                <Plus className="mr-2 h-4 w-4" />
                {t('categories:list.newButton')}
              </Button>
            </div>

            {isLoading ? (
              <div className="flex min-h-48 items-center justify-center px-5 py-8 text-sm text-[var(--color-text-secondary)]">
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                {t('categories:list.loading')}
              </div>
            ) : error ? (
              <div className="space-y-4 px-5 py-6">
                <div className="rounded-[var(--radius-control)] border border-[var(--color-danger-text)]/20 bg-[var(--color-danger-bg)] p-4 text-sm text-[var(--color-danger-text)]">
                  {t('categories:list.loadError')}
                </div>
                <Button onClick={() => void refetch()} type="button" variant="secondary">
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  {t('categories:list.retry')}
                </Button>
              </div>
            ) : categories.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center gap-3 px-5 py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-tint)] text-[var(--color-primary)]">
                  <FolderTree className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">{t('categories:list.empty.title')}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{t('categories:list.empty.description')}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 px-3 pb-3">
                {categories.map((category) => {
                  const isSelected = selectedCategoryId === category.id && mode === 'edit'

                  return (
                    <div
                      key={category.id}
                      className={`flex items-start gap-3 rounded-[var(--radius-control)] border px-4 py-3 transition ${
                        isSelected
                          ? 'border-[var(--color-primary)] bg-[var(--color-surface-tint)]/70'
                          : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-strong)]'
                      }`}
                    >
                      <button className="min-w-0 flex-1 text-left" onClick={() => handleEditMode(category)} type="button">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[var(--color-text)]">{category.name}</span>
                          {isSelected ? (
                            <span className="rounded-[4px] bg-[var(--color-primary)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-white">
                              {t('categories:list.editingBadge')}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text-secondary)]">
                          {category.description?.trim() || t('categories:list.noDescription')}
                        </p>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          className="rounded-[8px] p-2 text-[var(--color-text-secondary)] transition hover:bg-white hover:text-[var(--color-primary)]"
                          onClick={() => handleEditMode(category)}
                          type="button"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded-[8px] p-2 text-[var(--color-danger-text)] transition hover:bg-[var(--color-danger-bg)] disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isMutating}
                          onClick={() => {
                            handleEditMode(category)
                            deleteMutation.mutate(category.id)
                          }}
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card className="space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  {mode === 'create' ? t('categories:form.createTitle') : t('categories:form.editTitle')}
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {mode === 'create'
                    ? t('categories:form.createDescription')
                    : t('categories:form.editDescription')}
                </p>
              </div>
              {mode === 'edit' ? (
                <Button onClick={handleCreateMode} type="button" variant="ghost">
                  {t('categories:form.newCategoryButton')}
                </Button>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">{t('categories:form.nameLabel')}</label>
              <input
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]"
                onChange={(event) => setName(event.target.value)}
                placeholder={t('categories:form.namePlaceholder')}
                type="text"
                value={name}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">{t('categories:form.descriptionLabel')}</label>
              <textarea
                className="min-h-32 w-full resize-none rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]"
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t('categories:form.descriptionPlaceholder')}
                value={description}
              />
            </div>

            <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 text-sm text-[var(--color-text-secondary)]">
              {mode === 'edit' && selectedCategory ? (
                <Trans
                  components={{ bold: <span className="font-semibold text-[var(--color-text)]" /> }}
                  i18nKey="categories:form.infoBox.edit"
                  ns={['categories', 'common']}
                  values={{ categoryName: selectedCategory.name }}
                />
              ) : (
                t('categories:form.infoBox.create')
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {isFetching && !isLoading ? (
                  <span className="inline-flex items-center text-xs text-[var(--color-text-secondary)]">
                    <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" />
                    {t('categories:form.updatingData')}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                {mode === 'edit' ? (
                  <button
                    className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-control)] px-4 py-2 text-sm font-medium text-[var(--color-danger-text)] transition hover:bg-[var(--color-danger-bg)] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isMutating}
                    onClick={handleDelete}
                    type="button"
                  >
                    {t('categories:form.deleteButton')}
                  </button>
                ) : null}
                <Button disabled={isMutating} onClick={onClose} type="button" variant="ghost">
                  {t('categories:form.closeButton')}
                </Button>
                <Button disabled={isMutating || Boolean(error)} onClick={handleSubmit} type="button">
                  {isMutating ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      {t('categories:form.saving')}
                    </>
                  ) : mode === 'create' ? (
                    t('categories:form.submitCreate')
                  ) : (
                    t('categories:form.submitUpdate')
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function getCategoryErrorMessage(error: unknown, action: 'create' | 'update' | 'delete', t: CategoriesTFunction) {
  if (!isAxiosError<ApiErrorEnvelope>(error)) {
    return t('categories:errors.unexpected')
  }

  const apiError = error.response?.data
  const status = error.response?.status
  const code = apiError?.error?.toUpperCase() ?? ''
  const message = apiError?.message?.trim()
  const normalizedMessage = message?.toLowerCase() ?? ''

  if (
    action === 'delete' &&
    status === 409
  ) {
    return t('categories:errors.deleteConflict')
  }

  if (
    action !== 'delete' &&
    (code.includes('DUPLICATE') ||
      code.includes('ALREADY_EXISTS') ||
      code.includes('NAME_TAKEN') ||
      normalizedMessage.includes('already exists') ||
      normalizedMessage.includes('duplicate') ||
      normalizedMessage.includes('ya existe') ||
      normalizedMessage.includes('duplic'))
  ) {
    return t('categories:errors.duplicateName')
  }

  if (message) {
    return message
  }

  if (status === 400) {
    return t('categories:errors.invalidData')
  }

  return t('categories:errors.operationFailed')
}
