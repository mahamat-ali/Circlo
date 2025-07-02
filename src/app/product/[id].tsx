import { useState, useEffect } from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Dimensions,
    ActivityIndicator,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import ScreenWrapper from "../../components/ScreenWrapper";
import { useAuth } from "@clerk/clerk-expo";
import { useUser } from "@clerk/clerk-expo";
import { useClerkSupabaseClient } from "../../lib/supabase";
import { getProductById } from "../../services/products";

const { width } = Dimensions.get("window");

export default function ProductDetails() {
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const { isSignedIn } = useAuth();
    const { user } = useUser();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const supabaseClient = useClerkSupabaseClient();

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

    // Handle errors
    useEffect(() => {
        if (productError) {
            console.error("Error fetching product:", productError);
            Alert.alert("Error", "Could not load product data.", [
                { text: "OK", onPress: () => router.back() },
            ]);
        }
    }, [productError, router]);

    const isOwner = user?.id === product?.user_id;
    const handleEditProduct = () => {
        if (product?.id) {
            router.push(`/product/edit/${product.id}`);
        }
    };

    const handleContactSeller = () => {
        if (!isSignedIn) {
            router.replace("/(auth)/signup");
            return;
        }
        // Handle contact seller logic here
        console.log("Contact seller");
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

    const images = product.images || [];
    const description = product.description || "No description available.";
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return "Posted 1 day ago";
        if (diffDays < 7) return `Posted ${diffDays} days ago`;
        if (diffDays < 30) return `Posted ${Math.ceil(diffDays / 7)} weeks ago`;
        return `Posted ${Math.ceil(diffDays / 30)} months ago`;
    };

    return (
        <View className="flex-1 bg-white">
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                <ScreenWrapper>
                    {/* Header - REVISED */}
                    <View className="px-4 bg-white border-b border-gray-100">
                        {/* Removed mb-5, moved border-b */}
                        <View className="flex-row items-center justify-between py-4">
                            {/* Consistent vertical padding */}
                            {/* Back Button */}
                            <TouchableOpacity
                                className="w-10 h-10 rounded-full items-center justify-center" // Removed -ml-3, made button slightly smaller to match icons
                                onPress={() => router.back()}
                            >
                                <Ionicons name="arrow-back" size={24} color="#1F2937" />
                            </TouchableOpacity>
                            {/* Title */}
                            <View className="flex-1 items-center px-2">
                                <Text
                                    className="text-lg font-bold text-center text-gray-900"
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                >
                                    {product.title}
                                </Text>
                            </View>
                            {/* Action Buttons */}
                            <View className="flex-row">
                                {isOwner && (
                                    <>
                                        <TouchableOpacity
                                            className="w-10 h-10 rounded-full items-center justify-center bg-indigo-50"
                                            onPress={handleEditProduct}
                                        >
                                            <Ionicons
                                                name="create-outline"
                                                size={20}
                                                color="#4F46E5"
                                            />
                                        </TouchableOpacity>
                                        <View className="w-2" />
                                    </>
                                )}
                                <TouchableOpacity
                                    className="w-10 h-10 rounded-full items-center justify-center bg-gray-50"
                                    onPress={() => console.log("Share product")}
                                >
                                    <Ionicons
                                        name="share-social-outline"
                                        size={20}
                                        color="#4B5563"
                                    />
                                </TouchableOpacity>
                                <View className="w-2" />
                                <TouchableOpacity
                                    className={`w-10 h-10 rounded-full items-center justify-center ${
                                        product.is_liked ? "bg-red-50" : "bg-gray-50"
                                    }`}
                                    onPress={() => console.log("Toggle favorite")}
                                >
                                    <Ionicons 
                                        name={product.is_liked ? "heart" : "heart-outline"} 
                                        size={22} 
                                        color={product.is_liked ? "#EF4444" : "#4B5563"} 
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Main Image with Navigation */}
                    <View className="px-4 mt-5 mb-4 relative">
                        {/* Added mt-5 for consistent top spacing */}
                        <View
                            className="rounded-2xl overflow-hidden"
                            style={{ aspectRatio: 4 / 3 }}
                        >
                            {images.length > 0 ? (
                                <Image
                                    source={{
                                        uri: images[selectedImageIndex],
                                    }}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />
                            ) : (
                                <View className="w-full h-full bg-gray-200 items-center justify-center">
                                    <Ionicons name="image-outline" size={48} color="#9CA3AF" />
                                    <Text className="text-gray-500 mt-2">No image available</Text>
                                </View>
                            )}

                            {/* Navigation arrows - only show if multiple images */}
                            {images.length > 1 && (
                                <>
                                    {/* Left Arrow */}
                                    <TouchableOpacity
                                        onPress={() => {
                                            setSelectedImageIndex((prev) =>
                                                prev > 0 ? prev - 1 : images.length - 1
                                            );
                                        }}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
                                    >
                                        <View className="bg-black/50 rounded-full p-2">
                                            <Ionicons name="chevron-back" size={24} color="white" />
                                        </View>
                                    </TouchableOpacity>

                                    {/* Right Arrow */}
                                    <TouchableOpacity
                                        onPress={() => {
                                            setSelectedImageIndex((prev) =>
                                                prev < images.length - 1 ? prev + 1 : 0
                                            );
                                        }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
                                    >
                                        <View className="bg-black/50 rounded-full p-2">
                                            <Ionicons name="chevron-forward" size={24} color="white" />
                                        </View>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>

                    {/* Thumbnail Images - only show if multiple images */}
                    {images.length > 1 && (
                        <View className="flex-row gap-2 px-4 mb-6">
                            {images.map((uri, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => setSelectedImageIndex(index)}
                                    className={`w-16 h-16 rounded-lg overflow-hidden ${
                                        selectedImageIndex === index ? "border-2 border-indigo-500" : ""
                                    }`}
                                >
                                    <Image
                                        source={{ uri }}
                                        className="w-full h-full"
                                        resizeMode="cover"
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Product Title and Date */}
                    <View className="px-4 mb-6">
                        <View className="flex-row justify-between items-start">
                            <View className="flex-1 mr-4">
                                <Text className="text-xl font-semibold text-gray-900">
                                    {product.title}
                                </Text>
                                {product.status === "sold" && (
                                    <View className="mt-2">
                                        <View className="bg-red-100 px-3 py-1 rounded-full self-start">
                                            <Text className="text-red-700 font-medium text-sm">SOLD</Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                            <Text className="text-sm text-gray-500">
                                {formatDate(product.created_at)}
                            </Text>
                        </View>
                    </View>

                    {/* Product Description */}
                    <View className="px-4 mb-6">
                        <Text
                            className="text-base text-gray-700 leading-6"
                            numberOfLines={isDescriptionExpanded ? undefined : 5}
                        >
                            {description}
                        </Text>
                        {description.length > 200 && (
                            <TouchableOpacity
                                onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                className="mt-2"
                            >
                                <Text className="text-indigo-600 font-medium">
                                    {isDescriptionExpanded ? "Show less" : "Read more"}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Price and Chips */}
                    <View className="px-4 mb-4">
                        <View className="flex-row justify-between items-center">
                            <View className="flex-row items-center">
                                <Text className="text-3xl font-bold text-indigo-600">
                                    ${product.price.toLocaleString()}
                                </Text>
                                {product.is_negotiable && (
                                    <View className="ml-3 bg-green-100 px-2 py-1 rounded-full">
                                        <Text className="text-green-700 font-medium text-xs">Negotiable</Text>
                                    </View>
                                )}
                            </View>
                            <View className="flex-row justify-end items-start gap-2">
                                <View className="px-3 py-1 bg-indigo-50 rounded-full">
                                    <Text className="text-sm font-medium text-indigo-700">
                                        {product.categories?.name || "Uncategorized"}
                                    </Text>
                                </View>
                                {product.condition && (
                                    <View className="px-3 py-1 bg-gray-100 rounded-full">
                                        <Text className="text-sm font-medium text-gray-700">
                                            {product.condition}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Delivery Options */}
                    <View className="px-4 mb-4 mt-2">
                        <Text className="text-lg font-semibold text-gray-900 mb-3">
                            Delivery Options
                        </Text>
                        <View className="flex-row gap-2">
                            {product.delivery_type?.map((type, index) => (
                                <View key={index} className="flex-row items-center bg-gray-50 px-3 py-2 rounded-lg">
                                    <Ionicons
                                        name={type === "Pickup" ? "location" : "send"}
                                        size={16}
                                        color="#6B7280"
                                        style={{ marginRight: 6 }}
                                    />
                                    <Text className="text-gray-700 font-medium">{type}</Text>
                                </View>
                            ))}
                        </View>
                        {product.address && product.delivery_type?.includes("Pickup") && (
                            <View className="mt-3 flex-row items-start">
                                <Ionicons
                                    name="location-outline"
                                    size={18}
                                    color="#6B7280"
                                    style={{ marginTop: 2, marginRight: 6 }}
                                />
                                <Text className="text-base text-gray-600 leading-5 flex-1">
                                    {product.address}
                                </Text>
                            </View>
                        )}
                    </View>


                </ScreenWrapper>
            </ScrollView>

            {/* Fixed Seller Info Section */}
            <View className="absolute bottom-0 left-0 right-0 bg-white pt-3 px-5 border-t border-gray-100 shadow-lg">
                {/* Removed pb-8 */}
                <SafeAreaView className="pb-4">
                    <View className="flex-row items-center gap-2">
                        {/* Seller Image */}
                        <View className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm">
                            <Image
                                source={{
                                    uri: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=96&h=96&fit=crop",
                                }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        </View>

                        {/* Seller Details */}
                        <View className="flex-1">
                            <Text className="text-lg font-semibold text-gray-900">
                                {product.seller_username || "Unknown Seller"}
                            </Text>
                            <View className="flex-row items-center gap-2 mt-0.5">
                                <View className="flex-row items-center">
                                    <Ionicons
                                        name="star"
                                        size={12}
                                        color="#F59E0B"
                                        style={{ marginRight: 2 }}
                                    />
                                    <Text className="text-xs font-medium text-gray-600">4.9</Text>
                                    <Text className="text-xs text-gray-400">(125)</Text>
                                </View>
                                <View className="h-2.5 w-px bg-gray-200 mx-1" />
                                <View className="flex-row items-center">
                                    <Ionicons
                                        name="grid-outline"
                                        size={12}
                                        color="#6B7280"
                                        style={{ marginRight: 2 }}
                                    />
                                    <Text className="text-xs text-gray-500">150</Text>
                                </View>
                            </View>
                        </View>

                        {/* Contact Button */}
                        {!isOwner && (
                            <TouchableOpacity
                                className={`px-7 py-4 rounded-full shadow-md active:opacity-90 ${
                                    isSignedIn
                                        ? "bg-indigo-600"
                                        : "bg-indigo-50 border border-indigo-200"
                                } ${product.status === "sold" ? "opacity-50" : ""}`}
                                activeOpacity={0.85}
                                onPress={handleContactSeller}
                                disabled={product.status === "sold"}
                            >
                                <Text
                                    className={`font-semibold text-base ${
                                        isSignedIn ? "text-white" : "text-indigo-600"
                                    }`}
                                >
                                    {product.status === "sold" 
                                        ? "Sold" 
                                        : isSignedIn 
                                        ? "Contact Seller" 
                                        : "Sign in to message"
                                    }
                                </Text>
                            </TouchableOpacity>
                        )}
                        {isOwner && (
                            <TouchableOpacity
                                className="px-7 py-4 rounded-full shadow-md active:opacity-90 bg-indigo-600"
                                activeOpacity={0.85}
                                onPress={handleEditProduct}
                            >
                                <Text className="font-semibold text-base text-white">
                                    Edit Listing
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </SafeAreaView>
            </View>
        </View>
    );
}