import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { Pressable } from "react-native";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={({ route }) => ({
        headerBackVisible: false,
        headerLeft:
          route.name === "index"
            ? undefined
            : () => (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.replace("/")}
                  style={{ paddingHorizontal: 4, paddingVertical: 6 }}
                >
                  <Ionicons color="#264653" name="home-outline" size={24} />
                </Pressable>
              ),
      })}
    />
  );
}
