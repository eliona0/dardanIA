import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function MapViewComponent({
  cases,
  height = 210,
  onCasePress,
  onMarkerPress,
  showControls = true,
}) {
  const [selectedCase, setSelectedCase] = useState(null);
  const [zoom, setZoom] = useState(1);
  const handleMarkerPress = onMarkerPress || onCasePress;

  return (
    <View style={[styles.mapFallback, { height }]}>
      <View style={styles.mapGridLineHorizontal} />
      <View style={styles.mapGridLineVertical} />

      {cases.map((caseItem, index) => (
        <Pressable
          accessibilityRole="button"
          key={caseItem.id}
          onPress={() => setSelectedCase(caseItem)}
          style={[
            styles.fakeMarker,
            {
              backgroundColor: markerColor(caseItem.severity),
              left: `${24 + index * 25}%`,
              top: `${34 + (index % 2) * 22}%`,
            },
          ]}
        />
      ))}

      {selectedCase && (
        <Pressable
          accessibilityRole="button"
          onPress={() => handleMarkerPress?.(selectedCase)}
          style={styles.callout}
        >
          <Text style={styles.calloutTitle}>{selectedCase.title}</Text>
          <Text style={styles.calloutMeta}>{selectedCase.category}</Text>
          <Text style={[styles.calloutSeverity, { color: markerColor(selectedCase.severity) }]}>
            {selectedCase.severity.toUpperCase()}
          </Text>
        </Pressable>
      )}

      <View style={styles.mapFallbackLabel}>
        <Ionicons color="#264653" name="location" size={15} />
        <Text style={styles.mapFallbackText}>Harta e rasteve në Prishtinë</Text>
      </View>

      {showControls && (
        <View style={styles.zoomControls}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setZoom((value) => Math.min(value + 1, 4))}
            style={styles.zoomButton}
          >
            <Text style={styles.zoomText}>+</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setZoom((value) => Math.max(value - 1, 1))}
            style={styles.zoomButton}
          >
            <Text style={styles.zoomText}>-</Text>
          </Pressable>
          <Text style={styles.zoomLevel}>Zmadhimi {zoom}</Text>
        </View>
      )}
    </View>
  );
}

function markerColor(severity) {
  if (severity === "high") return "#E76F51";
  if (severity === "medium") return "#F4A261";
  return "#2A9D8F";
}

const styles = StyleSheet.create({
  mapFallback: {
    backgroundColor: "#E6F4F1",
    borderRadius: 20,
    overflow: "hidden",
  },
  mapGridLineHorizontal: {
    backgroundColor: "rgba(79,70,229,0.12)",
    height: 22,
    left: -20,
    position: "absolute",
    right: -20,
    top: 96,
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
    height: 26,
    position: "absolute",
    width: 26,
  },
  callout: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    elevation: 4,
    maxWidth: 210,
    padding: 12,
    position: "absolute",
    right: 14,
    top: 14,
    shadowColor: "#1F2933",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
  },
  calloutMeta: {
    color: "#2A9D8F",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  calloutSeverity: {
    fontSize: 11,
    fontWeight: "900",
    marginTop: 6,
  },
  calloutTitle: {
    color: "#1F2933",
    fontSize: 14,
    fontWeight: "900",
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
    color: "#1F2933",
    fontSize: 12,
    fontWeight: "900",
  },
  zoomButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  zoomControls: {
    bottom: 52,
    gap: 8,
    position: "absolute",
    right: 12,
  },
  zoomLevel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    color: "#2A9D8F",
    fontSize: 10,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4,
    textAlign: "center",
  },
  zoomText: {
    color: "#1F2933",
    fontSize: 20,
    fontWeight: "900",
  },
});
