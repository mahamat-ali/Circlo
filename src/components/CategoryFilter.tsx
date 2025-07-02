import React, { memo } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";

interface CategoryFilterProps {
    categories: string[];
    selectedCategory: string | null;
    onSelectCategory: (category: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, selectedCategory, onSelectCategory }) => {
    return (
        <View className="mb-4">
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                    paddingRight: 16,
                }}
            >
                {categories.map((category) => (
                    <TouchableOpacity
                        key={category}
                        onPress={() => onSelectCategory(category)}
                        className={`mr-2 px-4 py-1 rounded-full border border-gray-200 ${selectedCategory === category
                                ? "bg-primary border-primary"
                                : "bg-gray-100"
                            }`}
                    >
                        <Text
                            className={`text-sm font-medium ${selectedCategory === category ? "text-white" : "text-gray-600"
                                }`}
                        >
                            {category}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

CategoryFilter.displayName = "CategoryFilter";

export default memo(CategoryFilter);