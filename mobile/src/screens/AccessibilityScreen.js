import { View, Button, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { analyzeAccessibility } from "../services/api";

export default function AccessibilityScreen() {
  const [image, setImage] = useState(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleAnalyze = async () => {
    const res = await analyzeAccessibility(image);
    console.log(res);
  };

  return (
    <View>
      <Button title="Pick Image" onPress={pickImage} />
      <Button title="Analyze" onPress={handleAnalyze} />

      {image && <Image source={{ uri: image }} style={{ width: 200, height: 200 }} />}
    </View>
  );
}