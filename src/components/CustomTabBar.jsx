import { View, TouchableOpacity, SafeAreaView, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";

const screenWidth = Dimensions.get("window").width;
const HORIZONTAL_MARGIN = 16; // Fixed margin to match content

function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <SafeAreaView className="absolute bottom-0 left-0 right-0">
      <View
        intensity={80}
        tint="light"
        className="flex-row justify-between items-center bg-white rounded-full py-4 px-6 border border-gray-200 shadow-sm"
        style={{
          marginHorizontal: HORIZONTAL_MARGIN,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 5,
        }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const isCreate = route.name === "Create";

          // Define icon based on route name
          let iconName;
          switch (route.name) {
            case "Home":
              iconName = "home";
              break;
            case "Saved":
              iconName = "bookmark";
              break;
            case "Create":
              iconName = "plus";
              break;
            case "Messages":
              iconName = "message-circle";
              break;
            case "Profile":
              iconName = "user";
              break;
            default:
              iconName = "circle";
          }

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              className={`items-center justify-center w-12 h-12 rounded-full`}
              style={{
                backgroundColor: isFocused ? "#4f46e5" : "transparent"
              }}
            >
              <Feather
                name={iconName}
                size={26}
                color={isFocused ? "white" : "#9ca3af"}
              />


            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default CustomTabBar;
