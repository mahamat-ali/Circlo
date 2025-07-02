import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

// Type definitions
export type Category = Database['public']['Tables']['categories']['Row'];
export type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
export type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

/**
 * Fetches all categories from Supabase
 *
 * @param {SupabaseClient<Database>} client - The Supabase client instance
 * @returns {Promise<Category[]>} A list of categories
 */
export const getCategories = async (
  client: SupabaseClient<Database>
): Promise<Category[]> => {
  const { data, error } = await client
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }

  return data || [];
};

/**
 * Creates a new category
 *
 * @param {SupabaseClient<Database>} client - The Supabase client instance
 * @param {CategoryInsert} categoryData - The category data to insert
 * @returns {Promise<Category>} The newly created category
 */
export const createCategory = async (
  client: SupabaseClient<Database>,
  categoryData: CategoryInsert
): Promise<Category> => {
  const { data, error } = await client
    .from('categories')
    .insert(categoryData)
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    throw error;
  }

  return data;
};

/**
 * Updates an existing category
 *
 * @param {SupabaseClient<Database>} client - The Supabase client instance
 * @param {string} categoryId - The ID of the category to update
 * @param {CategoryUpdate} updateData - The data to update
 * @returns {Promise<Category>} The updated category
 */
export const updateCategory = async (
  client: SupabaseClient<Database>,
  categoryId: string,
  updateData: CategoryUpdate
): Promise<Category> => {
  const { data, error } = await client
    .from('categories')
    .update(updateData)
    .eq('id', categoryId)
    .select()
    .single();

  if (error) {
    console.error(`Error updating category ${categoryId}:`, error);
    throw error;
  }

  return data;
};

/**
 * Deletes a category
 *
 * @param {SupabaseClient<Database>} client - The Supabase client instance
 * @param {string} categoryId - The ID of the category to delete
 * @returns {Promise<void>}
 */
export const deleteCategory = async (
  client: SupabaseClient<Database>,
  categoryId: string
): Promise<void> => {
  const { error } = await client
    .from('categories')
    .delete()
    .eq('id', categoryId);

  if (error) {
    console.error(`Error deleting category ${categoryId}:`, error);
    throw error;
  }
};