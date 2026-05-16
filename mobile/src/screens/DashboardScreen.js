import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
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
    backgroundColor: "#FCEBE6",
    color: "#E76F51",
  },
  medium: {
    label: "Mesatar",
    backgroundColor: "#FFF4E6",
    color: "#F4A261",
  },
  low: {
    label: "I ulët",
    backgroundColor: "#E6F4F1",
    color: "#2A9D8F",
  },
};

const statusStyles = {
  pending: {
    label: "Në pritje",
    backgroundColor: "#E6F4F1",
    color: "#264653",
  },
  default: {
    label: "Hapur",
    backgroundColor: "#F7FAF9",
    color: "#1F2933",
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

const severityFilterOptions = [
  { label: "Të gjitha", value: "all" },
  { label: "I ulët", value: "low" },
  { label: "Mesatar", value: "medium" },
  { label: "I lartë", value: "high" },
];

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

const getLocationParts = (item) => {
  const location = item?.location;

  if (location && typeof location === "object") {
    return {
      city: location.city || item.city || "",
      neighborhood: location.neighborhood || "",
      display: item.address || [location.city, location.neighborhood].filter(Boolean).join(", "),
    };
  }

  return {
    city: item?.city || (typeof location === "string" ? location : ""),
    neighborhood: "",
    display: item?.address || (typeof location === "string" ? location : ""),
  };
};

const getUniqueOptions = (items, getter) => {
  const values = items
    .map(getter)
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  return ["all", ...Array.from(new Set(values))];
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

const FilterRow = ({ label, options, selectedValue, onSelect }) => (
  <View style={styles.filterGroup}>
    <Text style={styles.filterLabel}>{label}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.filterOptions}>
        {options.map((option) => {
          const value = typeof option === "string" ? option : option.value;
          const optionLabel =
            typeof option === "string" ? (option === "all" ? "Të gjitha" : option) : option.label;
          const isActive = selectedValue === value;

          return (
            <Pressable
              accessibilityRole="button"
              key={value}
              onPress={() => onSelect(value)}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {optionLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  </View>
);

const CaseCard = ({ item, onPress }) => {
  const severityStyle = getSeverityStyle(item.severity);
  const statusStyle = getStatusStyle(item.status);
  const location = getLocationParts(item);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.caseCard, pressed && styles.caseCardPressed]}
    >
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

      {!!location.display && (
        <Text style={styles.caseLocation} numberOfLines={1}>
          {location.display}
        </Text>
      )}

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
    </Pressable>
  );
};

export default function DashboardScreen({ navigation }) {
  const [cases, setCases] = useState([]);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    city: "all",
    neighborhood: "all",
    severity: "all",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const navigateTab = (route) => {
    if (navigation) {
      navigation.reset({ index: 0, routes: [{ name: routeToScreen[route] || "Home" }] });
      return;
    }

    router.replace(route);
  };

  const openCase = (item) => {
    if (navigation) {
      navigation.navigate("Case", { id: item.id, caseItem: item });
      return;
    }

    router.push({
      pathname: "/case/[id]",
      params: {
        id: item.id || "case",
        caseItem: JSON.stringify(item),
      },
    });
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
        accentColor: "#264653",
      },
      {
        label: "Prioritet i lartë",
        value: highPriorityCases.length,
        accentColor: "#E76F51",
      },
      {
        label: "Qasje",
        value: accessibilityCases.length,
        accentColor: "#2A9D8F",
      },
      {
        label: "Në pritje",
        value: pendingCases.length,
        accentColor: "#F4A261",
      },
    ];
  }, [cases]);

  const cityOptions = useMemo(
    () => getUniqueOptions(cases, (item) => getLocationParts(item).city),
    [cases],
  );

  const neighborhoodOptions = useMemo(
    () =>
      getUniqueOptions(
        filters.city === "all"
          ? cases
          : cases.filter((item) => getLocationParts(item).city === filters.city),
        (item) => getLocationParts(item).neighborhood,
      ),
    [cases, filters.city],
  );

  const filteredCases = useMemo(
    () =>
      cases.filter((item) => {
        const location = getLocationParts(item);
        const severity = String(item.severity || "").toLowerCase();

        return (
          (filters.city === "all" || location.city === filters.city) &&
          (filters.neighborhood === "all" || location.neighborhood === filters.neighborhood) &&
          (filters.severity === "all" || severity === filters.severity)
        );
      }),
    [cases, filters],
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchCases({ refreshing: true })}
            tintColor="#264653"
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
            <ActivityIndicator color="#264653" size="large" />
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

            <View style={styles.filtersCard}>
              <FilterRow
                label="Qyteti"
                options={cityOptions}
                selectedValue={filters.city}
                onSelect={(city) =>
                  setFilters((current) => ({ ...current, city, neighborhood: "all" }))
                }
              />
              <FilterRow
                label="Lagjja"
                options={neighborhoodOptions}
                selectedValue={filters.neighborhood}
                onSelect={(neighborhood) =>
                  setFilters((current) => ({ ...current, neighborhood }))
                }
              />
              <FilterRow
                label="Ashpërsia"
                options={severityFilterOptions}
                selectedValue={filters.severity}
                onSelect={(severity) => setFilters((current) => ({ ...current, severity }))}
              />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Rastet e fundit</Text>
              <Text style={styles.sectionCount}>{filteredCases.length}</Text>
            </View>

            {!!error && (
              <View style={styles.errorCard}>
                <Text style={styles.errorTitle}>Rastet nuk mund të rifreskohen</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {filteredCases.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={styles.emptyIcon}>0</Text>
                <Text style={styles.stateTitle}>
                  {cases.length === 0 ? "No cases reported yet" : "Nuk u gjet asnjë rast"}
                </Text>
                <Text style={styles.stateText}>
                  {cases.length === 0
                    ? "New civic and accessibility reports will appear here as soon as they are submitted."
                    : "Ndrysho filtrat për të parë më shumë raste."}
                </Text>
              </View>
            ) : (
              <View style={styles.caseList}>
                {filteredCases.map((item, index) => (
                  <CaseCard
                    key={item.id || `${item.title}-${index}`}
                    item={item}
                    onPress={() => openCase(item)}
                  />
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
    backgroundColor: "#F7FAF9",
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
    color: "#264653",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: {
    color: "#264653",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0,
  },
  subtitle: {
    color: "#2A9D8F",
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
  filtersCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DDEAE7",
    borderRadius: 20,
    borderWidth: 1,
    elevation: 2,
    gap: 14,
    marginBottom: 24,
    padding: 14,
    shadowColor: "#1F2933",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    color: "#264653",
    fontSize: 13,
    fontWeight: "900",
  },
  filterOptions: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 8,
  },
  filterChip: {
    backgroundColor: "#F7FAF9",
    borderColor: "#C9DEDA",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: "#264653",
    borderColor: "#264653",
  },
  filterChipText: {
    color: "#2A9D8F",
    fontSize: 12,
    fontWeight: "900",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DDEAE7",
    borderRadius: 20,
    borderWidth: 1,
    elevation: 3,
    minHeight: 116,
    padding: 16,
    shadowColor: "#1F2933",
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
    color: "#1F2933",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0,
  },
  statLabel: {
    color: "#2A9D8F",
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
    color: "#264653",
    fontSize: 20,
    fontWeight: "900",
  },
  sectionCount: {
    backgroundColor: "#E6F4F1",
    borderRadius: 999,
    color: "#264653",
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
    borderColor: "#DDEAE7",
    borderRadius: 22,
    borderWidth: 1,
    elevation: 2,
    padding: 16,
    shadowColor: "#1F2933",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
  },
  caseCardPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  caseTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  caseCategory: {
    color: "#264653",
    flex: 1,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.3,
    marginRight: 12,
    textTransform: "uppercase",
  },
  caseDate: {
    color: "#2A9D8F",
    fontSize: 12,
    fontWeight: "700",
  },
  caseTitle: {
    color: "#1F2933",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 23,
  },
  caseSummary: {
    color: "#2A9D8F",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  caseLocation: {
    color: "#1F2933",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 10,
  },
  caseFooter: {
    borderTopColor: "#DDEAE7",
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
    color: "#1F2933",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 12,
  },
  stateCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#DDEAE7",
    borderRadius: 24,
    borderWidth: 1,
    elevation: 2,
    marginTop: 10,
    padding: 24,
    shadowColor: "#1F2933",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
  },
  stateTitle: {
    color: "#1F2933",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 14,
    textAlign: "center",
  },
  stateText: {
    color: "#2A9D8F",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
    textAlign: "center",
  },
  emptyIcon: {
    backgroundColor: "#E6F4F1",
    borderRadius: 999,
    color: "#2A9D8F",
    fontSize: 24,
    fontWeight: "900",
    height: 48,
    lineHeight: 48,
    overflow: "hidden",
    textAlign: "center",
    width: 48,
  },
  errorCard: {
    backgroundColor: "#FCEBE6",
    borderColor: "#F3C7BA",
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
    padding: 14,
  },
  errorTitle: {
    color: "#E76F51",
    fontSize: 14,
    fontWeight: "900",
  },
  errorText: {
    color: "#1F2933",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
});
