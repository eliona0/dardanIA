import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Callout, Marker } from "react-native-maps";

const prishtinaRegion = {
  latitude: 42.6629,
  latitudeDelta: 0.045,
  longitude: 21.1655,
  longitudeDelta: 0.045,
};

export default function MapViewComponent({
  cases,
  height = 210,
  onCasePress,
  onMarkerPress,
  region = prishtinaRegion,
  showControls = true,
}) {
  const mapRef = useRef(null);
  const [currentRegion, setCurrentRegion] = useState(region);
  const handleMarkerPress = onMarkerPress || onCasePress;

  const animateToRegion = (nextRegion) => {
    setCurrentRegion(nextRegion);
    mapRef.current?.animateToRegion(nextRegion, 260);
  };

  const zoomBy = (factor) => {
    animateToRegion({
      ...currentRegion,
      latitudeDelta: Math.max(0.004, Math.min(0.08, currentRegion.latitudeDelta * factor)),
      longitudeDelta: Math.max(0.004, Math.min(0.08, currentRegion.longitudeDelta * factor)),
    });
  };

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        initialRegion={region}
        loadingEnabled
        mapType="standard"
        onRegionChangeComplete={setCurrentRegion}
        pitchEnabled
        ref={mapRef}
        rotateEnabled
        scrollEnabled
        showsBuildings
        showsTraffic={false}
        showsUserLocation
        style={styles.map}
        zoomControlEnabled
        zoomEnabled
      >
        {cases.map((caseItem) => (
          <Marker
            coordinate={caseItem.coordinates}
            key={caseItem.id}
            onCalloutPress={() => handleMarkerPress?.(caseItem)}
            pinColor={markerColor(caseItem.severity)}
          >
            <Callout tooltip>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{caseItem.title}</Text>
                <Text style={styles.calloutMeta}>{caseItem.category}</Text>
                <Text style={[styles.calloutSeverity, { color: markerColor(caseItem.severity) }]}>
                  {String(caseItem.severity).toUpperCase()}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {showControls && (
        <View style={styles.controls}>
          <Pressable accessibilityRole="button" onPress={() => zoomBy(0.5)} style={styles.controlButton}>
            <Text style={styles.controlText}>+</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => zoomBy(2)} style={styles.controlButton}>
            <Text style={styles.controlText}>-</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => animateToRegion(region)} style={styles.centerButton}>
            <Text style={styles.centerText}>Center</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function markerColor(severity) {
  if (severity === "high") return "#EF4444";
  if (severity === "medium") return "#F97316";
  return "#22C55E";
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 20,
    overflow: "hidden",
    width: "100%",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  callout: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    elevation: 4,
    minWidth: 180,
    padding: 12,
    shadowColor: "#0F172A",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
  },
  calloutTitle: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 4,
  },
  calloutMeta: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },
  calloutSeverity: {
    fontSize: 11,
    fontWeight: "900",
    marginTop: 6,
  },
  centerButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  centerText: {
    color: "#4F46E5",
    fontSize: 12,
    fontWeight: "900",
  },
  controlButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  controls: {
    bottom: 12,
    gap: 8,
    position: "absolute",
    right: 12,
  },
  controlText: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "900",
  },
});
