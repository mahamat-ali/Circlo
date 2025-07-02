import React from "react"; // React is implicitly used by JSX, good practice to import
import { View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScreenWrapperProps {
    top?: boolean;
    bottom?: boolean;
    style?: ViewStyle;
    children: React.ReactNode;
}

const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
    top = true,
    bottom = false,
    style,
    children,
    ...props
}) => {
    const insets = useSafeAreaInsets();

    // Base styles for the wrapper, ensuring it fills the screen
    const wrapperStyle = [
        {
            flex: 1,
            margin: 0,
            paddingTop: top && insets.top,
            paddingBottom: bottom && insets.bottom,
        },
        style, // Apply any custom styles passed via the 'style' prop last
    ];

    return (
        <View style={[
            {
                flex: 1,
                margin: 0,
                paddingTop: top ? insets.top : 0,
                paddingBottom: bottom ? insets.bottom : 0,
            },
            style
        ]} {...props}>
            {children}
        </View>
    );
};

export default ScreenWrapper;