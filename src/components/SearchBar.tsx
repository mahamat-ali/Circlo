import React, { memo } from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    onClear: () => void;
    onFilterPress: () => void;
    hasActiveFilter: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
    value,
    onChangeText,
    onClear,
    onFilterPress,
    hasActiveFilter,
}) => {
    return (
        <View className="mb-3 flex-row items-center">
            <View className="flex-1 flex-row items-center bg-gray-200 rounded-full py-3">
                <Feather
                    name="search"
                    size={24}
                    color="#9ca3af"
                    style={{ marginLeft: 14 }}
                />
                <TextInput
                    className="flex-1  text-gray-600"
                    placeholder="Search products..."
                    placeholderTextColor="#9ca3af"
                    value={value}
                    onChangeText={onChangeText}
                    style={{ marginHorizontal: 12, fontSize: 16 }}
                />
                {value ? (
                    <TouchableOpacity onPress={onClear} style={{ marginRight: 16 }}>
                        <Feather name="x" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                ) : null}
            </View>
            <TouchableOpacity
                onPress={onFilterPress}
                className={`p-3.5 rounded-full ${hasActiveFilter ? "bg-primary" : "bg-gray-200"
                    }`}
                style={{ marginLeft: 4 }}
            >
                <Feather
                    name="sliders"
                    size={20}
                    color={hasActiveFilter ? "white" : "#9ca3af"}
                />
            </TouchableOpacity>
        </View>
    );
};

SearchBar.displayName = "SearchBar";

export default memo(SearchBar);