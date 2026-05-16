import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from "react-native";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import BottomNav from "../components/BottomNav";

type GuideResult = {
  answer?: string;
  audioUrl?: string | null;
  service: string;
  institution: string;
  office: string;
  floor: string;
  documents: string[];
  estimatedWait: string;
  steps: string[];
  friendlyAnswer: string;
  question?: string;
  language?: SupportedLanguage;
};

type SupportedLanguage = "sq" | "en" | "tr" | "sr";

const colors = {
  accent: "#2A9D8F",
  background: "#F7FAF9",
  card: "#FFFFFF",
  error: "#E76F51",
  highlight: "#E9C46A",
  primary: "#264653",
  success: "#2A9D8F",
  text: "#1F2933",
  warning: "#F4A261",
};

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://172.16.103.5:4000";
const speechLanguage: Record<SupportedLanguage, string> = {
  sq: "sq-AL",
  en: "en-US",
  tr: "tr-TR",
  sr: "sr-RS",
};
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
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const playbackRef = useRef<Audio.Sound | null>(null);

  const navigateTab = (route: string) => {
    if (navigation) {
      navigation.reset({
        index: 0,
        routes: [{ name: routeToScreen[route as keyof typeof routeToScreen] || "Home" }],
      });
      return;
    }

    router.replace(route as never);
  };

  const stopAnswerAudio = async () => {
    Speech.stop();
    setIsSpeaking(false);

    if (playbackRef.current) {
      await playbackRef.current.unloadAsync();
      playbackRef.current = null;
    }
  };

  const speakFallback = (text: string, language: SupportedLanguage = "sq") => {
    if (!text) {
      return;
    }

    Speech.stop();
    Speech.speak(text, {
      language: speechLanguage[language] || speechLanguage.sq,
      pitch: 1,
      rate: 0.96,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const playAnswerAudio = async (
    text: string,
    audioUrl?: string | null,
    language: SupportedLanguage = "sq",
  ) => {
    if (!text) {
      return;
    }

    try {
      await stopAnswerAudio();
      setIsSpeaking(true);

      if (!audioUrl) {
        speakFallback(text, language);
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsSpeaking(false);
            playbackRef.current?.unloadAsync();
            playbackRef.current = null;
          }
        },
      );
      playbackRef.current = sound;
    } catch {
      speakFallback(text, language);
    }
  };

  const toggleAnswerAudio = async () => {
    if (!result) {
      return;
    }

    if (isSpeaking) {
      await stopAnswerAudio();
      return;
    }

    await playAnswerAudio(
      result.answer || result.friendlyAnswer,
      result.audioUrl,
      result.language || "sq",
    );
  };

  const askGuide = async (overrideQuestion?: string) => {
    const trimmedQuestion = (overrideQuestion || question).trim();

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

      await stopAnswerAudio();
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Diçka shkoi keq.");
    } finally {
      setLoading(false);
    }
  };

  const sendVoiceQuestion = async (audioUri: string) => {
    setIsProcessingVoice(true);
    setError("");

    try {
      const formData = new FormData();

      if (Platform.OS === "web") {
        const audioResponse = await fetch(audioUri);
        const audioBlob = await audioResponse.blob();

        formData.append("audio", audioBlob, "kumeshku-voice.webm");
      } else {
        formData.append("audio", {
          uri: audioUri,
          name: "kumeshku-voice.m4a",
          type: "audio/m4a",
        } as unknown as Blob);
      }

      const response = await fetch(`${API_URL}/api/guide/voice`, {
        method: "POST",
        body: formData,
      });
      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data?.error || "Nuk u kuptua, provo perseri.");
      }

      await stopAnswerAudio();
      setQuestion(data.question || "");
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Nuk u kuptua, provo perseri.");
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const startListening = async () => {
    try {
      setError("");
      setResult(null);

      const permission = await Audio.requestPermissionsAsync();

      if (!permission.granted) {
        setError("Lejo mikrofonin per te perdorur zerin.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      recordingRef.current = recording;
      setIsListening(true);
    } catch {
      recordingRef.current = null;
      setIsListening(false);
      setError("Nuk u hap mikrofoni, provo perseri.");
    }
  };

  const stopListening = async () => {
    const recording = recordingRef.current;

    if (!recording) {
      return;
    }

    try {
      setIsListening(false);
      recordingRef.current = null;
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();

      if (!uri) {
        setError("Nuk u kuptua, provo perseri.");
        return;
      }

      await sendVoiceQuestion(uri);
    } catch {
      setIsListening(false);
      recordingRef.current = null;
      setError("Nuk u kuptua, provo perseri.");
    }
  };

  const toggleListening = () => {
    if (isProcessingVoice || loading) {
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    startListening();
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
            placeholderTextColor="#2A9D8F"
            multiline
            textAlignVertical="top"
          />

          <View style={styles.voiceRow}>
            <Pressable
              disabled={loading || isProcessingVoice}
              onPress={toggleListening}
              style={[
                styles.voiceButton,
                isListening && styles.voiceButtonActive,
                (loading || isProcessingVoice) && styles.buttonDisabled,
              ]}
            >
              {isProcessingVoice ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Ionicons color="#FFFFFF" name={isListening ? "stop-circle-outline" : "mic-outline"} size={20} />
              )}
              <Text style={styles.voiceButtonText}>{isListening ? "Ndalo" : "Fol me mua"}</Text>
            </Pressable>

            <Pressable
              disabled={!result}
              onPress={toggleAnswerAudio}
              style={[
                styles.speechToggle,
                isSpeaking && styles.speechToggleStop,
                !result && styles.buttonDisabled,
              ]}
            >
              <Ionicons
                color={isSpeaking ? "#FFFFFF" : colors.primary}
                name={isSpeaking ? "stop-circle-outline" : "volume-high-outline"}
                size={18}
              />
              <Text style={[styles.speechToggleText, isSpeaking && styles.speechToggleTextActive]}>
                {isSpeaking ? "Stop now" : "Lexo përgjigjen"}
              </Text>
            </Pressable>
          </View>

          {isListening ? <Text style={styles.statusText}>Duke dëgjuar...</Text> : null}
          {isProcessingVoice ? <Text style={styles.statusText}>Duke procesuar...</Text> : null}

          <Pressable
            style={[styles.button, (loading || isProcessingVoice || isListening) && styles.buttonDisabled]}
            onPress={() => askGuide()}
            disabled={loading || isProcessingVoice || isListening}
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
            <Ionicons color={colors.error} name="alert-circle-outline" size={20} />
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
                <Text style={styles.answer}>{result.answer || result.friendlyAnswer}</Text>
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
    color: colors.highlight,
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
    backgroundColor: "#E6F4F1",
    borderRadius: 14,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  cardTitle: {
    color: colors.primary,
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
    backgroundColor: "#F7FAF9",
    borderColor: "#DDEAE7",
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 16,
    padding: 16,
  },
  demoTitle: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 12,
  },
  error: {
    color: colors.error,
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21,
  },
  errorCard: {
    alignItems: "center",
    backgroundColor: "#FCEBE6",
    borderColor: "#F3C7BA",
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
    borderColor: "#C9DEDA",
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
    backgroundColor: "#F7FAF9",
    borderColor: "#DDEAE7",
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
    borderColor: "#C9DEDA",
    borderRadius: 18,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    minHeight: 116,
    padding: 14,
  },
  listCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DDEAE7",
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
    backgroundColor: "#E6F4F1",
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
    borderColor: "#DDEAE7",
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
    backgroundColor: "#E6F4F1",
    borderRadius: 16,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  resultTitle: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: "900",
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  searchCard: {
    backgroundColor: colors.card,
    borderColor: "#DDEAE7",
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
    color: colors.primary,
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
  speechToggle: {
    alignItems: "center",
    backgroundColor: "#E6F4F1",
    borderColor: "#C9DEDA",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 10,
  },
  speechToggleStop: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  speechToggleText: {
    color: colors.primary,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "900",
  },
  speechToggleTextActive: {
    color: "#FFFFFF",
  },
  statusText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 10,
    textAlign: "center",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36,
  },
  voiceButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 16,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 12,
  },
  voiceButtonActive: {
    backgroundColor: "#E76F51",
  },
  voiceButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  voiceRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
});
