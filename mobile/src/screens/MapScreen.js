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

const prishtinaRegion = {
  latitude: 42.6629,
  latitudeDelta: 0.045,
  longitude: 21.1655,
  longitudeDelta: 0.045,
};

export default function MapScreen({ navigation }) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Case Map</Text>
        <Text style={styles.subtitle}>Zoom in to inspect reports around Prishtina.</Text>
      </View>

      <View style={styles.mapCard}>
        <MapViewComponent
          cases={mockCases}
          height={560}
          onMarkerPress={(caseItem) => {
            if (navigation) {
              navigation.navigate("Case", { id: caseItem.id });
              return;
            }

            router.push(`/case/${caseItem.id}`);
          }}
          region={prishtinaRegion}
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
    backgroundColor: "#FFFFFF",
    flex: 1,
    padding: 18,
    paddingBottom: 106,
  },
  header: {
    marginBottom: 14,
  },
  title: {
    color: "#111827",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0,
  },
  subtitle: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    marginTop: 4,
  },
  mapCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EEF2F7",
    borderRadius: 22,
    borderWidth: 1,
    elevation: 3,
    overflow: "hidden",
    padding: 8,
    shadowColor: "#0F172A",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
  },
});
