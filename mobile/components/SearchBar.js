import { StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SearchBar({
  onChangeText,
  placeholder = "Search services or locations...",
  suggestions = [],
  value,
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.inputRow}>
        <Ionicons color="#64748B" name="search" size={20} />
        <TextInput
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          style={styles.input}
          value={value}
        />
      </View>

      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          <Text style={styles.suggestionLabel}>Suggestions</Text>
          {suggestions.map((suggestion) => (
            <View key={suggestion} style={styles.suggestionItem}>
              <Ionicons color="#4F46E5" name="sparkles-outline" size={15} />
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 16,
  },
  inputRow: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E7EAF2",
    borderRadius: 18,
    borderWidth: 1,
    elevation: 2,
    flexDirection: "row",
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 15,
    shadowColor: "#0F172A",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
  },
  input: {
    color: "#111827",
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    minWidth: 0,
  },
  suggestions: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E7EAF2",
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 10,
    padding: 12,
  },
  suggestionLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  suggestionItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingVertical: 7,
  },
  suggestionText: {
    color: "#1F2937",
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
  },
});
