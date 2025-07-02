import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";

interface PromotionBannerCardProps {
    title: string;
    description?: string;
    imageUrl: any; // Or a more specific image source type
    buttonText?: string;
    onPress: () => void;
}

const PromotionBannerCard: React.FC<PromotionBannerCardProps> = ({
    title,
    description,
    imageUrl,
    buttonText = "Visit",
    onPress,
}) => {
    return (
        <View
            className="rounded-2xl overflow-hidden shadow-lg"
            style={{ aspectRatio: 2.5 / 1 }}
        >
            {/* Background Image */}
            <Image
                source={imageUrl}
                className="absolute w-full h-full"
                resizeMode="cover"
            />

            {/* Content Container */}
            <View className="flex-1 p-4 justify-between bg-black/40">
                {/* Title at top */}
                <Text className="text-white text-2xl font-bold text-left">{title}</Text>

                {/* Description in center */}
                {description && (
                    <Text className="text-white text-base text-left">{description}</Text>
                )}

                {/* Button */}
                <TouchableOpacity
                    onPress={onPress}
                    className="bg-white px-6 py-2 rounded-full self-start"
                >
                    <Text className="text-gray-900 font-semibold">{buttonText}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default PromotionBannerCard;