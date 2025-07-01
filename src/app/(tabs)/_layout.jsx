import { StatusBar } from "expo-status-bar";
import { View} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "@clerk/clerk-expo";

import CustomTabBar from "@/components/CustomTabBar";

import Home from "./index";
import Saved from "./saved";
import Create from "./create";
import Messages from "./messages";
import Profile from "./profile";

// Set up the tab navigator
const Tab = createBottomTabNavigator();

export default function App() {
  const { isSignedIn, isLoaded } = useAuth();

  // If not signed in, redirect to login
  if (!isSignedIn) {
    return <Home />;
  }

  return (
    <>
      <StatusBar style="auto" />
      <View className="flex-1 bg-white">
        <Tab.Navigator
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{
            headerShown: false,
          }}
        >
          <Tab.Screen name="Home" component={Home} />
          <Tab.Screen name="Saved" component={Saved} />
          <Tab.Screen name="Create" component={Create} />
          <Tab.Screen name="Messages" component={Messages} />
          <Tab.Screen name="Profile" component={Profile} />
        </Tab.Navigator>
      </View>
    </>
  );
}
