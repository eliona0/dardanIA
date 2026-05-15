import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import BottomNav from "./BottomNav";
import { mockCases } from "./mockCases";

const severityColors = {
  high: "#EF4444",
  medium: "#F97316",
  low: "#22C55E",
};

export default function CaseDetailsContent({ activeTab = "Home", caseId, onTabNavigate }) {
  const caseItem = mockCases.find((item) => item.id === caseId) || mockCases[0];
  const severityColor = severityColors[caseItem.severity] || "#22C55E";

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons color="#4F46E5" name={caseItem.icon} size={24} />
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
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.paragraph}>{caseItem.description}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {caseItem.recommendations?.length ? (
            caseItem.recommendations.map((recommendation) => (
              <View key={recommendation} style={styles.recommendationRow}>
                <View style={styles.dot} />
                <Text style={styles.recommendationText}>{recommendation}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.paragraph}>No recommendations available yet.</Text>
          )}
        </View>
      </ScrollView>

      <BottomNav activeTab={activeTab} onNavigate={onTabNavigate} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#F7F8FC",
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 112,
  },
  header: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E7EAF2",
    borderRadius: 26,
    borderWidth: 1,
    elevation: 4,
    padding: 18,
    shadowColor: "#0F172A",
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderRadius: 18,
    height: 54,
    justifyContent: "center",
    marginBottom: 14,
    width: 54,
  },
  title: {
    color: "#111827",
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
    color: "#64748B",
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
    borderColor: "#E7EAF2",
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 8,
  },
  paragraph: {
    color: "#475569",
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
    color: "#475569",
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },
  dot: {
    backgroundColor: "#4F46E5",
    borderRadius: 999,
    height: 7,
    marginTop: 8,
    width: 7,
  },
});
