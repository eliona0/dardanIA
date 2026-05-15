import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

import { analyzeReport, ReportAnalysisResult, saveCase } from "../src/services/api";

type SelectedImage = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

const severityColor = {
  low: "#16803c",
  medium: "#b7791f",
  high: "#c53030",
};

export default function ReportProblemScreen() {
  const [image, setImage] = useState<SelectedImage | null>(null);
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [result, setResult] = useState<ReportAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
    const trimmedDescription = description.trim();
    const trimmedCity = city.trim();

    if (!trimmedDescription || !trimmedCity) {
      Alert.alert("Missing details", "Write a description and city/location first.");
      return;
    }

    try {
      setIsAnalyzing(true);
      setResult(null);
      setResult(
        await analyzeReport({
          image,
          description: trimmedDescription,
          city: trimmedCity,
        }),
      );
    } catch (error) {
      Alert.alert(
        "Analysis failed",
        error instanceof Error ? error.message : "Could not analyze this report.",
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
      Alert.alert("Case saved", "The civic problem case was saved successfully.");
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
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Report Problem</Text>
      <Text style={styles.subtitle}>Report road damage, waste, lighting, access, transport and public service issues.</Text>

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
          <Text style={styles.emptyText}>Image optional</Text>
        </View>
      )}

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={(value) => {
          setDescription(value);
          setResult(null);
        }}
        placeholder="Describe the issue, risk, street, landmark, or nearby building."
        multiline
        textAlignVertical="top"
      />

      <Text style={styles.label}>City or Location</Text>
      <TextInput
        style={styles.input}
        value={city}
        onChangeText={(value) => {
          setCity(value);
          setResult(null);
        }}
        placeholder="Prishtina, Dardania neighborhood"
      />

      <TouchableOpacity
        disabled={isAnalyzing}
        style={[styles.primaryButton, isAnalyzing && styles.disabledButton]}
        onPress={handleAnalyze}
      >
        {isAnalyzing ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.primaryButtonText}>Analyze Problem</Text>
        )}
      </TouchableOpacity>

      {result && (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>{result.title}</Text>

          <InfoRow label="Category" value={result.category} />
          <View style={styles.severityRow}>
            <Text style={styles.infoLabel}>Severity</Text>
            <View style={[styles.severityPill, { backgroundColor: severityColor[result.severity] }]}>
              <Text style={styles.severityText}>{result.severity.toUpperCase()}</Text>
            </View>
          </View>
          <InfoRow label="Recommended Institution" value={result.recommendedInstitution} />
          <InfoRow label="Summary" value={result.summary} />
          <InfoRow label="Official Complaint" value={result.officialComplaint} />

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
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  container: {
    backgroundColor: "#f6f7f9",
    flexGrow: 1,
    padding: 20,
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
  infoLabel: {
    color: "#68707a",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  infoRow: {
    borderTopColor: "#edf1f7",
    borderTopWidth: 1,
    paddingVertical: 10,
  },
  infoValue: {
    color: "#172033",
    fontSize: 15,
    lineHeight: 22,
  },
  input: {
    backgroundColor: "#fff",
    borderColor: "#cfd6e4",
    borderRadius: 8,
    borderWidth: 1,
    color: "#172033",
    fontSize: 16,
    marginBottom: 14,
    minHeight: 48,
    padding: 14,
  },
  label: {
    color: "#172033",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
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
    borderColor: "#e2e8f0",
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  resultTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
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
  severityPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  severityRow: {
    borderTopColor: "#edf1f7",
    borderTopWidth: 1,
    paddingVertical: 10,
  },
  severityText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  subtitle: {
    color: "#68707a",
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 18,
  },
  textArea: {
    minHeight: 118,
  },
  title: {
    color: "#111827",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 6,
  },
});
