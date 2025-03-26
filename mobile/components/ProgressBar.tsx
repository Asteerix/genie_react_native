import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface ProgressBarProps {
  progress: number; // Entre 0 et 1
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const percentage = Math.min(Math.max(Math.round(progress * 100), 0), 100);
  return (
    <View style={styles.container}>
      <View style={styles.barBackground}>
        <LinearGradient
          colors={["#FFC0CB", "#FFD700", "#87CEEB"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.barFill, { width: `${percentage}%` }]}
        />
      </View>
      <Text style={styles.percentageText}>{`${percentage}%`}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    marginVertical: 10,
  },
  barBackground: {
    width: "90%",
    height: 8,
    backgroundColor: "#EEE",
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
  },
  percentageText: {
    marginTop: 5,
    fontSize: 14,
    color: "#000",
    fontWeight: "bold",
  },
});

export default ProgressBar;