import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function ActionCard({
  color,
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
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${color}18` }]}>
        <Icon color={color} name={icon} size={25} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <View style={[styles.cta, { backgroundColor: color }]}>
        <Text style={styles.ctaText}>Open</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DDEAE7",
    borderRadius: 22,
    borderWidth: 1,
    elevation: 3,
    minHeight: 154,
    padding: 14,
    shadowColor: "#1F2933",
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    width: "48%",
  },
  cardPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.98 }],
  },
  iconWrap: {
    alignItems: "center",
    borderRadius: 17,
    height: 48,
    justifyContent: "center",
    marginBottom: 14,
    width: 48,
  },
  title: {
    color: "#264653",
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 21,
  },
  cta: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    justifyContent: "center",
    marginTop: 10,
    minHeight: 32,
    paddingHorizontal: 14,
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
});
