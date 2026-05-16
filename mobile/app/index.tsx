import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import BottomNav from "../components/BottomNav";
import CaseCard from "../components/CaseCard";
import MapViewComponent from "../components/MapViewComponent";
import QuickActionCard from "../components/QuickActionCard";
import SearchBar from "../components/SearchBar";
import { mockCases } from "../components/mockCases";

const primary = "#356F94";
const secondary = "#6A97B2";
const success = "#5B7B57";
const background = "#F2F5EA";
const text = "#2F2D2E";

const actions = [
  {
    color: primary,
    icon: "camera-plus-outline",
    iconFamily: "MaterialCommunityIcons",
    route: "/report",
    screen: "Report",
    title: "Raporto problem",
  },
  {
    color: success,
    icon: "accessibility",
    iconFamily: "Ionicons",
    route: "/accessibility",
    screen: "Accessibility",
    title: "Kontrollo qasjen",
  },
  {
    color: secondary,
    icon: "business-outline",
    iconFamily: "Ionicons",
    route: "/guide",
    screen: "Guide",
    title: "Ku me shku?",
  },
  {
    color: "#356F94",
    icon: "map-outline",
    iconFamily: "Ionicons",
    route: "/map",
    screen: "Map",
    title: "Shiko hartën",
  },
];

const tips = [
  "Kontrollo nëse një hapësirë është e qasshme",
  "Raporto probleme në qytet brenda pak sekondave",
  "Gjej ku duhet të shkosh për shërbime publike",
];

export function HomeLanding({
  onCaseNavigate,
  onNavigate,
  onTabNavigate,
}: {
  onCaseNavigate?: (caseId: string) => void;
  onNavigate?: (action: typeof actions[number]) => void;
  onTabNavigate?: (route: string) => void;
}) {
  const [query, setQuery] = useState("");

  const handleNavigate = (action: typeof actions[number]) => {
    if (onNavigate) {
      onNavigate(action);
      return;
    }

    router.push(action.route as never);
  };

  const handleCaseNavigate = (caseId: string) => {
    if (onCaseNavigate) {
      onCaseNavigate(caseId);
      return;
    }

    router.push(`/case/${caseId}` as never);
  };

  const handleTabNavigate = (route: string) => {
    if (onTabNavigate) {
      onTabNavigate(route);
      return;
    }

    router.push(route as never);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons color="#FFFFFF" name="navigate" size={23} />
          </View>
          <Text style={styles.title}>dardanIA</Text>
          <Text style={styles.subtitle}>
            Raporto probleme, kontrollo qasjen dhe gjej shërbime publike pranë teje.
          </Text>
        </View>

        <SearchBar
          onChangeText={setQuery}
          placeholder="Kërko shërbime ose lokacione..."
          value={query}
        />

        <View style={styles.actionGrid}>
          {actions.map((action) => (
            <QuickActionCard
              color={action.color}
              icon={action.icon}
              iconFamily={action.iconFamily}
              key={action.title}
              onPress={() => handleNavigate(action)}
              title={action.title}
            />
          ))}
        </View>

        <View style={styles.mapCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Raste pranë teje</Text>
              <Text style={styles.sectionHint}>Zona e Prishtinës</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => handleNavigate(actions[3])}
              style={styles.mapButton}
            >
              <Text style={styles.mapButtonText}>Hape hartën</Text>
            </Pressable>
          </View>
          <MapViewComponent
            cases={mockCases}
            height={190}
            onCasePress={(caseItem: any) => handleCaseNavigate(caseItem.id)}
            onMarkerPress={(caseItem: any) => handleCaseNavigate(caseItem.id)}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Rastet e fundit</Text>
          <Text style={styles.sectionHint}>Raportimet më të reja</Text>
        </View>

        <View style={styles.caseList}>
          {mockCases.slice(0, 4).map((caseItem) => (
            <CaseCard
              key={caseItem.id}
              {...caseItem}
              onPress={() => handleCaseNavigate(caseItem.id)}
            />
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Çfarë mund të bësh</Text>
          {tips.map((tip) => (
            <View key={tip} style={styles.tipRow}>
              <MaterialCommunityIcons color={primary} name="check-circle-outline" size={18} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <BottomNav activeTab="Home" onNavigate={handleTabNavigate} />
    </View>
  );
}

export default function HomeScreen() {
  return <HomeLanding />;
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: background,
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 108,
  },
  header: {
    backgroundColor: primary,
    borderColor: secondary,
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
  },
  headerIcon: {
    alignItems: "center",
    backgroundColor: primary,
    borderRadius: 16,
    height: 48,
    justifyContent: "center",
    marginBottom: 14,
    width: 48,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 34,
  },
  subtitle: {
    color: "#EAF2F6",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    marginTop: 6,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 18,
  },
  mapCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8E1D0",
    borderRadius: 22,
    borderWidth: 1,
    elevation: 3,
    marginTop: 22,
    padding: 14,
    shadowColor: text,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 22,
  },
  sectionTitle: {
    color: text,
    fontSize: 19,
    fontWeight: "900",
  },
  sectionHint: {
    color: secondary,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  mapButton: {
    backgroundColor: "#E4EDF1",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mapButtonText: {
    color: primary,
    fontSize: 12,
    fontWeight: "900",
  },
  caseList: {
    gap: 12,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8E1D0",
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 22,
    padding: 16,
  },
  infoTitle: {
    color: text,
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 10,
  },
  tipRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
    paddingVertical: 6,
  },
  tipText: {
    color: text,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
});
