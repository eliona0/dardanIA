import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

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
      <Stack.Navigator>
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
