import { View, Text, Button } from "react-native";

export default function HomeScreen({ navigation }) {
  return (
    <View style={{ padding: 20 }}>
      <Text>QasjaAI</Text>

      <Button
        title="Report Problem"
        onPress={() => navigation.navigate("Report")}
      />

      <Button
        title="Accessibility Check"
        onPress={() => navigation.navigate("Accessibility")}
      />

      <Button
        title="KuMeShku"
        onPress={() => navigation.navigate("Guide")}
      />

      <Button
        title="Dashboard"
        onPress={() => navigation.navigate("Dashboard")}
      />
    </View>
  );
}
