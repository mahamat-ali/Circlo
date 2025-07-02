import React, { useState, useCallback, useMemo, useEffect } from "react";
import { View, FlatList, Dimensions } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useClerkSupabaseClient } from "@/lib/supabase";
import { getProducts, likeProduct, unlikeProduct } from "@/services/products";
import { getCategories } from "@/services/categories";
import { useUser } from "@clerk/clerk-expo";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import PromotionCarousel from "@/components/PromotionCarousel";
import FilterOptions from "@/components/FilterOptions";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";

const HORIZONTAL_MARGIN = 16; // Match the CustomTabBar margin

// Featured sellers data - can be moved to a separate service later
const sampleFeaturedSellers = [
  {
    id: "user123",
    sellerName: "Vintage Treasures",
    tagline: "Unique finds from decades past!",
    showcaseImageUrl: {
      uri: "https://images.unsplash.com/photo-1560343090-f0409e92791a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    },
    buttonText: "Visit Shop",
    onPressVisit: () => console.log("Visit Vintage Treasures (user123)"),
  },
  {
    id: "user456",
    sellerName: "TechCycle",
    tagline: "Refurbished electronics, good as new.",
    showcaseImageUrl: {
      uri: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    },
    buttonText: "View Gadgets",
    onPressVisit: () => console.log("Visit TechCycle (user456)"),
  },
  {
    id: "user789",
    sellerName: "Artisan Corner",
    tagline: "Handmade crafts & unique gifts.",
    showcaseImageUrl: {
      uri: "https://images.unsplash.com/photo-1607083206968-13611e3d76db?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    },
    onPressVisit: () => console.log("Visit Artisan Corner (user789)"),
  },
  {
    id: "user101",
    sellerName: "Bookworm's Nook",
    tagline: "Rare & out-of-print books.",
    showcaseImageUrl: {
      uri: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    },
    onPressVisit: () => console.log("Visit Bookworm Nook (user101)"),
  },
];

// Categories will be fetched from Supabase using useQuery

const sampleProducts = [
  {
    id: "prod_001",
    title: "iPhone 14 Pro Max - 256GB",
    price: 1099.99,
    condition: "New",
    location: "New York",
    sellerName: "TechStore",
    sellerRating: "4.8",
    isLiked: false,
    image: {
      uri: "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb",
    },
  },
  {
    id: "prod_002",
    title: "MacBook Pro M2 16-inch",
    price: 1899.99,
    condition: "Like New",
    location: "London",
    sellerName: "AppleReseller",
    sellerRating: "4.9",
    isLiked: true,
    image: {
      uri: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
    },
  },
  {
    id: "prod_003",
    title: "Sony WH-1000XM5 Headphones",
    price: 349.99,
    condition: "New",
    location: "Toronto",
    sellerName: "AudioPro",
    sellerRating: "4.7",
    isLiked: false,
    image: {
      uri: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb",
    },
  },
  {
    id: "prod_004",
    title: "Nintendo Switch OLED",
    price: 399.99,
    condition: "Used",
    location: "Sydney",
    sellerName: "GameWorld",
    sellerRating: "4.5",
    isLiked: false,
    image: {
      uri: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e",
    },
  },
  {
    id: "prod_005",
    title: "DJI Mini 3 Pro Drone",
    price: 699.99,
    condition: "New",
    location: "Berlin",
    sellerName: "DroneMaster",
    sellerRating: "4.9",
    isLiked: true,
    image: {
      uri: "https://images.unsplash.com/photo-1507582020474-9a35b7d455d9",
    },
  },
  {
    id: "prod_006",
    title: "iPad Pro 12.9-inch M2",
    price: 1299.99,
    condition: "Like New",
    location: "Singapore",
    sellerName: "TechHaven",
    sellerRating: "4.8",
    isLiked: false,
    image: {
      uri: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0",
    },
  },
];

const HomeScreen = () => {
  const { width } = Dimensions.get("window");
  const supabaseClient = useClerkSupabaseClient();
  const { user } = useUser();
  const queryClient = useQueryClient();

  const horizontalPadding = HORIZONTAL_MARGIN; // Use the same margin as CustomTabBar
  const numColumns = 2;
  const cardSpacing = 12; // Gap between cards
  const cardWidth =
    (width - (horizontalPadding * 2 + cardSpacing)) / numColumns;

  const [searchText, setSearchText] = useState("");
  const [hasNotifications, setHasNotifications] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  // Fetch categories from Supabase
  const {
    data: categoriesData = [],
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      console.log("Fetching categories with client:", !!supabaseClient);
      if (!supabaseClient) {
        throw new Error("Supabase client not available");
      }
      const result = await getCategories(supabaseClient);
      console.log("Categories fetch result:", result);
      return result;
    },
    enabled: !!supabaseClient && !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });

  // Use React Query to fetch products from Supabase
  const {
    data: products = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["products", user?.id],
    queryFn: () => getProducts(supabaseClient, user?.id || null),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Prepare categories with "All" option
  const categories = useMemo(() => {
    // Always show fallback categories for now to ensure UI works
    // TODO: Remove this once Supabase categories are properly set up
    const fallbackCategories = [
      "All",
      "Electronics",
      "Fashion",
      "Home & Garden",
      "Books",
      "Sports",
      "Automotive",
      "Health",
      "Gaming",
      "Music",
    ];

    // If categories are still loading, show fallback categories
    if (categoriesLoading) {
      console.log("Categories loading, showing fallback");
      return fallbackCategories;
    }

    // If there's an error or no categories from DB, use fallback
    if (categoriesError || !categoriesData || categoriesData.length === 0) {
      console.log(
        "Using fallback categories. Error:",
        categoriesError,
        "Data length:",
        categoriesData?.length
      );
      return fallbackCategories;
    }

    // If we have data from Supabase, use it
    console.log("Using Supabase categories:", categoriesData.length);
    const dbCategories = categoriesData.map((cat) => cat.name);
    return ["All", ...dbCategories];
  }, [categoriesData, categoriesLoading, categoriesError]);

  const handleSearchChange = useCallback((text) => setSearchText(text), []);
  const handleSearchClear = useCallback(() => setSearchText(""), []);
  const handleNotificationPress = useCallback(
    () => setHasNotifications((prev) => !prev),
    []
  );
  const handleCategorySelect = useCallback(
    (category) => setSelectedCategory(category),
    []
  );
  const handleFilterSelect = useCallback(
    (filter) => setSelectedFilter(filter),
    []
  );
  const handleFilterPress = useCallback(() => setIsFilterVisible(true), []);
  const handleFilterClose = useCallback(() => setIsFilterVisible(false), []);
  const handleSignInPress = useCallback(
    () => console.log("Navigate to sign in"),
    []
  );

  // Mutation for liking/unliking products
  const likeMutation = useMutation({
    mutationFn: async ({ productId, isLiked }) => {
      if (!user?.id) throw new Error("User not authenticated");

      if (isLiked) {
        await unlikeProduct(supabaseClient, productId, user.id);
      } else {
        await likeProduct(supabaseClient, productId, user.id);
      }
    },
    onMutate: async ({ productId, isLiked }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["products", user?.id] });

      // Snapshot the previous value
      const previousProducts = queryClient.getQueryData(["products", user?.id]);

      // Optimistically update the cache
      queryClient.setQueryData(["products", user?.id], (old) => {
        if (!old) return old;
        return old.map((product) =>
          product.id === productId
            ? {
                ...product,
                is_liked: !isLiked,
                likes_count: isLiked
                  ? product.likes_count - 1
                  : product.likes_count + 1,
              }
            : product
        );
      });

      return { previousProducts };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousProducts) {
        queryClient.setQueryData(
          ["products", user?.id],
          context.previousProducts
        );
      }
      console.error("Error updating like status:", err);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["products", user?.id] });
    },
  });

  const handleLikePress = useCallback(
    (productId) => {
      if (!user?.id) {
        console.log("User must be logged in to like products");
        return;
      }

      const product = products.find((p) => p.id === productId);
      if (product) {
        likeMutation.mutate({ productId, isLiked: product.is_liked });
      }
    },
    [user?.id, products, likeMutation]
  );

  // Handle errors and debug info
  useEffect(() => {
    if (error) {
      console.error("Failed to fetch products:", error);
    }
    if (categoriesError) {
      console.error("Failed to fetch categories:", categoriesError);
    }

    // Debug categories
    console.log("Categories loading:", categoriesLoading);
    console.log("Categories data:", categoriesData);
    console.log("Categories error:", categoriesError);
    console.log("Final categories array:", categories);
  }, [error, categoriesError, categoriesLoading, categoriesData, categories]);

  const renderItem = useCallback(
    ({ item }) => (
      <View
        style={{
          width: cardWidth,
          marginBottom: cardSpacing,
          marginRight: cardSpacing,
        }}
      >
        {loading ? (
          <ProductCardSkeleton cardWidth={cardWidth} />
        ) : (
          <ProductCard
            id={item.id}
            image={
              item.images?.[0]
                ? { uri: item.images[0] }
                : {
                    uri: "https://via.placeholder.com/200/CCCCCC/FFFFFF?text=No+Image",
                  }
            }
            title={item.title}
            price={item.price}
            condition={item.condition}
            location={item.address || "Location not specified"}
            sellerName={item.seller_username || "Unknown Seller"}
            sellerRating={null} // Will need to add rating logic later
            isLiked={item.is_liked}
            onLikePress={() => handleLikePress(item.id)}
            cardWidth={cardWidth}
          />
        )}
      </View>
    ),
    [loading, cardWidth, handleLikePress]
  );

  const HeaderComponent = useMemo(
    () => (
      <View>
        <Header
          hasNotifications={hasNotifications}
          onNotificationPress={handleNotificationPress}
          user={user}
          onSignInPress={handleSignInPress}
        />

        <SearchBar
          value={searchText}
          onChangeText={handleSearchChange}
          onClear={handleSearchClear}
          onFilterPress={handleFilterPress}
          hasActiveFilter={selectedFilter !== null}
        />

        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
        />

        <View className="mb-4">
          <PromotionCarousel featuredSellers={sampleFeaturedSellers} />
        </View>

        <FilterOptions
          selectedFilter={selectedFilter}
          onSelectFilter={handleFilterSelect}
          isVisible={isFilterVisible}
          onClose={handleFilterClose}
        />
      </View>
    ),
    [
      hasNotifications,
      searchText,
      selectedCategory,
      selectedFilter,
      isFilterVisible,
      user,
      handleNotificationPress,
      handleSearchChange,
      handleSearchClear,
      handleCategorySelect,
      handleFilterSelect,
      handleFilterPress,
      handleFilterClose,
      handleSignInPress,
    ]
  );

  return (
    <View className="bg-gray-50">
      <FlatList
        data={loading ? Array(6).fill({}) : products}
        keyExtractor={(item, index) => item.id || `skeleton-${index}`}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        ListHeaderComponent={HeaderComponent}
        contentContainerStyle={{
          paddingHorizontal: HORIZONTAL_MARGIN,
          paddingBottom: 100,
        }}
        style={{
          paddingHorizontal: 0,
        }}
      />
    </View>
  );
};

export default HomeScreen;
