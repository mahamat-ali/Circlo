import React, { memo } from "react";
import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

interface FilterOptionsProps {
    selectedFilter: string | null;
    onSelectFilter: (filter: string | null) => void;
    isVisible: boolean;
    onClose: () => void;
}

const FilterOptions = memo(
    ({ selectedFilter, onSelectFilter, isVisible, onClose }: FilterOptionsProps) => {
        const filters = [
            { id: "price_high", label: "Price: High to Low", icon: "arrow-down" },
            { id: "price_low", label: "Price: Low to High", icon: "arrow-up" },
            { id: "date_new", label: "Newest First", icon: "clock" },
            { id: "date_old", label: "Oldest First", icon: "clock" },
        ];

        return (
            <Modal
                visible={isVisible}
                transparent
                animationType="slide"
                onRequestClose={onClose}
            >
                <Pressable onPress={onClose} className="flex-1 bg-black/50 justify-end">
                    <Pressable
                        className="bg-white rounded-t-3xl"
                        style={{
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: -4 },
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            elevation: 5,
                        }}
                    >
                        {/* Handle Bar */}
                        <View className="w-12 h-1 bg-gray-300 rounded-full self-center my-3" />

                        {/* Content */}
                        <View className="px-4 pb-8">
                            {/* Header */}
                            <View className="flex-row items-center justify-between mb-6">
                                <Text className="text-xl font-semibold text-gray-800">
                                    Filter by
                                </Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        onSelectFilter(null);
                                        onClose();
                                    }}
                                    className="flex-row items-center"
                                >
                                    <Feather name="refresh-cw" size={18} color="#6b7280" />
                                    <Text className="text-gray-600 ml-1.5 text-base">Reset</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Filter Options */}
                            <View className="flex-row flex-wrap">
                                {filters.map((filter) => (
                                    <TouchableOpacity
                                        key={filter.id}
                                        onPress={() => {
                                            onSelectFilter(filter.id);
                                            onClose();
                                        }}
                                        className={`mr-3 mb-3 px-4 py-2.5 rounded-full border ${selectedFilter === filter.id
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-gray-200 bg-white"
                                            }`}
                                    >
                                        <View className="flex-row items-center">
                                            <Feather
                                                name={filter.icon}
                                                size={18}
                                                color={
                                                    selectedFilter === filter.id ? "#3b82f6" : "#6b7280"
                                                }
                                            />
                                            <Text
                                                className={`ml-2 text-base ${selectedFilter === filter.id
                                                        ? "text-blue-600"
                                                        : "text-gray-600"
                                                    }`}
                                            >
                                                {filter.label}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        );
    }
);

FilterOptions.displayName = "FilterOptions";

export default FilterOptions;