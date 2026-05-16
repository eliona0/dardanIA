import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "./screens/HomeScreen";
import AccessibilityScreen from "./screens/AccessibilityScreen";
import DashboardScreen from "./screens/DashboardScreen";
import CaseDetailsScreen from "./screens/CaseDetailsScreen";
import MapScreen from "./screens/MapScreen";
import GuideScreen from "../app/guide";
import ReportProblemScreen from "../app/report";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={({ navigation, route }) => ({
          headerBackVisible: false,
          headerLeft:
            route.name === "Home"
              ? undefined
              : () => (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => navigation.reset({ index: 0, routes: [{ name: "Home" }] })}
                    style={{ paddingHorizontal: 4, paddingVertical: 6 }}
                  >
                    <Ionicons color="#264653" name="home-outline" size={24} />
                  </Pressable>
                ),
        })}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: "dardanIA" }} />
        <Stack.Screen name="Report" component={ReportProblemScreen} options={{ title: "Raporto problem" }} />
        <Stack.Screen name="Guide" component={GuideScreen} options={{ title: "Ku me shku?" }} />
        <Stack.Screen name="Accessibility" component={AccessibilityScreen} options={{ title: "Kontrollo qasjen" }} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Paneli" }} />
        <Stack.Screen name="Map" component={MapScreen} options={{ title: "Harta" }} />
        <Stack.Screen name="Case" component={CaseDetailsScreen} options={{ title: "Detajet e rastit" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
