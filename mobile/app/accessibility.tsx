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
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";

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

const colors = {
  accent: "#6A97B2",
  background: "#F2F5EA",
  card: "#FFFFFF",
  gold: "#6A97B2",
  primary: "#356F94",
  success: "#5B7B57",
  text: "#2F2D2E",
};

const riskColor = {
  low: "#5B7B57",
  medium: "#6A97B2",
  high: "#356F94",
};

const riskLabel = {
  low: "I ulët",
  medium: "Mesatar",
  high: "I lartë",
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
      Alert.alert("Leje për kamerën", "Lejo qasjen në kamerë për të bërë foto.");
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
      Alert.alert("Leje për galerinë", "Lejo qasjen në galeri për të zgjedhur foto.");
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
      Alert.alert("Foto mungon", "Zgjidh ose bëj një foto para analizës.");
      return;
    }

    try {
      setIsAnalyzing(true);
      setResult(await analyzeAccessibility(image));
    } catch (error) {
      Alert.alert(
        "Analiza dështoi",
        error instanceof Error ? error.message : "Fotoja nuk mund të analizohet tani.",
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
      Alert.alert("Rasti u ruajt", "Kontrolli i qasjes u ruajt me sukses.");
    } catch (error) {
      Alert.alert(
        "Ruajtja dështoi",
        error instanceof Error ? error.message : "Rasti nuk mund të ruhet tani.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const score = result?.accessibilityScore ?? 0;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.brandRow}>
            <View style={styles.heroIcon}>
              <Ionicons color="#FFFFFF" name="accessibility-outline" size={25} />
            </View>
            <Text style={styles.brand}>dardanIA</Text>
          </View>
          <Text style={styles.title}>Kontrollo Qasjen</Text>
          <Text style={styles.subtitle}>
            Analizo nëse një hapësirë është e përshtatshme për persona me aftësi
            të kufizuara.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Ionicons color={colors.primary} name="camera-outline" size={20} />
            </View>
            <Text style={styles.cardTitle}>Foto e hapësirës</Text>
          </View>
          <Text style={styles.helperText}>
            Fotografo hyrjen, trotuarin, rampën, ashensorin ose vendin ku dyshon se ka pengesa.
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
              <Ionicons color={colors.primary} name="images-outline" size={18} />
              <Text style={styles.secondaryButtonText}>Zgjidh nga galeria</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={takePhoto}>
              <Ionicons color={colors.primary} name="camera-outline" size={18} />
              <Text style={styles.secondaryButtonText}>Bëj foto</Text>
            </TouchableOpacity>
          </View>

          {image ? (
            <Image source={{ uri: image.uri }} style={styles.preview} />
          ) : (
            <View style={styles.emptyPreview}>
              <Ionicons color={colors.gold} name="image-outline" size={34} />
              <Text style={styles.emptyText}>Zgjidh foto për analizë</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          disabled={!image || isAnalyzing}
          style={[styles.primaryButton, (!image || isAnalyzing) && styles.disabledButton]}
          onPress={handleAnalyze}
        >
          {isAnalyzing ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons color="#FFFFFF" name="scan-outline" size={20} />
              <Text style={styles.primaryButtonText}>Analizo Qasjen</Text>
            </>
          )}
        </TouchableOpacity>

        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.resultIcon}>
                <Ionicons color={colors.primary} name="analytics-outline" size={24} />
              </View>
              <View style={styles.resultHeaderText}>
                <Text style={styles.resultTitle}>{result.title}</Text>
                <Text style={styles.resultSubtitle}>Rezultatet vizuale nga dardanIA</Text>
              </View>
            </View>

            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Rezultati i qasjes</Text>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreValue}>{score}</Text>
                <Text style={styles.scoreMax}>/100</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(score, 100))}%` }]} />
              </View>
            </View>

            <View style={styles.riskCard}>
              <Text style={styles.sectionTitle}>Rreziqet</Text>
              <RiskPill icon="accessibility-outline" label="Rreziku për karroca" value={result.wheelchairRisk} />
              <RiskPill icon="eye-outline" label="Rreziku për persona me shikim të dobët" value={result.visualImpairmentRisk} />
              <RiskPill icon="warning-outline" label="Serioziteti i përgjithshëm" value={result.severity} />
            </View>

            <ListCard
              icon="warning-outline"
              items={result.detectedBarriers}
              title="Pengesat e identifikuara"
            />
            <ListCard
              icon="bulb-outline"
              items={result.recommendations}
              title="Rekomandimet"
            />

            <TextCard icon="document-text-outline" title="Raport zyrtar" value={result.officialReport} />
            <TextCard
              icon="business-outline"
              title="Institucioni i rekomanduar"
              value={result.recommendedInstitution}
            />

            <TouchableOpacity
              disabled={isSaving}
              style={[styles.primaryButton, styles.saveButton, isSaving && styles.disabledButton]}
              onPress={handleSaveCase}
            >
              {isSaving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons color="#FFFFFF" name="bookmark-outline" size={20} />
                  <Text style={styles.primaryButtonText}>Ruaj rastin</Text>
                </>
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
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: "low" | "medium" | "high";
}) {
  return (
    <View style={styles.riskRow}>
      <View style={styles.riskLabelRow}>
        <Ionicons color={colors.accent} name={icon} size={18} />
        <Text style={styles.riskLabel}>{label}</Text>
      </View>
      <View style={[styles.riskPill, { backgroundColor: riskColor[value] }]}>
        <Text style={styles.riskText}>{riskLabel[value]}</Text>
      </View>
    </View>
  );
}

function ListCard({
  icon,
  items,
  title,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  items: string[];
  title: string;
}) {
  return (
    <View style={styles.innerCard}>
      <View style={styles.innerHeader}>
        <Ionicons color={colors.primary} name={icon} size={20} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {items.length ? (
        items.map((item) => (
          <View key={item} style={styles.listRow}>
            <Ionicons color={colors.gold} name="checkmark-circle-outline" size={18} />
            <Text style={styles.listItem}>{item}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.paragraph}>Nuk u gjetën të dhëna të mjaftueshme.</Text>
      )}
    </View>
  );
}

function TextCard({
  icon,
  title,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
}) {
  return (
    <View style={styles.innerCard}>
      <View style={styles.innerHeader}>
        <Ionicons color={colors.primary} name={icon} size={20} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Text style={styles.paragraph}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },
  brand: {
    color: colors.gold,
    fontSize: 15,
    fontWeight: "900",
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: "#D8E1D0",
    borderRadius: 20,
    borderWidth: 1,
    elevation: 3,
    marginBottom: 16,
    padding: 16,
    shadowColor: colors.text,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  cardIcon: {
    alignItems: "center",
    backgroundColor: "#E4EDF1",
    borderRadius: 14,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  cardTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
  },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 116,
  },
  disabledButton: {
    opacity: 0.55,
  },
  emptyPreview: {
    alignItems: "center",
    aspectRatio: 4 / 3,
    backgroundColor: "#F2F5EA",
    borderColor: "#C6D6DE",
    borderRadius: 18,
    borderStyle: "dashed",
    borderWidth: 1,
    gap: 8,
    justifyContent: "center",
    marginTop: 14,
  },
  emptyText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "800",
  },
  helperText: {
    color: colors.accent,
    fontSize: 14,
    lineHeight: 21,
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: 22,
    marginBottom: 16,
    padding: 20,
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: 14,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  innerCard: {
    backgroundColor: "#F2F5EA",
    borderColor: "#D8E1D0",
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  innerHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  listItem: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  listRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  paragraph: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 23,
  },
  preview: {
    aspectRatio: 4 / 3,
    borderRadius: 18,
    marginTop: 14,
    width: "100%",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 18,
    elevation: 2,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginBottom: 16,
    minHeight: 54,
    paddingHorizontal: 16,
    shadowColor: colors.primary,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: "100%",
  },
  progressTrack: {
    backgroundColor: "#C6D6DE",
    borderRadius: 999,
    height: 12,
    overflow: "hidden",
  },
  resultCard: {
    backgroundColor: colors.card,
    borderColor: "#D8E1D0",
    borderRadius: 20,
    borderWidth: 1,
    elevation: 3,
    padding: 16,
    shadowColor: colors.text,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  resultHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  resultHeaderText: {
    flex: 1,
  },
  resultIcon: {
    alignItems: "center",
    backgroundColor: "#E4EDF1",
    borderRadius: 16,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  resultSubtitle: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  resultTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  riskCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8E1D0",
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  riskLabel: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  riskLabelRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 8,
  },
  riskPill: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  riskRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  riskText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  saveButton: {
    marginBottom: 0,
    marginTop: 16,
  },
  scoreCard: {
    backgroundColor: "#F2F5EA",
    borderColor: "#D8E1D0",
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  scoreLabel: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "900",
  },
  scoreMax: {
    color: colors.gold,
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 8,
  },
  scoreRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    marginBottom: 12,
  },
  scoreValue: {
    color: colors.primary,
    fontSize: 58,
    fontWeight: "900",
    lineHeight: 64,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#F2F5EA",
    borderColor: "#C6D6DE",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 10,
  },
  secondaryButtonText: {
    color: colors.primary,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
  sectionTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 17,
    fontWeight: "900",
  },
  subtitle: {
    color: "#EAF2F6",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 23,
    marginTop: 8,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36,
  },
});
