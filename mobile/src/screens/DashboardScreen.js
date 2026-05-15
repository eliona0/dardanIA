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
    label: "High",
    backgroundColor: "#FEE2E2",
    color: "#B91C1C",
  },
  medium: {
    label: "Medium",
    backgroundColor: "#FFEDD5",
    color: "#C2410C",
  },
  low: {
    label: "Low",
    backgroundColor: "#DCFCE7",
    color: "#15803D",
  },
};

const statusStyles = {
  pending: {
    label: "Pending",
    backgroundColor: "#DBEAFE",
    color: "#1D4ED8",
  },
  default: {
    label: "Open",
    backgroundColor: "#E5E7EB",
    color: "#4B5563",
  },
};

const categoryLabels = {
  accessibility: "Accessibility",
  road_damage: "Road damage",
  blocked_sidewalk: "Blocked sidewalk",
  waste: "Waste",
  public_lighting: "Public lighting",
  water_issue: "Water issue",
  public_transport: "Public transport",
  other: "Other",
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
    return "Civic case";
  }

  return categoryLabels[category] || String(category).replace(/_/g, " ");
};

const formatDate = (value) => {
  if (!value) {
    return "Recently reported";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently reported";
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
        {item.title || "Untitled case"}
      </Text>

      <Text style={styles.caseSummary} numberOfLines={3}>
        {item.summary || "No summary provided yet."}
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
        throw new Error(payload?.error || "Could not load cases.");
      }

      setCases(Array.isArray(payload) ? payload : []);
    } catch (fetchError) {
      setError(fetchError.message || "Could not load cases.");
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
        label: "Total cases",
        value: cases.length,
        accentColor: "#2563EB",
      },
      {
        label: "High priority",
        value: highPriorityCases.length,
        accentColor: "#DC2626",
      },
      {
        label: "Accessibility",
        value: accessibilityCases.length,
        accentColor: "#7C3AED",
      },
      {
        label: "Pending",
        value: pendingCases.length,
        accentColor: "#0891B2",
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
            tintColor="#2563EB"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>QasjaAI</Text>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>
            Overview of reported civic and accessibility cases
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color="#2563EB" size="large" />
            <Text style={styles.stateTitle}>Loading dashboard</Text>
            <Text style={styles.stateText}>
              Fetching the latest reported cases...
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
              <Text style={styles.sectionTitle}>Recent cases</Text>
              <Text style={styles.sectionCount}>{cases.length}</Text>
            </View>

            {!!error && (
              <View style={styles.errorCard}>
                <Text style={styles.errorTitle}>Unable to refresh cases</Text>
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
    backgroundColor: "#F5F7FB",
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
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: {
    color: "#111827",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0,
  },
  subtitle: {
    color: "#64748B",
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
    borderColor: "#EEF2F7",
    borderRadius: 20,
    borderWidth: 1,
    elevation: 3,
    minHeight: 116,
    padding: 16,
    shadowColor: "#0F172A",
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
    color: "#0F172A",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0,
  },
  statLabel: {
    color: "#64748B",
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
    color: "#111827",
    fontSize: 20,
    fontWeight: "900",
  },
  sectionCount: {
    backgroundColor: "#E0F2FE",
    borderRadius: 999,
    color: "#0369A1",
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
    borderColor: "#E8EEF7",
    borderRadius: 22,
    borderWidth: 1,
    elevation: 2,
    padding: 16,
    shadowColor: "#0F172A",
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
    color: "#2563EB",
    flex: 1,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.3,
    marginRight: 12,
    textTransform: "uppercase",
  },
  caseDate: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
  },
  caseTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 23,
  },
  caseSummary: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  caseFooter: {
    borderTopColor: "#F1F5F9",
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
    color: "#475569",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 12,
  },
  stateCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E8EEF7",
    borderRadius: 24,
    borderWidth: 1,
    elevation: 2,
    marginTop: 10,
    padding: 24,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
  },
  stateTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 14,
    textAlign: "center",
  },
  stateText: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
    textAlign: "center",
  },
  emptyIcon: {
    backgroundColor: "#DCFCE7",
    borderRadius: 999,
    color: "#15803D",
    fontSize: 24,
    fontWeight: "900",
    height: 48,
    lineHeight: 48,
    overflow: "hidden",
    textAlign: "center",
    width: 48,
  },
  errorCard: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
    padding: 14,
  },
  errorTitle: {
    color: "#991B1B",
    fontSize: 14,
    fontWeight: "900",
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
});
