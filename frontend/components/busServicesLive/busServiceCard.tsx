import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import ColouredCircle from "@/components/ColouredCircle";
import mapBusServiceColour from "@/utils/mapBusServiceColor";

interface ServiceCardProps {
  busService: string;
  busStops: string[]; // the stops shown in the detailed screen
  displayedStops: string[]; // the stops that are shown in the card
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ busService, busStops, displayedStops }) => {
  let stops = displayedStops.flatMap((stop: string) => [stop, "rightArrow"]);
  stops.pop(); //removes the last arrow
  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardContentContainer}>
        <ColouredCircle color={mapBusServiceColour(busService)} size={15} />
        <View style={styles.textContainer}>
          <Text style={styles.busServiceText}>{busService}</Text>
          <View style={styles.busStopArrowContainer}>
            {stops.map((stop, index) => {
              if (stop == "rightArrow") {
                return <MaterialCommunityIcons key={index} name="chevron-right" size={20} color="black" />;
              } else {
                return (
                  <Text style={styles.stopText} key={index}>
                    {stop}
                  </Text>
                );
              }
            })}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ccc",
    borderWidth: 0.5,
    marginVertical: 5,
    marginHorizontal: 14,
    borderRadius: 5,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.2,
  },
  cardContentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  textContainer: {
    marginHorizontal: 12,
    flex: 1, // Allow the text container to take up remaining space
  },
  busStopArrowContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  busServiceText: {
    fontFamily: "Inter-Bold",
    marginBottom: 4, // Add some space between bus service text and stops
  },
  stopText: {
    fontFamily: "Inter-Regular",
  },
});

export default ServiceCard;
