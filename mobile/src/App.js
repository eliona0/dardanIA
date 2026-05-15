import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "./screens/HomeScreen";
import AccessibilityScreen from "./screens/AccessibilityScreen";
import DashboardScreen from "./screens/DashboardScreen";
import GuideScreen from "../app/guide";
import ReportProblemScreen from "../app/report";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Report" component={ReportProblemScreen} options={{ title: "Report Problem" }} />
        <Stack.Screen name="Guide" component={GuideScreen} options={{ title: "KuMeShku" }} />
        <Stack.Screen name="Accessibility" component={AccessibilityScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
