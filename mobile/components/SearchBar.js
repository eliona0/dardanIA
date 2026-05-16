import { StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SearchBar({
  onChangeText,
  placeholder = "Kërko shërbime ose lokacione...",
  suggestions = [],
  value,
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.inputRow}>
        <Ionicons color="#6A97B2" name="search" size={20} />
        <TextInput
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#6A97B2"
          style={styles.input}
          value={value}
        />
      </View>

      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          <Text style={styles.suggestionLabel}>Sugjerime</Text>
          {suggestions.map((suggestion) => (
            <View key={suggestion} style={styles.suggestionItem}>
              <Ionicons color="#356F94" name="sparkles-outline" size={15} />
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
    borderColor: "#C6D6DE",
    borderRadius: 18,
    borderWidth: 1,
    elevation: 2,
    flexDirection: "row",
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 15,
    shadowColor: "#2F2D2E",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
  },
  input: {
    color: "#2F2D2E",
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    minWidth: 0,
  },
  suggestions: {
    backgroundColor: "#FFFFFF",
    borderColor: "#C6D6DE",
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 10,
    padding: 12,
  },
  suggestionLabel: {
    color: "#6A97B2",
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
    color: "#2F2D2E",
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
  },
});
