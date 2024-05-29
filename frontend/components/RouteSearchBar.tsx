import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View, ViewStyle, TextStyle, ImageStyle } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import * as Location from "expo-location";
// import { REACT_APP_API_KEY } from '@env';
type Coords = {
  latitude: number;
  longitude: number;
}

const RouteSearchBar = (location: Location.LocationObjectCoords) => {
  let curr_location : Coords;
  if (Object.keys(location).length === 0 ) {
    //checks if location is empty(no permissions yet)
    curr_location = {
      latitude: 1.3521,
      longitude: 103.8198
    };
  } else {
    curr_location = {
      latitude: location.latitude,
      longitude: location.longitude
    };
  }
  const [Query, setQuery] = useState('');
  const resultScreen = () => {
    <Modal animationType="slide" presentationStyle="pageSheet">
      <ScrollView>
      </ScrollView>
    </Modal>
  }

  const handlePress = () => {
    console.log("Search bar pressed (to expand)");
  };
  return (
    <View>
      <GooglePlacesAutocomplete
        placeholder='Search' onPress={(data, details = null) => {
          // 'details' is provided when fetchDetails = true
          console.log(data, details);
        }} query={{
          key: 'AIzaSyBebj_t1eOUT4Rv1Kd2Q60UX9SW_pY99ik',
          language: 'en',
          location: {
              latitude: curr_location.latitude,
              longitude: curr_location.longitude,
          },
          radius : 5000,
          components: 'country:sg',
          locationbias: `circle:1000@${curr_location.latitude},${curr_location.longitude}`
          //might need current location to work more effectively
        }}
        styles = {{textInputContainer:styles.googleSearchBar}}
        />
      </View>
    );
}

  const styles = StyleSheet.create({
    text: {
      fontSize: 14,
      color: "#828282",
    },
    wrapperCustom: {
      borderRadius: 12,
      padding: 13,
      margin: 16,
      textAlign: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "#828282",
    },
    googleSearchBar : {
        width: "90%",
        alignSelf: "center",
      },
    }
  );
export default RouteSearchBar;
