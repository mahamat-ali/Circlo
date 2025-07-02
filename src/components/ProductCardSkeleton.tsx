// ProductCardSkeleton.js
import React, { useEffect } from "react";
import { View, Animated } from "react-native";
import { createShimmerPlaceholder } from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

interface ProductCardSkeletonProps {
    cardWidth: number;
}

const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({ cardWidth }) => {
    // Create refs for each shimmer element
    const imageRef = React.createRef();
    const likeButtonRef = React.createRef();
    const titleRef = React.createRef();
    const priceRef = React.createRef();
    const conditionRef = React.createRef();
    const locationRef = React.createRef();
    const sellerRef = React.createRef();
    const ratingRef = React.createRef();

    useEffect(() => {
        const shimmerAnimation = Animated.stagger(400, [
            // First animate the image and like button
            Animated.parallel([
                imageRef.current.getAnimated(),
                likeButtonRef.current.getAnimated(),
            ]),
            // Then animate the content
            Animated.parallel([
                titleRef.current.getAnimated(),
                priceRef.current.getAnimated(),
                conditionRef.current.getAnimated(),
                locationRef.current.getAnimated(),
                sellerRef.current.getAnimated(),
                ratingRef.current.getAnimated(),
            ]),
        ]);

        Animated.loop(shimmerAnimation).start();
    }, []);

    const shimmerColors = ["#f0f0f0", "#e0e0e0", "#f0f0f0"];

    return (
        <View
            className="bg-white rounded-xl shadow-sm overflow-hidden mb-4"
            style={{ width: cardWidth }}
        >
            {/* Image Skeleton */}
            <View className="relative w-full" style={{ height: 160 }}>
                <ShimmerPlaceholder
                    ref={imageRef}
                    style={{ width: "100%", height: "100%" }}
                    shimmerColors={shimmerColors}
                    stopAutoRun={false}
                />
                {/* Like Button Skeleton */}
                <View className="absolute top-2 right-2">
                    <ShimmerPlaceholder
                        ref={likeButtonRef}
                        style={{ width: 32, height: 32, borderRadius: 16 }}
                        shimmerColors={shimmerColors}
                        stopAutoRun={false}
                    />
                </View>
            </View>

            {/* Content Skeleton */}
            <View className="p-3 flex-1">
                {/* Title Skeleton - Longer for Nigerian product titles */}
                <ShimmerPlaceholder
                    ref={titleRef}
                    style={{
                        height: 16,
                        width: "100%",
                        borderRadius: 4,
                        marginBottom: 8,
                    }}
                    shimmerColors={shimmerColors}
                    stopAutoRun={false}
                />

                {/* Price Skeleton - Wider for Nigerian prices */}
                <ShimmerPlaceholder
                    ref={priceRef}
                    style={{ height: 20, width: "50%", borderRadius: 4, marginBottom: 8 }}
                    shimmerColors={shimmerColors}
                    stopAutoRun={false}
                />

                {/* Condition and Location Skeleton */}
                <View className="flex-row items-center mb-3">
                    {/* Condition Badge */}
                    <ShimmerPlaceholder
                        ref={conditionRef}
                        style={{ height: 20, width: 80, borderRadius: 10 }}
                        shimmerColors={shimmerColors}
                        stopAutoRun={false}
                    />
                    {/* Location with Icon */}
                    <View className="flex-row items-center ml-3">
                        <ShimmerPlaceholder
                            ref={locationRef}
                            style={{ width: 12, height: 12, borderRadius: 6 }}
                            shimmerColors={shimmerColors}
                            stopAutoRun={false}
                        />
                        <ShimmerPlaceholder
                            style={{ height: 12, width: 96, borderRadius: 4, marginLeft: 4 }}
                            shimmerColors={shimmerColors}
                            stopAutoRun={false}
                        />
                    </View>
                </View>

                {/* Seller Information Skeleton */}
                <View className="h-5 flex-row items-center justify-between">
                    {/* Seller Name */}
                    <View className="flex-row items-center flex-1 mr-2">
                        <ShimmerPlaceholder
                            ref={sellerRef}
                            style={{ width: 12, height: 12, borderRadius: 6 }}
                            shimmerColors={shimmerColors}
                            stopAutoRun={false}
                        />
                        <ShimmerPlaceholder
                            style={{ height: 12, width: 112, borderRadius: 4, marginLeft: 4 }}
                            shimmerColors={shimmerColors}
                            stopAutoRun={false}
                        />
                    </View>
                    {/* Rating - Optional */}
                    <View className="flex-row items-center">
                        <ShimmerPlaceholder
                            ref={ratingRef}
                            style={{ width: 12, height: 12, borderRadius: 6 }}
                            shimmerColors={shimmerColors}
                            stopAutoRun={false}
                        />
                        <ShimmerPlaceholder
                            style={{ height: 12, width: 32, borderRadius: 4, marginLeft: 4 }}
                            shimmerColors={shimmerColors}
                            stopAutoRun={false}
                        />
                    </View>
                </View>
            </View>
        </View>
    );
};

export default ProductCardSkeleton;