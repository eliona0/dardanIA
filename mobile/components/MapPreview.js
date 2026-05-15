import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function MapPreview({ markers }) {
  return (
    <View style={styles.mapFallback}>
      <View style={styles.mapGridLineHorizontal} />
      <View style={styles.mapGridLineVertical} />
      {markers.map((marker, index) => (
        <View
          key={marker.title}
          style={[
            styles.fakeMarker,
            {
              backgroundColor: marker.color,
              left: `${24 + index * 25}%`,
              top: `${34 + (index % 2) * 22}%`,
            },
          ]}
        />
      ))}
      <View style={styles.mapFallbackLabel}>
        <Ionicons color="#4F46E5" name="location" size={15} />
        <Text style={styles.mapFallbackText}>Prishtina live case map</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapFallback: {
    backgroundColor: "#E0F2FE",
    borderRadius: 20,
    height: 190,
    overflow: "hidden",
  },
  mapGridLineHorizontal: {
    backgroundColor: "rgba(79,70,229,0.12)",
    height: 22,
    left: -20,
    position: "absolute",
    right: -20,
    top: 88,
    transform: [{ rotate: "-14deg" }],
  },
  mapGridLineVertical: {
    backgroundColor: "rgba(34,197,94,0.16)",
    bottom: -20,
    position: "absolute",
    right: 92,
    top: -20,
    transform: [{ rotate: "24deg" }],
    width: 20,
  },
  fakeMarker: {
    borderColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 3,
    height: 22,
    position: "absolute",
    width: 22,
  },
  mapFallbackLabel: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    bottom: 14,
    flexDirection: "row",
    gap: 6,
    left: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: "absolute",
  },
  mapFallbackText: {
    color: "#1E293B",
    fontSize: 12,
    fontWeight: "900",
  },
});
