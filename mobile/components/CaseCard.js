import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const severityStyles = {
  high: { background: "#FEE2E2", color: "#EF4444", label: "High" },
  medium: { background: "#FFEDD5", color: "#F97316", label: "Medium" },
  low: { background: "#DCFCE7", color: "#16A34A", label: "Low" },
};

export default function CaseCard({ category, icon, onPress, severity, title }) {
  const severityStyle = severityStyles[severity] || severityStyles.low;
  const content = (
    <>
      <View style={styles.iconWrap}>
        <Ionicons color="#4F46E5" name={icon} size={20} />
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        <Text style={styles.category}>{category}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: severityStyle.background }]}>
        <Text style={[styles.badgeText, { color: severityStyle.color }]}>
          {severityStyle.label}
        </Text>
      </View>
    </>
  );

  if (!onPress) {
    return <View style={styles.card}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E7EAF2",
    borderRadius: 20,
    borderWidth: 1,
    elevation: 2,
    flexDirection: "row",
    gap: 12,
    padding: 13,
    shadowColor: "#0F172A",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
  },
  cardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderRadius: 15,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  copy: {
    flex: 1,
  },
  title: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "900",
  },
  category: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "900",
  },
});
