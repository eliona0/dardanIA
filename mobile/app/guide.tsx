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

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://172.16.103.5:4000";

export default function GuideScreen() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<GuideResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Nuk mund ta gjej shërbimin.");
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
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>KuMeShku</Text>
      <TextInput
        style={styles.input}
        value={question}
        onChangeText={setQuestion}
        placeholder="P.sh. Ku të shkoj për certifikatë të lindjes?"
        multiline
        textAlignVertical="top"
      />

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={askGuide}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Pyet KuMeShku</Text>}
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {result ? (
        <View style={styles.result}>
          <Text style={styles.answer}>{result.friendlyAnswer}</Text>

          <InfoRow label="Shërbimi" value={result.service} />
          <InfoRow label="Institucioni" value={result.institution} />
          <InfoRow label="Zyra" value={result.office} />
          <InfoRow label="Kati" value={result.floor} />
          <InfoRow label="Pritja" value={result.estimatedWait} />

          <Text style={styles.sectionTitle}>Dokumentet</Text>
          {result.documents.map((document) => (
            <Text key={document} style={styles.listItem}>
              - {document}
            </Text>
          ))}

          <Text style={styles.sectionTitle}>Hapat</Text>
          {result.steps.map((step, index) => (
            <Text key={step} style={styles.listItem}>
              {index + 1}. {step}
            </Text>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f6f7f9",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#172033",
    marginBottom: 16,
  },
  input: {
    minHeight: 112,
    borderWidth: 1,
    borderColor: "#cfd6e4",
    borderRadius: 8,
    padding: 14,
    backgroundColor: "#fff",
    fontSize: 16,
    color: "#172033",
  },
  button: {
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#126b5f",
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  error: {
    color: "#b42318",
    marginTop: 12,
    fontSize: 15,
  },
  result: {
    marginTop: 20,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  answer: {
    fontSize: 16,
    lineHeight: 23,
    color: "#172033",
    marginBottom: 16,
  },
  row: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#edf1f7",
  },
  label: {
    fontSize: 13,
    color: "#667085",
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    color: "#172033",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 17,
    color: "#172033",
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  listItem: {
    fontSize: 15,
    lineHeight: 22,
    color: "#344054",
    marginBottom: 4,
  },
});
