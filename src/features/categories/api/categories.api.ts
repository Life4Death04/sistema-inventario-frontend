import { apiClient } from '@/lib/axios'
import type { Category, PaginatedResponse } from '@/types/api.types'

export interface ListCategoriesParams {
  page?: number
  limit?: number
  search?: string
}

export interface CreateCategoryInput {
  name: string
  description?: string
}

export interface UpdateCategoryInput {
  name?: string
  description?: string | null
}

interface CategoryEnvelope {
  category: Category
}

export async function listCategories(params?: ListCategoriesParams): Promise<PaginatedResponse<Category>> {
  const { data } = await apiClient.get<PaginatedResponse<Category>>('/categories', { params })

  return data
}

export async function getCategory(id: string): Promise<Category> {
  const { data } = await apiClient.get<CategoryEnvelope>(`/categories/${id}`)

  return data.category
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const { data } = await apiClient.post<CategoryEnvelope>('/categories', input)

  return data.category
}

export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
  const { data } = await apiClient.patch<CategoryEnvelope>(`/categories/${id}`, input)

  return data.category
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/categories/${id}`)
}
