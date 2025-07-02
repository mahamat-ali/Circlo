import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import ScreenWrapper from "./ScreenWrapper";

interface User {
    avatar?: string;
    firstName?: string;
}

interface HeaderProps {
    hasNotifications: boolean;
    onNotificationPress: () => void;
    user: User | null;
    onSignInPress: () => void;
}

const Header: React.FC<HeaderProps> = ({
    hasNotifications,
    onNotificationPress,
    user,
    onSignInPress,
}) => {
    return (
        <ScreenWrapper className="mb-3">
            <View className="flex-row justify-between items-center py-3">
                {/* User Info with Avatar */}
                <View className="flex-row items-center">
                    <View className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden mr-2">
                        {user?.avatar ? (
                            <Image
                                source={{ uri: user.avatar }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <View className="w-full h-full items-center justify-center bg-gray-200">
                                <Feather name="user" size={20} color="#9ca3af" />
                            </View>
                        )}
                    </View>
                    <View>
                        <Text className="text-sm text-gray-500 font-medium">Welcome,</Text>
                        <Text className="text-base text-gray-800 font-semibold">
                            {user ? user.firstName : "Guest"}
                        </Text>
                    </View>
                </View>

                {/* App Logo and Name - Centered */}
                <View className="absolute left-0 right-0 items-center pointer-events-none">
                    <View className="flex-row items-center">
                        <Feather name="shopping-cart" size={30} color="#3b82f6" />
                        <Text className="text-3xl font-bold text-gray-800 ml-2">Lizza</Text>
                    </View>
                </View>

                {/* Notification Bell */}
                <TouchableOpacity
                    onPress={onNotificationPress}
                    className="relative p-2 -mr-1.5"
                >
                    <Feather
                        name="bell"
                        size={26}
                        color={hasNotifications ? "#1f2937" : "#9ca3af"}
                    />
                    {hasNotifications && (
                        <View className="absolute top-0.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
                    )}
                </TouchableOpacity>
            </View>
        </ScreenWrapper>
    );
};

export default Header;