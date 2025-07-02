
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types'; // Assuming you have generated types

// --- Type Definitions ---

export type ProductStatus = 'available' | 'sold';
export type DeliveryType = 'pickup' | 'shipping';

export type Category = Database['public']['Tables']['categories']['Row'];

// Base Product type matching the database schema
export type Product = Omit<Database['public']['Tables']['products']['Row'], 'category_id'> & {
  categories: Pick<Category, 'id' | 'name'>; // Nest category info
};

// Type for inserting a new product
export type ProductInsert = Database['public']['Tables']['products']['Insert'];

// Type for updating a product
export type ProductUpdate = Database['public']['Tables']['products']['Update'];

// Extended type that includes dynamic details like likes
export type ProductWithDetails = Product & {
  likes_count: number;
  is_liked: boolean;
  seller_username: string; // Or full user profile
};


// --- Service Functions ---

/**
 * Fetches a list of products with details like category, likes count, and if the user has liked it.
 * This function now uses standard queries and client-side data merging instead of an RPC call.
 *
 * @param {SupabaseClient<Database>} client - The Supabase client instance.
 * @param {string | null} currentUserId - The ID of the currently logged-in user, or null for anonymous users.
 * @returns {Promise<ProductWithDetails[]>} A list of products with extended details.
 */
export const getProducts = async (
  client: SupabaseClient<Database>,
  currentUserId: string | null
): Promise<ProductWithDetails[]> => {
  // Step 1: Fetch all products, their category, seller info, and a count of likes.
  // The '!left' hint ensures we get products even if they have 0 likes.
  const { data: productsData, error: productsError } = await client
    .from('products')
    .select(`
      *,
      categories (id, name),
      users (username),
      likes!left(count)
    `)
    .order('created_at', { ascending: false });

  if (productsError) {
    console.error("Error fetching products:", productsError);
    throw productsError;
  }

  // Step 2: If a user is logged in, fetch a list of all product IDs they have liked.
  let likedProductIds = new Set<string>();
  if (currentUserId) {
    const { data: likesData, error: likesError } = await client
      .from('likes')
      .select('product_id')
      .eq('user_id', currentUserId);
    
    if (likesError) {
      // This is not a fatal error, so we can just log it and continue.
      console.error("Error fetching user likes:", likesError);
    } else {
      likedProductIds = new Set(likesData.map(like => like.product_id));
    }
  }

  // Step 3: Combine the data into the final shape.
  const detailedProducts = productsData.map(p => {
    const product = p as any; // Use 'any' to handle the dynamic shape from the query
    return {
      ...product,
      categories: product.categories,
      seller_username: product.users?.username || 'Unknown Seller',
      likes_count: product.likes[0]?.count || 0,
      is_liked: likedProductIds.has(product.id),
    };
  });

  return detailedProducts as ProductWithDetails[];
};

/**
 * Fetches a single product by its ID with all details.
 *
 * @param {SupabaseClient<Database>} client - The Supabase client instance.
 * @param {string} productId - The UUID of the product to fetch.
 * @param {string | null} currentUserId - The ID of the currently logged-in user.
 * @returns {Promise<ProductWithDetails | null>} The product details or null if not found.
 */
export const getProductById = async (
  client: SupabaseClient<Database>,
  productId: string,
  currentUserId: string | null
): Promise<ProductWithDetails | null> => {
  const { data, error } = await client
    .from('products')
    .select(`
      *,
      categories (id, name),
      users (username),
      likes!left(count)
    `)
    .eq('id', productId)
    .single();

  if (error) {
    console.error(`Error fetching product ${productId}:`, error);
    // It's common for .single() to fail if no row is found.
    // We can return null in that case.
    if (error.code === 'PGRST116') {
        return null;
    }
    throw error;
  }

  if (!data) return null;

  let isLiked = false;
  if (currentUserId) {
    const { data: likeData, error: likeError } = await client
      .from('likes')
      .select('product_id')
      .eq('user_id', currentUserId)
      .eq('product_id', productId)
      .maybeSingle();

    if (likeError) {
      console.error("Error checking user like status:", likeError);
    } else {
      isLiked = !!likeData;
    }
  }

  const product = data as any;
  const detailedProduct: ProductWithDetails = {
    ...product,
    categories: product.categories,
    seller_username: product.users?.username || 'Unknown Seller',
    likes_count: product.likes[0]?.count || 0,
    is_liked: isLiked,
  };

  return detailedProduct;
};

/**
 * Creates a new product in the database.
 *
 * @param {SupabaseClient<Database>} client - The Supabase client instance.
 * @param {ProductInsert} productData - The data for the new product.
 * @returns {Promise<Product>} The newly created product.
 */
export const createProduct = async (
  client: SupabaseClient<Database>,
  productData: ProductInsert
): Promise<Product> => {
  const { data, error } = await client
    .from('products')
    .insert(productData)
    .select(`
      *,
      categories (id, name)
    `)
    .single();

  if (error) {
    console.error("Error creating product:", error);
    throw error;
  }
  return data as Product;
};

/**
 * Updates an existing product.
 *
 * @param {SupabaseClient<Database>} client - The Supabase client instance.
 * @param {string} productId - The UUID of the product to update.
 * @param {ProductUpdate} updateData - The data to update.
 * @returns {Promise<Product>} The updated product.
 */
export const updateProduct = async (
  client: SupabaseClient<Database>,
  productId: string,
  updateData: ProductUpdate
): Promise<Product> => {
  const { data, error } = await client
    .from('products')
    .update(updateData)
    .eq('id', productId)
    .select(`
      *,
      categories (id, name)
    `)
    .single();

  if (error) {
    console.error(`Error updating product ${productId}:`, error);
    throw error;
  }
  return data as Product;
};

/**
 * Deletes a product from the database.
 *
 * @param {SupabaseClient<Database>} client - The Supabase client instance.
 * @param {string} productId - The UUID of the product to delete.
 * @returns {Promise<void>}
 */
export const deleteProduct = async (
  client: SupabaseClient<Database>,
  productId: string
): Promise<void> => {
  const { error } = await client.from('products').delete().eq('id', productId);

  if (error) {
    console.error(`Error deleting product ${productId}:`, error);
    throw error;
  }
};

/**
 * Adds a 'like' from a user to a product.
 *
 * @param {SupabaseClient<Database>} client - The Supabase client instance.
 * @param {string} productId - The UUID of the product to like.
 * @param {string} userId - The UUID of the user liking the product.
 * @returns {Promise<void>}
 */
export const likeProduct = async (
    client: SupabaseClient<Database>,
    productId: string,
    userId: string
): Promise<void> => {
    const { error } = await client.from('likes').insert({
        product_id: productId,
        user_id: userId
    });
    if (error) {
        // Ignore duplicate errors (user already liked it)
        if (error.code !== '23505') {
            console.error("Error liking product:", error);
            throw error;
        }
    }
};

/**
 * Removes a 'like' from a user on a product.
 *
 * @param {SupabaseClient<Database>} client - The Supabase client instance.
 * @param {string} productId - The UUID of the product to unlike.
 * @param {string} userId - The UUID of the user unliking the product.
 * @returns {Promise<void>}
 */
export const unlikeProduct = async (
    client: SupabaseClient<Database>,
    productId: string,
    userId: string
): Promise<void> => {
    const { error } = await client.from('likes').delete()
        .eq('product_id', productId)
        .eq('user_id', userId);

    if (error) {
        console.error("Error unliking product:", error);
        throw error;
    }
};
