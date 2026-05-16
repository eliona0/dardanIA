import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import BottomNav from "../../components/BottomNav";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://172.16.103.5:4000";

const severityStyles = {
  high: {
    label: "I lartë",
    backgroundColor: "#E4EDF1",
    color: "#356F94",
  },
  medium: {
    label: "Mesatar",
    backgroundColor: "#E4EDF1",
    color: "#6A97B2",
  },
  low: {
    label: "I ulët",
    backgroundColor: "#E4EFE3",
    color: "#5B7B57",
  },
};

const statusStyles = {
  pending: {
    label: "Në pritje",
    backgroundColor: "#E4EDF1",
    color: "#356F94",
  },
  default: {
    label: "Hapur",
    backgroundColor: "#F2F5EA",
    color: "#2F2D2E",
  },
};

const categoryLabels = {
  accessibility: "Qasje",
  road_damage: "Dëmtim rruge",
  blocked_sidewalk: "Trotuar i bllokuar",
  waste: "Mbeturina",
  public_lighting: "Ndriçim publik",
  water_issue: "Problem me ujë",
  public_transport: "Transport publik",
  other: "Tjetër",
};

const routeToScreen = {
  "/": "Home",
  "/accessibility": "Accessibility",
  "/dashboard": "Dashboard",
  "/report": "Report",
};

const getSeverityStyle = (severity) =>
  severityStyles[String(severity || "").toLowerCase()] || severityStyles.low;

const getStatusStyle = (status) =>
  statusStyles[String(status || "").toLowerCase()] || statusStyles.default;

const formatCategory = (category) => {
  if (!category) {
    return "Rast qytetar";
  }

  return categoryLabels[category] || String(category).replace(/_/g, " ");
};

const formatDate = (value) => {
  if (!value) {
    return "Raportuar së fundmi";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Raportuar së fundmi";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const StatCard = ({ accentColor, label, value }) => (
  <View style={styles.statCard}>
    <View style={[styles.statAccent, { backgroundColor: accentColor }]} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const Badge = ({ styleConfig }) => (
  <View style={[styles.badge, { backgroundColor: styleConfig.backgroundColor }]}>
    <Text style={[styles.badgeText, { color: styleConfig.color }]}>
      {styleConfig.label}
    </Text>
  </View>
);

const CaseCard = ({ item }) => {
  const severityStyle = getSeverityStyle(item.severity);
  const statusStyle = getStatusStyle(item.status);

  return (
    <View style={styles.caseCard}>
      <View style={styles.caseTopRow}>
        <Text style={styles.caseCategory}>{formatCategory(item.category)}</Text>
        <Text style={styles.caseDate}>{formatDate(item.createdAt)}</Text>
      </View>

      <Text style={styles.caseTitle} numberOfLines={2}>
        {item.title || "Rast pa titull"}
      </Text>

      <Text style={styles.caseSummary} numberOfLines={3}>
        {item.summary || "Ende nuk ka përmbledhje."}
      </Text>

      <View style={styles.caseFooter}>
        <View style={styles.badgeRow}>
          <Badge styleConfig={severityStyle} />
          <Badge styleConfig={statusStyle} />
        </View>

        {!!item.recommendedInstitution && (
          <Text style={styles.institution} numberOfLines={1}>
            {item.recommendedInstitution}
          </Text>
        )}
      </View>
    </View>
  );
};

export default function DashboardScreen({ navigation }) {
  const [cases, setCases] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const navigateTab = (route) => {
    if (navigation) {
      navigation.navigate(routeToScreen[route] || "Home");
      return;
    }

    router.push(route);
  };

  const fetchCases = async ({ refreshing = false } = {}) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError("");

    try {
      const response = await fetch(`${API_URL}/api/cases`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Rastet nuk mund të ngarkohen.");
      }

      setCases(Array.isArray(payload) ? payload : []);
    } catch (fetchError) {
      setError(fetchError.message || "Rastet nuk mund të ngarkohen.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const stats = useMemo(() => {
    const highPriorityCases = cases.filter(
      (item) => String(item.severity || "").toLowerCase() === "high",
    );
    const accessibilityCases = cases.filter(
      (item) => item.category === "accessibility",
    );
    const pendingCases = cases.filter(
      (item) => String(item.status || "").toLowerCase() === "pending",
    );

    return [
      {
        label: "Gjithsej raste",
        value: cases.length,
        accentColor: "#356F94",
      },
      {
        label: "Prioritet i lartë",
        value: highPriorityCases.length,
        accentColor: "#356F94",
      },
      {
        label: "Qasje",
        value: accessibilityCases.length,
        accentColor: "#6A97B2",
      },
      {
        label: "Në pritje",
        value: pendingCases.length,
        accentColor: "#5B7B57",
      },
    ];
  }, [cases]);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchCases({ refreshing: true })}
            tintColor="#356F94"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>dardanIA</Text>
          <Text style={styles.title}>Paneli</Text>
          <Text style={styles.subtitle}>
            Përmbledhje e rasteve qytetare dhe të qasjes.
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color="#356F94" size="large" />
            <Text style={styles.stateTitle}>Duke ngarkuar panelin</Text>
            <Text style={styles.stateText}>
              Po marrim rastet e raportuara së fundmi...
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.statsGrid}>
              {stats.map((stat) => (
                <StatCard
                  key={stat.label}
                  accentColor={stat.accentColor}
                  label={stat.label}
                  value={stat.value}
                />
              ))}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Rastet e fundit</Text>
              <Text style={styles.sectionCount}>{cases.length}</Text>
            </View>

            {!!error && (
              <View style={styles.errorCard}>
                <Text style={styles.errorTitle}>Rastet nuk mund të rifreskohen</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {cases.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={styles.emptyIcon}>0</Text>
                <Text style={styles.stateTitle}>No cases reported yet</Text>
                <Text style={styles.stateText}>
                  New civic and accessibility reports will appear here as soon as
                  they are submitted.
                </Text>
              </View>
            ) : (
              <View style={styles.caseList}>
                {cases.map((item, index) => (
                  <CaseCard key={item.id || `${item.title}-${index}`} item={item} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
      <BottomNav activeTab="Dashboard" onNavigate={navigateTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F2F5EA",
  },
  content: {
    padding: 20,
    paddingBottom: 112,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 22,
  },
  eyebrow: {
    color: "#356F94",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: {
    color: "#2F2D2E",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0,
  },
  subtitle: {
    color: "#6A97B2",
    fontSize: 16,
    lineHeight: 23,
    marginTop: 8,
    maxWidth: 320,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8E1D0",
    borderRadius: 20,
    borderWidth: 1,
    elevation: 3,
    minHeight: 116,
    padding: 16,
    shadowColor: "#2F2D2E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    width: "48%",
  },
  statAccent: {
    borderRadius: 999,
    height: 8,
    marginBottom: 18,
    width: 42,
  },
  statValue: {
    color: "#2F2D2E",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0,
  },
  statLabel: {
    color: "#6A97B2",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#2F2D2E",
    fontSize: 20,
    fontWeight: "900",
  },
  sectionCount: {
    backgroundColor: "#E4EDF1",
    borderRadius: 999,
    color: "#356F94",
    fontSize: 13,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  caseList: {
    gap: 14,
  },
  caseCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8E1D0",
    borderRadius: 22,
    borderWidth: 1,
    elevation: 2,
    padding: 16,
    shadowColor: "#2F2D2E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
  },
  caseTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  caseCategory: {
    color: "#356F94",
    flex: 1,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.3,
    marginRight: 12,
    textTransform: "uppercase",
  },
  caseDate: {
    color: "#6A97B2",
    fontSize: 12,
    fontWeight: "700",
  },
  caseTitle: {
    color: "#2F2D2E",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 23,
  },
  caseSummary: {
    color: "#6A97B2",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  caseFooter: {
    borderTopColor: "#D8E1D0",
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 14,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "900",
  },
  institution: {
    color: "#2F2D2E",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 12,
  },
  stateCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#D8E1D0",
    borderRadius: 24,
    borderWidth: 1,
    elevation: 2,
    marginTop: 10,
    padding: 24,
    shadowColor: "#2F2D2E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
  },
  stateTitle: {
    color: "#2F2D2E",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 14,
    textAlign: "center",
  },
  stateText: {
    color: "#6A97B2",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
    textAlign: "center",
  },
  emptyIcon: {
    backgroundColor: "#E4EFE3",
    borderRadius: 999,
    color: "#5B7B57",
    fontSize: 24,
    fontWeight: "900",
    height: 48,
    lineHeight: 48,
    overflow: "hidden",
    textAlign: "center",
    width: 48,
  },
  errorCard: {
    backgroundColor: "#E4EDF1",
    borderColor: "#C6D6DE",
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
    padding: 14,
  },
  errorTitle: {
    color: "#356F94",
    fontSize: 14,
    fontWeight: "900",
  },
  errorText: {
    color: "#2F2D2E",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
});
