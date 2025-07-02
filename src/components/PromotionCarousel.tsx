import React, { useState, useRef } from "react";
import { View, FlatList, Dimensions, TouchableOpacity } from "react-native";
import PromotionBannerCard from "@/components/PromotionBannerCard";

const { width: screenWidth } = Dimensions.get("window");
const CARD_PADDING = 16; // Padding between cards
const CARD_MARGIN = 8; // Margin for each card
const ITEM_WIDTH = screenWidth - CARD_PADDING * 2; // Full width minus padding

interface FeaturedSeller {
    id: string;
    sellerName: string;
    tagline: string;
    showcaseImageUrl: any; // Or a more specific image source type
    buttonText?: string;
    onPressVisit: () => void;
}

interface PromotionCarouselProps {
    featuredSellers: FeaturedSeller[];
}

const PromotionCarousel: React.FC<PromotionCarouselProps> = ({ featuredSellers }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef(null);

    const handleScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / ITEM_WIDTH);
        if (index !== activeIndex) {
            setActiveIndex(index);
        }
    };

    const Pagination = () => (
        <View className="flex-row items-center">
            {featuredSellers.map((_, i) => (
                <TouchableOpacity
                    key={i}
                    className={`rounded-full mx-1 ${i === activeIndex
                            ? "w-6 h-2 bg-white scale-100"
                            : "w-2 h-2 bg-white/50"
                        }`}
                    onPress={() => {
                        flatListRef.current?.scrollToIndex({
                            animated: true,
                            index: i,
                            viewPosition: 1,
                        });
                        setActiveIndex(i);
                    }}
                />
            ))}
        </View>
    );

    const renderItem = ({ item }) => (
        <View style={{ width: ITEM_WIDTH, paddingHorizontal: 2 }}>
            <PromotionBannerCard
                title={item.sellerName}
                description={item.tagline}
                imageUrl={item.showcaseImageUrl}
                buttonText={item.buttonText || "Visit"}
                onPress={item.onPressVisit}
            />
        </View>
    );

    if (!featuredSellers || featuredSellers.length === 0) {
        // You might want to hide this section entirely if there are no featured sellers
        return null;
    }

    return (
        <View className="py-2">
            <View className="relative">
                <FlatList
                    ref={flatListRef}
                    data={featuredSellers}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    decelerationRate="fast"
                    snapToInterval={ITEM_WIDTH}
                    snapToAlignment="center"
                    getItemLayout={(data, index) => ({
                        length: ITEM_WIDTH,
                        offset: ITEM_WIDTH * index,
                        index,
                    })}
                    contentContainerStyle={{}}
                />
                <View className="absolute bottom-0 left-0 right-0 items-center pb-2">
                    <Pagination />
                </View>
            </View>
        </View>
    );
};

export default PromotionCarousel;