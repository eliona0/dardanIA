import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import BottomNav from "../../components/BottomNav";
import MapViewComponent from "../../components/MapViewComponent";
import { mockCases } from "../../components/mockCases";

const routeToScreen = {
  "/": "Home",
  "/accessibility": "Accessibility",
  "/dashboard": "Dashboard",
  "/report": "Report",
};

export default function MapScreen({ navigation }) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Harta e rasteve</Text>
        <Text style={styles.subtitle}>Shiko raportimet rreth Prishtinës.</Text>
      </View>

      <View style={styles.mapCard}>
        <MapViewComponent
          cases={mockCases}
          height={560}
          onCasePress={(caseItem) => {
            if (navigation) {
              navigation.navigate("Case", { id: caseItem.id });
              return;
            }

            router.push(`/case/${caseItem.id}`);
          }}
          onMarkerPress={(caseItem) => {
            if (navigation) {
              navigation.navigate("Case", { id: caseItem.id });
              return;
            }

            router.push(`/case/${caseItem.id}`);
          }}
        />
      </View>

      <BottomNav
        activeTab="Home"
        onNavigate={(path) => navigation.navigate(routeToScreen[path] || "Home")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#F2F5EA",
    flex: 1,
    padding: 18,
    paddingBottom: 106,
  },
  header: {
    marginBottom: 14,
  },
  title: {
    color: "#2F2D2E",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0,
  },
  subtitle: {
    color: "#6A97B2",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    marginTop: 4,
  },
  mapCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8E1D0",
    borderRadius: 22,
    borderWidth: 1,
    elevation: 3,
    overflow: "hidden",
    padding: 8,
    shadowColor: "#2F2D2E",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
  },
});
