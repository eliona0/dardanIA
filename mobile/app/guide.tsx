import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import BottomNav from "../components/BottomNav";

type GuideResult = {
  service: string;
  institution: string;
  office: string;
  floor: string;
  documents: string[];
  estimatedWait: string;
  steps: string[];
  friendlyAnswer: string;
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

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://172.16.103.5:4000";
const routeToScreen = {
  "/": "Home",
  "/accessibility": "Accessibility",
  "/dashboard": "Dashboard",
  "/report": "Report",
};

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new Error(
      response.status === 404
        ? "Shërbimi /api/guide nuk u gjet. Rinis backend-in."
        : "Backend-i ktheu përgjigje jo të vlefshme.",
    );
  }
}

export default function GuideScreen({ navigation }: { navigation?: any }) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<GuideResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigateTab = (route: string) => {
    if (navigation) {
      navigation.navigate(routeToScreen[route as keyof typeof routeToScreen] || "Home");
      return;
    }

    router.push(route as never);
  };

  const askGuide = async () => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setError("Shkruaj çfarë shërbimi po kërkon.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/guide`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: trimmedQuestion }),
      });
      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data?.error || "Nuk mund ta gjej shërbimin.");
      }

      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Diçka shkoi keq.");
    } finally {
      setLoading(false);
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
              <Ionicons color="#FFFFFF" name="business-outline" size={24} />
            </View>
            <Text style={styles.brand}>dardanIA</Text>
          </View>
          <Text style={styles.title}>Ku me shku?</Text>
          <Text style={styles.subtitle}>
            Gjej informacion për shërbime publike në mënyrë të thjeshtë dhe të shpejtë.
          </Text>
        </View>

        <View style={styles.searchCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Ionicons color={colors.primary} name="search-outline" size={20} />
            </View>
            <Text style={styles.cardTitle}>Çfarë shërbimi të duhet?</Text>
          </View>
          <Text style={styles.helperText}>
            Pyet me gjuhë të thjeshtë. dardanIA do të të tregojë zyrën, dokumentet
            dhe hapat që duhet të ndjekësh.
          </Text>

          <TextInput
            style={styles.input}
            value={question}
            onChangeText={(value) => {
              setQuestion(value);
              setError("");
            }}
            placeholder="Shkruaj p.sh. certifikatë lindjeje..."
            placeholderTextColor="#6A97B2"
            multiline
            textAlignVertical="top"
          />

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={askGuide}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons color="#FFFFFF" name="send-outline" size={19} />
                <Text style={styles.buttonText}>Pyet dardanIA-n</Text>
              </>
            )}
          </Pressable>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Ionicons color={colors.primary} name="alert-circle-outline" size={20} />
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}

        {result ? (
          <View style={styles.result}>
            <View style={styles.resultHeader}>
              <View style={styles.resultIcon}>
                <Ionicons color={colors.primary} name="sparkles-outline" size={22} />
              </View>
              <View style={styles.resultHeaderText}>
                <Text style={styles.resultTitle}>Përgjigjja e thjeshtuar</Text>
                <Text style={styles.answer}>{result.friendlyAnswer}</Text>
              </View>
            </View>

            <InfoCard icon="business-outline" label="Zyra" value={`${result.institution}, ${result.office}`} />
            <InfoCard icon="location-outline" label="Lokacioni" value={`Kati: ${result.floor}`} />
            <InfoCard icon="time-outline" label="Koha e pritjes" value={result.estimatedWait || "Koha ndryshon sipas ngarkesës"} />

            <ListCard
              icon="document-text-outline"
              items={result.documents}
              title="Dokumentet e nevojshme"
            />
            <ListCard icon="footsteps-outline" items={result.steps} numbered title="Hapat që duhet ndjekur" />
          </View>
        ) : (
          <View style={styles.demoCard}>
            <Text style={styles.demoTitle}>Shembuj që mund të kërkosh</Text>
            {["Certifikatë lindjeje", "Letërnjoftim", "Pagesë komunale"].map((item) => (
              <Pressable
                key={item}
                onPress={() => setQuestion(item)}
                style={styles.examplePill}
              >
                <Ionicons color={colors.primary} name="add-circle-outline" size={18} />
                <Text style={styles.exampleText}>{item}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
      <BottomNav activeTab="Home" onNavigate={navigateTab} />
    </View>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoIcon}>
        <Ionicons color={colors.primary} name={icon} size={20} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function ListCard({
  icon,
  items,
  numbered,
  title,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  items: string[];
  numbered?: boolean;
  title: string;
}) {
  return (
    <View style={styles.listCard}>
      <View style={styles.listHeader}>
        <Ionicons color={colors.primary} name={icon} size={20} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {items.map((item, index) => (
        <View key={`${item}-${index}`} style={styles.listRow}>
          <View style={styles.listMarker}>
            <Text style={styles.listMarkerText}>{numbered ? index + 1 : "•"}</Text>
          </View>
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  answer: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    marginTop: 4,
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
  button: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 18,
    elevation: 2,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 14,
    minHeight: 54,
    shadowColor: colors.primary,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
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
  demoCard: {
    backgroundColor: "#F2F5EA",
    borderColor: "#D8E1D0",
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 16,
    padding: 16,
  },
  demoTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 12,
  },
  error: {
    color: colors.primary,
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21,
  },
  errorCard: {
    alignItems: "center",
    backgroundColor: "#E4EDF1",
    borderColor: "#C6D6DE",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
    padding: 14,
  },
  examplePill: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#C6D6DE",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginBottom: 9,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  exampleText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  helperText: {
    color: colors.accent,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
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
  infoCard: {
    alignItems: "center",
    backgroundColor: "#F2F5EA",
    borderColor: "#D8E1D0",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    padding: 14,
  },
  infoIcon: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  infoLabel: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 3,
  },
  infoText: {
    flex: 1,
  },
  infoValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#C6D6DE",
    borderRadius: 18,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    minHeight: 116,
    padding: 14,
  },
  listCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8E1D0",
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  listHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  listMarker: {
    alignItems: "center",
    backgroundColor: "#E4EDF1",
    borderRadius: 999,
    height: 24,
    justifyContent: "center",
    marginTop: 1,
    width: 24,
  },
  listMarkerText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900",
  },
  listRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 9,
    marginBottom: 9,
  },
  listText: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  result: {
    backgroundColor: colors.card,
    borderColor: "#D8E1D0",
    borderRadius: 20,
    borderWidth: 1,
    elevation: 3,
    marginTop: 16,
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
    marginBottom: 4,
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
  resultTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "900",
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  searchCard: {
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
