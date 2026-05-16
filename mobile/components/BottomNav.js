import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const tabs = [
  { icon: "home", key: "Home", label: "Ballina", route: "/" },
  { icon: "camera-outline", key: "Report", label: "Raporto", route: "/report" },
  { icon: "accessibility-outline", key: "Accessibility", label: "Qasja", route: "/accessibility" },
  { icon: "bar-chart-outline", key: "Dashboard", label: "Paneli", route: "/dashboard" },
];

export default function BottomNav({ activeTab, onNavigate }) {
  const navigate = (route) => {
    if (onNavigate) {
      onNavigate(route);
      return;
    }

    router.push(route);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.nav}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;

          return (
            <Pressable
              accessibilityRole="button"
              key={tab.label}
              onPress={() => navigate(tab.route)}
              style={styles.item}
            >
              <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                <Ionicons
                  color={isActive ? "#FFFFFF" : "#6A97B2"}
                  name={tab.icon}
                  size={20}
                />
              </View>
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    bottom: 0,
    left: 0,
    paddingBottom: 14,
    paddingHorizontal: 16,
    position: "absolute",
    right: 0,
  },
  nav: {
    backgroundColor: "#FFFFFF",
    borderColor: "#C6D6DE",
    borderRadius: 24,
    borderWidth: 1,
    elevation: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 9,
    shadowColor: "#2F2D2E",
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
  },
  item: {
    alignItems: "center",
    flex: 1,
    gap: 4,
  },
  iconWrap: {
    alignItems: "center",
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 42,
  },
  iconWrapActive: {
    backgroundColor: "#356F94",
  },
  label: {
    color: "#6A97B2",
    fontSize: 11,
    fontWeight: "800",
  },
  labelActive: {
    color: "#356F94",
  },
});
