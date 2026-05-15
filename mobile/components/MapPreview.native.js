import { StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function MapPreview({ markers, region }) {
  return (
    <MapView initialRegion={region} pointerEvents="none" style={styles.map}>
      {markers.map((marker) => (
        <Marker
          coordinate={marker.coordinate}
          key={marker.title}
          pinColor={marker.color}
          title={marker.title}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    borderRadius: 20,
    height: 190,
    overflow: "hidden",
    width: "100%",
  },
});
