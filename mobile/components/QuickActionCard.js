import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function QuickActionCard({
  color = "#264653",
  icon,
  iconFamily,
  onPress,
  title,
}) {
  const Icon = iconFamily === "MaterialCommunityIcons" ? MaterialCommunityIcons : Ionicons;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${color}16` }]}>
        <Icon color={color} name={icon} size={24} />
      </View>
      <Text style={styles.title}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DDEAE7",
    borderRadius: 18,
    borderWidth: 1,
    elevation: 2,
    minHeight: 124,
    padding: 16,
    shadowColor: "#1F2933",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    width: "48%",
  },
  cardPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
  iconWrap: {
    alignItems: "center",
    borderRadius: 15,
    height: 46,
    justifyContent: "center",
    marginBottom: 14,
    width: 46,
  },
  title: {
    color: "#264653",
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 21,
  },
});
