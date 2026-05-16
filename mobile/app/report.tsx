import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import type { ReactNode } from "react";

import BottomNav from "../components/BottomNav";
import { analyzeReport, ReportAnalysisResult, saveCase } from "../src/services/api";

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

const severityColor = {
  low: "#5B7B57",
  medium: "#6A97B2",
  high: "#356F94",
};

const severityLabel = {
  low: "I ulët",
  medium: "Mesatar",
  high: "I lartë",
};

const categoryLabel: Record<ReportAnalysisResult["category"], string> = {
  accessibility: "Qasje",
  blocked_sidewalk: "Trotuar i bllokuar",
  other: "Tjetër",
  public_lighting: "Ndriçim publik",
  public_transport: "Transport publik",
  road_damage: "Dëmtim rruge",
  waste: "Mbeturina",
  water_issue: "Problem me ujë",
};

const kosovoCities = [
  "Prishtinë",
  "Prizren",
  "Pejë",
  "Gjakovë",
  "Ferizaj",
  "Mitrovicë",
  "Gjilan",
  "Vushtrri",
  "Podujevë",
  "Suharekë",
  "Rahovec",
  "Malishevë",
  "Lipjan",
  "Fushë Kosovë",
  "Kamenicë",
  "Deçan",
  "Istog",
  "Klinë",
  "Skenderaj",
  "Drenas",
  "Kaçanik",
  "Shtime",
  "Viti",
  "Obiliq",
  "Dragash",
  "Novobërdë",
  "Shtërpcë",
  "Junik",
  "Mamushë",
  "Hani i Elezit",
  "Graçanicë",
];

const routeToScreen = {
  "/": "Home",
  "/accessibility": "Accessibility",
  "/dashboard": "Dashboard",
  "/report": "Report",
};

export default function ReportProblemScreen({ navigation }: { navigation?: any }) {
  const [image, setImage] = useState<SelectedImage | null>(null);
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("Prishtinë");
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [neighborhood, setNeighborhood] = useState("");
  const [result, setResult] = useState<ReportAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fullAddress = [city, neighborhood.trim()].filter(Boolean).join(", ");

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
    const trimmedDescription = description.trim();

    if (!trimmedDescription || !city) {
      Alert.alert("Të dhëna të paplota", "Shkruaj përshkrimin dhe zgjidh qytetin.");
      return;
    }

    try {
      setIsAnalyzing(true);
      setResult(null);
      setResult(
        await analyzeReport({
          image,
          description: trimmedDescription,
          city: fullAddress,
        }),
      );
    } catch (error) {
      Alert.alert(
        "Analiza dështoi",
        error instanceof Error ? error.message : "Raporti nuk mund të analizohet tani.",
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
      const casePayload = {
        ...result,
        address: fullAddress,
        location: {
          city,
          coordinates: null,
          neighborhood: neighborhood.trim(),
        },
      };

      await saveCase(casePayload as unknown as ReportAnalysisResult);
      Alert.alert("Rasti u ruajt", "Raporti u ruajt me sukses.");
    } catch (error) {
      Alert.alert(
        "Ruajtja dështoi",
        error instanceof Error ? error.message : "Rasti nuk mund të ruhet tani.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.brandRow}>
            <View style={styles.heroIcon}>
              <Ionicons color="#FFFFFF" name="megaphone-outline" size={24} />
            </View>
            <Text style={styles.brand}>dardanIA</Text>
          </View>
          <Text style={styles.title}>Raporto një Problem</Text>
          <Text style={styles.subtitle}>
            Ndihmo komunitetin duke raportuar probleme në qytet si rrugë të dëmtuara,
            mbeturina, ndriçim publik apo pengesa për qytetarët.
          </Text>
        </View>

        <SectionCard icon="camera-outline" title="Foto e problemit">
          <Text style={styles.helperText}>
            Fotoja është opsionale, por e ndihmon dardanIA-n të kuptojë më mirë situatën.
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
              <Text style={styles.emptyText}>Ende nuk është zgjedhur foto</Text>
            </View>
          )}
        </SectionCard>

        <SectionCard icon="document-text-outline" title="Përshkrimi">
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={(value) => {
              setDescription(value);
              setResult(null);
            }}
            placeholder="Përshkruaj problemin me sa më shumë detaje..."
            placeholderTextColor="#6A97B2"
            multiline
            textAlignVertical="top"
          />
        </SectionCard>

        <SectionCard icon="location-outline" title="Lokacioni">
          <Text style={styles.label}>Zgjidh qytetin</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setIsCityDropdownOpen((value) => !value)}
            style={styles.dropdownButton}
          >
            <Text style={styles.dropdownText}>{city}</Text>
            <Ionicons
              color={colors.primary}
              name={isCityDropdownOpen ? "chevron-up" : "chevron-down"}
              size={20}
            />
          </Pressable>

          {isCityDropdownOpen && (
            <ScrollView nestedScrollEnabled style={styles.dropdownList}>
              {kosovoCities.map((cityName) => (
                <Pressable
                  key={cityName}
                  onPress={() => {
                    setCity(cityName);
                    setIsCityDropdownOpen(false);
                    setResult(null);
                  }}
                  style={styles.dropdownItem}
                >
                  <Text style={styles.dropdownItemText}>{cityName}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          <TextInput
            style={styles.input}
            value={neighborhood}
            onChangeText={(value) => {
              setNeighborhood(value);
              setResult(null);
            }}
            placeholder="Lagjja / adresa (opsionale)"
            placeholderTextColor="#6A97B2"
          />

          <View style={styles.addressPreview}>
            <Ionicons color={colors.accent} name="pin-outline" size={18} />
            <Text style={styles.addressText}>{fullAddress}</Text>
          </View>
        </SectionCard>

        <TouchableOpacity
          disabled={isAnalyzing}
          style={[styles.primaryButton, isAnalyzing && styles.disabledButton]}
          onPress={handleAnalyze}
        >
          {isAnalyzing ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons color="#FFFFFF" name="sparkles-outline" size={20} />
              <Text style={styles.primaryButtonText}>Analizo problemin</Text>
            </>
          )}
        </TouchableOpacity>

        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.resultIcon}>
                <Ionicons color={colors.primary} name="sparkles-outline" size={22} />
              </View>
              <View style={styles.resultHeaderText}>
                <Text style={styles.resultTitle}>Analiza nga dardanIA</Text>
                <Text style={styles.resultSubtitle}>{result.title}</Text>
              </View>
            </View>

            <InfoRow label="Kategoria" value={categoryLabel[result.category]} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Niveli i seriozitetit</Text>
              <View style={[styles.severityPill, { backgroundColor: severityColor[result.severity] }]}>
                <Text style={styles.severityText}>{severityLabel[result.severity]}</Text>
              </View>
            </View>
            <InfoRow label="Institucioni përgjegjës" value={result.recommendedInstitution} />
            <InfoRow label="Përmbledhje" value={result.summary} />

            <View style={styles.complaintCard}>
              <View style={styles.complaintHeader}>
                <Ionicons color={colors.primary} name="mail-outline" size={19} />
                <Text style={styles.complaintTitle}>Ankesa zyrtare</Text>
              </View>
              <Text style={styles.complaintText}>{result.officialComplaint}</Text>
            </View>

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
      <BottomNav activeTab="Report" onNavigate={navigateTab} />
    </View>
  );
}

function SectionCard({
  children,
  icon,
  title,
}: {
  children: ReactNode;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <Ionicons color={colors.primary} name={icon} size={20} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
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
    marginTop: 12,
  },
  addressPreview: {
    alignItems: "center",
    backgroundColor: "#F2F5EA",
    borderColor: "#D8E1D0",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
    padding: 12,
  },
  addressText: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
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
    marginBottom: 12,
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
  complaintCard: {
    backgroundColor: "#F2F5EA",
    borderColor: "#D8E1D0",
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  complaintHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  complaintText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 23,
  },
  complaintTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "900",
  },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 116,
  },
  disabledButton: {
    opacity: 0.65,
  },
  dropdownButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#C6D6DE",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  dropdownItem: {
    borderBottomColor: "#D8E1D0",
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownItemText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  dropdownList: {
    backgroundColor: "#FFFFFF",
    borderColor: "#C6D6DE",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    maxHeight: 220,
  },
  dropdownText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
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
  infoLabel: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 5,
  },
  infoRow: {
    borderTopColor: "#D8E1D0",
    borderTopWidth: 1,
    paddingVertical: 12,
  },
  infoValue: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#C6D6DE",
    borderRadius: 16,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    minHeight: 52,
    padding: 14,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 8,
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
    marginBottom: 12,
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
    lineHeight: 20,
    marginTop: 2,
  },
  resultTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  saveButton: {
    marginBottom: 0,
    marginTop: 16,
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
  severityPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  severityText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  subtitle: {
    color: "#EAF2F6",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 23,
    marginTop: 8,
  },
  textArea: {
    minHeight: 128,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36,
  },
});
