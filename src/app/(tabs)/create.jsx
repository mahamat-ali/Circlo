import React, { useState, useCallback } from "react";
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
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useClerkSupabaseClient } from "../../lib/supabase";
import { useUser } from "@clerk/clerk-expo";
import ScreenWrapper from "../../components/ScreenWrapper";
import { getCategories } from "../../services/categories";
import { uploadProductImage } from "../../utils/fileUpload";

const MAX_IMAGES = 5;
const MAX_DESCRIPTION_LENGTH = 1000;

const CreateScreen = () => {
  const router = useRouter();
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null); // Video state is kept for future use
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("");
  const [categoryId, setCategoryId] = useState(null);
  const [address, setAddress] = useState("");
  const [deliveryTypes, setDeliveryTypes] = useState([]);
  const [isNegotiable, setIsNegotiable] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Get Supabase client and user
  const supabaseClient = useClerkSupabaseClient();
  const { user } = useUser();

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
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });

  const conditions = [
    "New",
    "Like New",
    "Used - Good",
    "Used - Fair",
    "For Parts",
  ];
  const availableDeliveryTypes = ["Pickup", "Shipping"];

  // Handle categories error
  React.useEffect(() => {
    if (categoriesError) {
      console.error("Error fetching categories:", categoriesError);
      Alert.alert("Error", "Could not load categories.");
    }
  }, [categoriesError]);

  const validateForm = () => {
    const newErrors = {};
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
    if (!address.trim()) {
      newErrors.address = "Address is required";
    }
    if (images.length === 0)
      newErrors.images = "At least one image is required";
    if (deliveryTypes.length === 0)
      newErrors.delivery = "Select at least one delivery type";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = useCallback(async () => {
    if (images.length >= MAX_IMAGES) {
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
        quality: 0.2,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImages((prev) => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [images]);

  const removeImage = useCallback((index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const toggleDeliveryType = (type) => {
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
      Alert.alert(
        "Authentication Error",
        "Please make sure you are logged in."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload images to Supabase Storage
      const imageUrls = [];
      for (const uri of images) {
        const response = await fetch(uri);
        const blob = await response.blob();

        const publicUrl = await uploadProductImage(
          supabaseClient,
          user.id,
          blob,
          blob.type
        );
        imageUrls.push(publicUrl);
      }

      // 2. Prepare product data
      const newProduct = {
        user_id: user.id,
        title,
        description,
        price: parseFloat(price),
        is_negotiable: isNegotiable,
        images: imageUrls,
        condition,
        delivery_type: deliveryTypes,
        address: address,
        category_id: categoryId,
        status: "available",
      };

      // 3. Insert product into the database
      const { error: insertError } = await supabaseClient
        .from("products")
        .insert(newProduct);
      if (insertError) throw insertError;

      Alert.alert("Success!", "Your item has been listed successfully.", [
        { text: "OK", onPress: () => router.push("/(tabs)/") },
      ]);

      // Reset form
      setImages([]);
      setTitle("");
      setPrice("");
      setDescription("");
      setCondition("");
      setCategoryId(null);
      setAddress("");
      setDeliveryTypes([]);
      setIsNegotiable(false);
      setErrors({});
    } catch (error) {
      console.error("Error creating listing:", error);
      Alert.alert(
        "Submission Error",
        error.message || "Failed to create listing. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenWrapper className="flex-1 bg-white" bottom={true}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6 border-b border-gray-100 items-center">
          <Text className="text-3xl font-bold text-gray-900">
            Create Listing
          </Text>
          <Text className="text-gray-500 mt-1">
            Fill in the details to sell your item
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
              {images.map((uri, index) => (
                <View key={index} className="mx-2 relative">
                  <Image
                    source={{ uri }}
                    className="w-32 h-32 rounded-xl"
                    style={{ resizeMode: "cover" }}
                  />
                  <TouchableOpacity
                    onPress={() => removeImage(index)}
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
              {images.length < MAX_IMAGES && (
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
                {categories.map((item) => (
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

          {/* Address */}
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Address <Text className="text-red-500">*</Text>
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
                placeholder="Enter your full address"
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
              isSubmitting ? "opacity-70" : ""
            }`}
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={{
              shadowColor: "#4F46E5",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            {isSubmitting ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white font-semibold text-lg ml-2">
                  Creating...
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="add-circle" size={24} color="white" />
                <Text className="text-white font-semibold text-lg ml-2">
                  Create Listing
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

export default CreateScreen;
