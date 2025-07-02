import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useClerkSupabaseClient } from "../../../lib/supabase";
import { useUser } from "@clerk/clerk-expo";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { getCategories } from "../../../services/categories";
import { getProductById, updateProduct } from "../../../services/products";
import { Database } from "../../../types/database.types";
import { uploadProductImage } from "../../../utils/fileUpload";

const MAX_IMAGES = 5;
const MAX_DESCRIPTION_LENGTH = 1000;

type ProductStatus = Database["public"]["Enums"]["product_status"];

const EditProductScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [deliveryTypes, setDeliveryTypes] = useState<string[]>([]);
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [status, setStatus] = useState<ProductStatus>("available");

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newImages, setNewImages] = useState<string[]>([]); // Track newly added images
  const [removedImages, setRemovedImages] = useState<string[]>([]); // Track removed images

  // Get Supabase client and user
  const supabaseClient = useClerkSupabaseClient();
  const { user } = useUser();

  // Fetch product data
  const {
    data: product,
    isLoading: productLoading,
    error: productError,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductById(supabaseClient, id!, user?.id || null),
    enabled: !!supabaseClient && !!id,
  });

  // Fetch categories using React Query
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(supabaseClient),
    enabled: !!supabaseClient,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (updateData: any) => {
      return updateProduct(supabaseClient, id!, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      Alert.alert("Success!", "Your product has been updated successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      console.error("Error updating product:", error);
      Alert.alert(
        "Update Error",
        error.message || "Failed to update product. Please try again."
      );
    },
  });

  const conditions = [
    "New",
    "Like New",
    "Used - Good",
    "Used - Fair",
    "For Parts",
  ];
  const availableDeliveryTypes = ["Pickup", "Shipping"];
  const statusOptions: { value: ProductStatus; label: string }[] = [
    { value: "available", label: "Available" },
    { value: "sold", label: "Sold" },
  ];

  // Populate form when product data is loaded
  useEffect(() => {
    if (product) {
      // Check if user owns this product
      if (product.user_id !== user?.id) {
        Alert.alert("Access Denied", "You can only edit your own products.", [
          { text: "OK", onPress: () => router.back() },
        ]);
        return;
      }

      setImages(product.images || []);
      setTitle(product.title);
      setPrice(product.price.toString());
      setDescription(product.description || "");
      setCondition(product.condition || "");
      setCategoryId(product.categories?.id || "");
      setAddress(product.address || "");
      setDeliveryTypes(product.delivery_type || []);
      setIsNegotiable(product.is_negotiable);
      setStatus(product.status);
    }
  }, [product, user?.id, router]);

  // Handle errors
  useEffect(() => {
    if (productError) {
      console.error("Error fetching product:", productError);
      Alert.alert("Error", "Could not load product data.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }
    if (categoriesError) {
      console.error("Error fetching categories:", categoriesError);
      Alert.alert("Error", "Could not load categories.");
    }
  }, [productError, categoriesError, router]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Title is required";
    if (!price.trim() || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      newErrors.price = "A valid price is required";
    }
    if (!description.trim()) newErrors.description = "Description is required";
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      newErrors.description = `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`;
    }
    if (!condition) newErrors.condition = "Please select a condition";
    if (!categoryId) newErrors.category = "Please select a category";
    if (deliveryTypes.includes("Pickup") && !address.trim()) {
      newErrors.address = "Pickup address is required if pickup is offered";
    }
    if (images.length === 0 && newImages.length === 0)
      newErrors.images = "At least one image is required";
    if (deliveryTypes.length === 0)
      newErrors.delivery = "Select at least one delivery type";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = useCallback(async () => {
    const totalImages = images.length + newImages.length;
    if (totalImages >= MAX_IMAGES) {
      Alert.alert(
        "Limit Reached",
        `You can only upload a maximum of ${MAX_IMAGES} images.`
      );
      return;
    }
    try {
      setIsLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setNewImages((prev) => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [images, newImages]);

  const removeExistingImage = useCallback((index: number) => {
    const imageToRemove = images[index];
    setImages((prev) => prev.filter((_, i) => i !== index));
    setRemovedImages((prev) => [...prev, imageToRemove]);
  }, [images]);

  const removeNewImage = useCallback((index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const toggleDeliveryType = (type: string) => {
    setDeliveryTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert(
        "Incomplete Form",
        "Please fill out all required fields correctly."
      );
      return;
    }

    if (!user || !supabaseClient) {
      Alert.alert("Authentication Error", "Please make sure you are logged in.");
      return;
    }

    try {
      // 1. Upload new images to Supabase Storage
      const newImageUrls: string[] = [];
      for (const uri of newImages) {
        const response = await fetch(uri);
        const blob = await response.blob();
        
        const publicUrl = await uploadProductImage(
          supabaseClient,
          user.id,
          blob,
          blob.type
        );
        newImageUrls.push(publicUrl);
      }

      // 2. Delete removed images from storage (optional - for cleanup)
      for (const imageUrl of removedImages) {
        try {
          // Extract file path from URL
          const urlParts = imageUrl.split("/");
          const fileName = urlParts[urlParts.length - 1];
          const filePath = `${user.id}/${fileName}`;
          
          await supabaseClient.storage.from("products").remove([filePath]);
        } catch (error) {
          console.warn("Failed to delete image from storage:", error);
          // Continue even if deletion fails
        }
      }

      // 3. Prepare updated product data
      const finalImages = [...images, ...newImageUrls];
      const updateData = {
        title,
        description,
        price: parseFloat(price),
        is_negotiable: isNegotiable,
        images: finalImages,
        condition,
        delivery_type: deliveryTypes,
        address: deliveryTypes.includes("Pickup") ? address : null,
        category_id: categoryId!,
        status,
        updated_at: new Date().toISOString(),
      };

      // 4. Update product in the database
      await updateProductMutation.mutateAsync(updateData);
    } catch (error) {
      console.error("Error updating product:", error);
      Alert.alert(
        "Update Error",
        "Failed to update product. Please try again."
      );
    }
  };

  if (productLoading) {
    return (
      <ScreenWrapper>
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="text-gray-500 mt-4">Loading product...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!product) {
    return (
      <ScreenWrapper>
        <View className="flex-1 items-center justify-center bg-white">
          <Text className="text-gray-500 text-lg">Product not found</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-4 bg-indigo-600 px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  const allImages = [...images, ...newImages];

  return (
    <ScreenWrapper bottom={true}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 py-6 border-b border-gray-100 items-center">
          <Text className="text-3xl font-bold text-gray-900">
            Edit Listing
          </Text>
          <Text className="text-gray-500 mt-1">
            Update your product details
          </Text>
        </View>

        {/* --- Media Upload --- */}
        <View className="px-4 py-6 bg-gray-50/50">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Photos <Text className="text-red-500">*</Text>
          </Text>
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="-mx-2"
            >
              {/* Existing Images */}
              {images.map((uri, index) => (
                <View key={`existing-${index}`} className="mx-2 relative">
                  <Image
                    source={{ uri }}
                    className="w-32 h-32 rounded-xl"
                    style={{ resizeMode: "cover" }}
                  />
                  <TouchableOpacity
                    onPress={() => removeExistingImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1.5 shadow-lg"
                  >
                    <Ionicons name="close" size={14} color="white" />
                  </TouchableOpacity>
                  {index === 0 && (
                    <View className="absolute bottom-2 left-2 bg-black/70 rounded-md px-2 py-1">
                      <Text className="text-white text-xs font-medium">
                        Cover
                      </Text>
                    </View>
                  )}
                </View>
              ))}
              
              {/* New Images */}
              {newImages.map((uri, index) => (
                <View key={`new-${index}`} className="mx-2 relative">
                  <Image
                    source={{ uri }}
                    className="w-32 h-32 rounded-xl"
                    style={{ resizeMode: "cover" }}
                  />
                  <TouchableOpacity
                    onPress={() => removeNewImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1.5 shadow-lg"
                  >
                    <Ionicons name="close" size={14} color="white" />
                  </TouchableOpacity>
                  <View className="absolute bottom-2 left-2 bg-green-600/70 rounded-md px-2 py-1">
                    <Text className="text-white text-xs font-medium">
                      New
                    </Text>
                  </View>
                </View>
              ))}
              
              {/* Add Photo Button */}
              {allImages.length < MAX_IMAGES && (
                <TouchableOpacity
                  onPress={pickImage}
                  disabled={isLoading}
                  className="mx-2 w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 items-center justify-center bg-gray-50 active:bg-gray-100"
                >
                  {isLoading ? (
                    <ActivityIndicator color="#6B7280" />
                  ) : (
                    <View className="items-center">
                      <Ionicons name="camera" size={28} color="#6B7280" />
                      <Text className="text-gray-500 text-xs mt-1 font-medium">
                        Add Photo
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </ScrollView>
            <Text className="text-xs text-gray-500 mt-3 text-center">
              First image will be your cover photo • Maximum {MAX_IMAGES} photos
            </Text>
          </View>
          {errors.images && (
            <Text className="text-red-500 text-xs mt-2">{errors.images}</Text>
          )}
        </View>

        {/* --- Form Inputs --- */}
        <View className="px-4 space-y-6 pb-6">
          {/* Title */}
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Title <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className={`bg-gray-50 rounded-xl px-4 py-4 text-gray-900 text-base ${
                errors.title
                  ? "border-2 border-red-500"
                  : "border border-gray-200"
              }`}
              placeholder="e.g., Vintage Leather Jacket"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#9CA3AF"
            />
            {errors.title && (
              <Text className="text-red-500 text-xs mt-2">{errors.title}</Text>
            )}
          </View>

          {/* Price & Negotiable */}
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <View className="flex-row space-x-4">
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900 mb-3">
                  Price <Text className="text-red-500">*</Text>
                </Text>
                <View className="relative">
                  <Text className="absolute left-4 top-4 text-gray-500 text-base font-medium z-10">
                    $
                  </Text>
                  <TextInput
                    className={`bg-gray-50 rounded-xl pl-8 pr-4 py-4 text-gray-900 text-base ${
                      errors.price
                        ? "border-2 border-red-500"
                        : "border border-gray-200"
                    }`}
                    placeholder="0.00"
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                {errors.price && (
                  <Text className="text-red-500 text-xs mt-2">
                    {errors.price}
                  </Text>
                )}
              </View>
              <View className="w-24">
                <Text className="text-base font-semibold text-gray-900 mb-3">
                  Negotiable
                </Text>
                <View className="bg-gray-50 rounded-xl border border-gray-200 h-[56px] items-center justify-center">
                  <Switch
                    value={isNegotiable}
                    onValueChange={setIsNegotiable}
                    trackColor={{ false: "#E5E7EB", true: "#4F46E5" }}
                    thumbColor={isNegotiable ? "#FFFFFF" : "#FFFFFF"}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Status */}
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Status <Text className="text-red-500">*</Text>
            </Text>
            <View className="flex-row space-x-3">
              {statusOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setStatus(option.value)}
                  className={`flex-1 px-4 py-4 rounded-xl border-2 items-center ${
                    status === option.value
                      ? "bg-indigo-600 border-indigo-600"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <Ionicons
                    name={option.value === "available" ? "checkmark-circle" : "close-circle"}
                    size={20}
                    color={status === option.value ? "#FFFFFF" : "#6B7280"}
                  />
                  <Text
                    className={`font-semibold text-sm mt-1 ${
                      status === option.value
                        ? "text-white"
                        : "text-gray-700"
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Condition */}
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Condition <Text className="text-red-500">*</Text>
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="-mx-1"
            >
              {conditions.map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => setCondition(item)}
                  className={`mx-1 px-4 py-3 rounded-xl border-2 ${
                    condition === item
                      ? "bg-indigo-600 border-indigo-600"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <Text
                    className={`font-semibold text-sm ${
                      condition === item ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {errors.condition && (
              <Text className="text-red-500 text-xs mt-2">
                {errors.condition}
              </Text>
            )}
          </View>

          {/* Category */}
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Category <Text className="text-red-500">*</Text>
            </Text>
            {categoriesLoading ? (
              <View className="flex-row items-center justify-center py-4">
                <ActivityIndicator color="#6B7280" size="small" />
                <Text className="text-gray-500 ml-2">
                  Loading categories...
                </Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap -mx-1">
                {categories.map((item: any) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setCategoryId(item.id)}
                    className={`mx-1 mb-2 px-4 py-3 rounded-xl border-2 ${
                      categoryId === item.id
                        ? "bg-indigo-600 border-indigo-600"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <Text
                      className={`font-semibold text-sm ${
                        categoryId === item.id ? "text-white" : "text-gray-700"
                      }`}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {errors.category && (
              <Text className="text-red-500 text-xs mt-2">
                {errors.category}
              </Text>
            )}
          </View>

          {/* Delivery Type */}
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Delivery Method <Text className="text-red-500">*</Text>
            </Text>
            <View className="flex-row space-x-3">
              {availableDeliveryTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => toggleDeliveryType(type)}
                  className={`flex-1 px-4 py-4 rounded-xl border-2 items-center ${
                    deliveryTypes.includes(type)
                      ? "bg-indigo-600 border-indigo-600"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <Ionicons
                    name={type === "Pickup" ? "location" : "send"}
                    size={20}
                    color={deliveryTypes.includes(type) ? "#FFFFFF" : "#6B7280"}
                  />
                  <Text
                    className={`font-semibold text-sm mt-1 ${
                      deliveryTypes.includes(type)
                        ? "text-white"
                        : "text-gray-700"
                    }`}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.delivery && (
              <Text className="text-red-500 text-xs mt-2">
                {errors.delivery}
              </Text>
            )}
          </View>

          {/* Address (conditional) */}
          {deliveryTypes.includes("Pickup") && (
            <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <Text className="text-base font-semibold text-gray-900 mb-3">
                Pickup Location <Text className="text-red-500">*</Text>
              </Text>
              <View className="relative">
                <Ionicons
                  name="location-outline"
                  size={20}
                  color="#6B7280"
                  className="absolute left-4 top-4 z-10"
                />
                <TextInput
                  className={`bg-gray-50 rounded-xl pl-12 pr-4 py-4 text-gray-900 text-base ${
                    errors.address
                      ? "border-2 border-red-500"
                      : "border border-gray-200"
                  }`}
                  placeholder="Enter full address for pickup"
                  value={address}
                  onChangeText={setAddress}
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>
              {errors.address && (
                <Text className="text-red-500 text-xs mt-2">
                  {errors.address}
                </Text>
              )}
            </View>
          )}

          {/* Description */}
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Description <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className={`bg-gray-50 rounded-xl px-4 py-4 text-gray-900 min-h-[120px] text-base ${
                errors.description
                  ? "border-2 border-red-500"
                  : "border border-gray-200"
              }`}
              placeholder="Describe your item in detail. Include condition, features, and any flaws..."
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              maxLength={MAX_DESCRIPTION_LENGTH}
              placeholderTextColor="#9CA3AF"
            />
            <View className="flex-row justify-between items-center mt-2">
              <Text className="text-xs text-gray-400">
                Be detailed and honest
              </Text>
              <Text
                className={`text-xs ${
                  description.length > MAX_DESCRIPTION_LENGTH * 0.9
                    ? "text-orange-500"
                    : "text-gray-500"
                }`}
              >
                {description.length}/{MAX_DESCRIPTION_LENGTH}
              </Text>
            </View>
            {errors.description && (
              <Text className="text-red-500 text-xs mt-2">
                {errors.description}
              </Text>
            )}
          </View>
        </View>

        {/* Submit Button */}
        <View className="px-4 py-6 mt-4">
          <TouchableOpacity
            className={`bg-indigo-600 rounded-2xl py-4 items-center shadow-lg ${
              updateProductMutation.isPending ? "opacity-70" : ""
            }`}
            onPress={handleSubmit}
            disabled={updateProductMutation.isPending}
            style={{
              shadowColor: "#4F46E5",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            {updateProductMutation.isPending ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white font-semibold text-lg ml-2">
                  Updating...
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={24} color="white" />
                <Text className="text-white font-semibold text-lg ml-2">
                  Update Listing
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View className="h-20" />
      </ScrollView>
    </ScreenWrapper>
  );
};

export default EditProductScreen;