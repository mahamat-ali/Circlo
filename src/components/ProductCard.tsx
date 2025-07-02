// ProductCard.js
import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

interface ProductCardProps {
    id: string;
    image: any; // Or a more specific image source type
    title: string;
    price: number;
    condition: string;
    location: string;
    sellerName: string;
    sellerRating?: number;
    isLiked: boolean;
    onLikePress: () => void;
    cardWidth: number;
}

const ProductCard: React.FC<ProductCardProps> = ({
    id,
    image,
    title,
    price,
    condition,
    location,
    sellerName,
    sellerRating,
    isLiked,
    onLikePress,
    cardWidth, // Accept cardWidth as a prop
}) => {
    const router = useRouter();

    return (
        <TouchableOpacity
            className="bg-white rounded-xl shadow-sm overflow-hidden border  border-gray-100 "
            style={{ width: cardWidth }} // Use the passed cardWidth
            onPress={() => router.push(`/product/${id}`)}
            activeOpacity={0.9}
        >
            {/* Product Image with Like Button */}
            <View className="relative w-full" style={{ height: 150 }}>
                <Image source={image} className="w-full h-full" resizeMode="cover" />
                <TouchableOpacity
                    className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 z-10"
                    onPress={onLikePress}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons
                        name={isLiked ? "heart" : "heart-outline"}
                        size={22}
                        color={isLiked ? "#FF3B30" : "#000"}
                    />
                </TouchableOpacity>
            </View>

            {/* Product Details */}
            <View className="p-3 flex-1">
                {/* Title */}
                <Text
                    className="text-sm font-semibold mb-2 text-gray-900 leading-[18px]"
                    numberOfLines={1}
                >
                    {title}
                </Text>

                {/* Price */}
                <Text className="text-base font-bold text-primary mb-2">
                    ${price.toLocaleString()}
                </Text>

                {/* Condition and Location */}
                <View className="flex-row items-center mb-3  overflow-hidden">
                    <View className="bg-gray-100 rounded-full px-2 py-0.5">
                        <Text className="text-xs text-gray-600" numberOfLines={2}>
                            {condition}
                        </Text>
                    </View>
                    <View className="flex-row items-center flex-1 ml-2">
                        <Feather name="map-pin" size={12} color="#6b7280" />
                        <Text
                            className="text-xs text-gray-600 ml-0.5 flex-1"
                            numberOfLines={1}
                        >
                            {location}
                        </Text>
                    </View>
                </View>

                {/* Seller Information - Fixed height container */}
                <View className="h-5 flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1 mr-2">
                        <Ionicons name="person-outline" size={12} color="#666" />
                        <Text className="text-xs text-gray-600 ml-0.5" numberOfLines={1}>
                            {sellerName}
                        </Text>
                    </View>
                    {sellerRating && (
                        <View className="flex-row items-center">
                            <Ionicons name="star" size={12} color="#FFD700" />
                            <Text className="text-xs text-gray-600 ml-0.5">
                                {sellerRating}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default ProductCard;