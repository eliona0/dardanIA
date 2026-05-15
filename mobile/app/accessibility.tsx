import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";

import BottomNav from "../components/BottomNav";
import {
  AccessibilityAnalysisResult,
  analyzeAccessibility,
  saveCase,
} from "../src/services/api";

type SelectedImage = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

const riskColor = {
  low: "#16803c",
  medium: "#b7791f",
  high: "#c53030",
};

const routeToScreen = {
  "/": "Home",
  "/accessibility": "Accessibility",
  "/dashboard": "Dashboard",
  "/report": "Report",
};

export default function AccessibilityCheckScreen({ navigation }: { navigation?: any }) {
  const [image, setImage] = useState<SelectedImage | null>(null);
  const [result, setResult] = useState<AccessibilityAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const navigateTab = (route: string) => {
    if (navigation) {
      navigation.navigate(routeToScreen[route as keyof typeof routeToScreen] || "Home");
      return;
    }

    router.push(route as never);
  };

  const requestCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Camera permission needed", "Please allow camera access to take a photo.");
      return null;
    }

    return ImagePicker.launchCameraAsync({
      allowsEditing: false,
      mediaTypes: ["images"],
      quality: 0.85,
    });
  };

  const requestLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Photo permission needed", "Please allow photo access to select an image.");
      return null;
    }

    return ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      mediaTypes: ["images"],
      quality: 0.85,
    });
  };

  const setPickedImage = (pickerResult: ImagePicker.ImagePickerResult | null) => {
    if (!pickerResult || pickerResult.canceled) {
      return;
    }

    const asset = pickerResult.assets[0];

    setImage({
      uri: asset.uri,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
    });
    setResult(null);
  };

  const pickImage = async () => {
    setPickedImage(await requestLibrary());
  };

  const takePhoto = async () => {
    setPickedImage(await requestCamera());
  };

  const handleAnalyze = async () => {
    if (!image) {
      Alert.alert("No image selected", "Select or take a photo first.");
      return;
    }

    try {
      setIsAnalyzing(true);
      setResult(await analyzeAccessibility(image));
    } catch (error) {
      Alert.alert(
        "Analysis failed",
        error instanceof Error ? error.message : "Could not analyze this image.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveCase = async () => {
    if (!result) {
      return;
    }

    try {
      setIsSaving(true);
      await saveCase(result);
      Alert.alert("Case saved", "The accessibility case was saved successfully.");
    } catch (error) {
      Alert.alert(
        "Save failed",
        error instanceof Error ? error.message : "Could not save this case.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Accessibility Check</Text>
        <Text style={styles.subtitle}>Entrances, sidewalks, ramps, parking and elevators.</Text>

        <View style={styles.actions}>
        <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
          <Text style={styles.secondaryButtonText}>Select Image</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={takePhoto}>
          <Text style={styles.secondaryButtonText}>Take Photo</Text>
        </TouchableOpacity>
        </View>

        {image ? (
        <Image source={{ uri: image.uri }} style={styles.preview} />
      ) : (
        <View style={styles.emptyPreview}>
          <Text style={styles.emptyText}>No image selected</Text>
        </View>
        )}

        <TouchableOpacity
        disabled={!image || isAnalyzing}
        style={[styles.primaryButton, (!image || isAnalyzing) && styles.disabledButton]}
        onPress={handleAnalyze}
      >
        {isAnalyzing ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.primaryButtonText}>Analyze Accessibility</Text>
        )}
        </TouchableOpacity>

        {result && (
          <View style={styles.result}>
          <Text style={styles.resultTitle}>{result.title}</Text>

          <View style={styles.scoreRow}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>Accessibility Score</Text>
              <Text style={styles.scoreValue}>{result.accessibilityScore}/100</Text>
            </View>
            <RiskPill label="Severity" value={result.severity} />
          </View>

          <RiskPill label="Wheelchair Risk" value={result.wheelchairRisk} />
          <RiskPill label="Visual Impairment Risk" value={result.visualImpairmentRisk} />

          <Section title="Detected Barriers" items={result.detectedBarriers} />
          <Section title="Recommendations" items={result.recommendations} />

          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.paragraph}>{result.summary}</Text>

          <Text style={styles.sectionTitle}>Official Report</Text>
          <Text style={styles.paragraph}>{result.officialReport}</Text>

          <Text style={styles.sectionTitle}>Recommended Institution</Text>
          <Text style={styles.paragraph}>{result.recommendedInstitution}</Text>

          <TouchableOpacity
            disabled={isSaving}
            style={[styles.primaryButton, isSaving && styles.disabledButton]}
            onPress={handleSaveCase}
          >
            {isSaving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Save Case</Text>
            )}
          </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <BottomNav activeTab="Accessibility" onNavigate={navigateTab} />
    </View>
  );
}

function RiskPill({
  label,
  value,
}: {
  label: string;
  value: "low" | "medium" | "high";
}) {
  return (
    <View style={styles.riskRow}>
      <Text style={styles.riskLabel}>{label}</Text>
      <View style={[styles.riskPill, { backgroundColor: riskColor[value] }]}>
        <Text style={styles.riskText}>{value.toUpperCase()}</Text>
      </View>
    </View>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item) => (
        <Text key={item} style={styles.listItem}>
          - {item}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#f6f7f9",
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  container: {
    backgroundColor: "#f6f7f9",
    flexGrow: 1,
    padding: 20,
    paddingBottom: 112,
  },
  disabledButton: {
    opacity: 0.5,
  },
  emptyPreview: {
    alignItems: "center",
    aspectRatio: 4 / 3,
    backgroundColor: "#e7ebef",
    borderRadius: 8,
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyText: {
    color: "#68707a",
  },
  listItem: {
    color: "#2b333b",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 6,
  },
  paragraph: {
    color: "#2b333b",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
  },
  preview: {
    aspectRatio: 4 / 3,
    borderRadius: 8,
    marginBottom: 16,
    width: "100%",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#145da0",
    borderRadius: 8,
    minHeight: 48,
    justifyContent: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  result: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 16,
  },
  resultTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 14,
  },
  riskLabel: {
    color: "#374151",
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  riskPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  riskRow: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 10,
  },
  riskText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  scoreBox: {
    flex: 1,
  },
  scoreLabel: {
    color: "#68707a",
    fontSize: 13,
  },
  scoreRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  scoreValue: {
    color: "#111827",
    fontSize: 28,
    fontWeight: "900",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#c7d0da",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    color: "#145da0",
    fontSize: 15,
    fontWeight: "700",
  },
  sectionTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
    marginTop: 12,
  },
  subtitle: {
    color: "#68707a",
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 18,
  },
  title: {
    color: "#111827",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 6,
  },
});
