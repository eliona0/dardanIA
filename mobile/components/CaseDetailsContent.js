import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import BottomNav from "./BottomNav";
import { mockCases } from "./mockCases";

const severityColors = {
  high: "#E76F51",
  medium: "#F4A261",
  low: "#2A9D8F",
};

const getLocationText = (caseItem) => {
  const location = caseItem?.location;

  if (caseItem?.address) {
    return caseItem.address;
  }

  if (location && typeof location === "object") {
    return [location.city, location.neighborhood].filter(Boolean).join(", ");
  }

  return location || caseItem?.city || "Nuk është dhënë lokacion.";
};

const getRecommendations = (caseItem) => {
  if (Array.isArray(caseItem?.recommendations)) {
    return caseItem.recommendations;
  }

  if (Array.isArray(caseItem?.detectedBarriers)) {
    return caseItem.detectedBarriers;
  }

  return [];
};

export default function CaseDetailsContent({ activeTab = "Home", caseId, caseItem: providedCase, onTabNavigate }) {
  const caseItem = providedCase || mockCases.find((item) => item.id === caseId) || mockCases[0];
  const severityColor = severityColors[caseItem.severity] || "#2A9D8F";
  const summary = caseItem.summary || caseItem.description || caseItem.officialReport || "Nuk ka përmbledhje.";
  const recommendations = getRecommendations(caseItem);
  const institution =
    caseItem.recommendedInstitution || caseItem.institutionName || "Institucioni nuk është caktuar.";
  const locationText = getLocationText(caseItem);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons color="#264653" name={caseItem.icon || "document-text-outline"} size={24} />
          </View>
          <Text style={styles.title}>{caseItem.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.category}>{caseItem.category}</Text>
            <View style={[styles.severityBadge, { backgroundColor: `${severityColor}18` }]}>
              <Text style={[styles.severityText, { color: severityColor }]}>
                {caseItem.severity.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Përmbledhje</Text>
          <Text style={styles.paragraph}>{summary}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Rekomandime</Text>
          {recommendations.length ? (
            recommendations.map((recommendation) => (
              <View key={recommendation} style={styles.recommendationRow}>
                <View style={styles.dot} />
                <Text style={styles.recommendationText}>{recommendation}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.paragraph}>Ende nuk ka rekomandime.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Institucioni</Text>
          <Text style={styles.paragraph}>{institution}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Lokacioni</Text>
          <Text style={styles.paragraph}>{locationText}</Text>
        </View>
      </ScrollView>

      <BottomNav activeTab={activeTab} onNavigate={onTabNavigate} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#F7FAF9",
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 112,
  },
  header: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DDEAE7",
    borderRadius: 26,
    borderWidth: 1,
    elevation: 4,
    padding: 18,
    shadowColor: "#1F2933",
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: "#E6F4F1",
    borderRadius: 18,
    height: 54,
    justifyContent: "center",
    marginBottom: 14,
    width: 54,
  },
  title: {
    color: "#264653",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 32,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  category: {
    color: "#2A9D8F",
    fontSize: 14,
    fontWeight: "800",
  },
  severityBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  severityText: {
    fontSize: 12,
    fontWeight: "900",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DDEAE7",
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    color: "#264653",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 8,
  },
  paragraph: {
    color: "#1F2933",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 23,
  },
  recommendationRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    paddingVertical: 7,
  },
  recommendationText: {
    color: "#1F2933",
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },
  dot: {
    backgroundColor: "#264653",
    borderRadius: 999,
    height: 7,
    marginTop: 8,
    width: 7,
  },
});
