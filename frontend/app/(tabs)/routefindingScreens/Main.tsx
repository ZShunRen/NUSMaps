import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef  } from "react";
import { StyleSheet, View, Text } from "react-native";
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  Region,
  LatLng,
} from "react-native-maps";
import * as Location from "expo-location";
import { RouteSearchBar } from "@/components/RouteSearchBar";
import Toast from "react-native-toast-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { GooglePlaceData } from "react-native-google-places-autocomplete";
import { useRouter, useSegments } from "expo-router";
import Constants from "expo-constants";
import axios from 'axios';
import { baseResultsCardType, destinationType } from "@/types";

//constants and variablesEXPO_PUBLIC_MAPS_API_KEY
const mapsApiKey = process.env.EXPO_PUBLIC_GOOGLEMAPS_API_KEY == undefined ? Constants.expoConfig.extra.EXPO_PUBLIC_GOOGLEMAPS_API_KEY : process.env.EXPO_PUBLIC_GOOGLEMAPS_API_KEY ;
const oneMapsAPIToken = process.env.EXPO_PUBLIC_ONEMAPAPITOKEN == undefined ?  Constants.expoConfig.extra.EXPO_PUBLIC_ONEMAPAPITOKEN : process.env.EXPO_PUBLIC_ONEMAPAPITOKEN;
const App = forwardRef((props, ref) => {
  //hooks
  const router = useRouter();
  const segments = useSegments();
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObjectCoords>({
      latitude: 1.3521,
      longitude: 103.8198,
      altitude: null,
      accuracy: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    });
  const [region, setRegion] = useState<Region>({
    latitude: 1.3521, // Default to Singapore's latitude
    longitude: 103.8198, // Default to Singapore's longitude
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [permissionErrorMsg, setPermissionErrorMsg] = useState("");
  const [locationErrorMsg, setLocationErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false); //state used to maintain whether to show the user the loading screen
  const [routeErrorMsg, setRouteErrorMsg] = useState("");
  const DEFAULTDESTINATIONLatLng = {
    latitude: NaN,
    longitude: NaN,
    address: "DEFAULT",
    placeId: "DEFAULT",
  };
  const [destination, setDestination] = useState<destinationType>(
    DEFAULTDESTINATIONLatLng
  );
  const isNotInitialExec = useRef(false);

  //effects arranged in execution order
  //flow goes as follows: (1) Location Permissions + Denial error mesages
  //(2)Location error messages even when current permission is enabled
  //(3)Route error messages when unable to query backend
  //(4) State changes when user inputs a new destination, leading to a new visible modal
  //(5)

  const showLoadingScreen = () => {
    router.push({
      pathname:"../routefindingScreens/loadingScreen",
    });
  };
  // const showResultsScreenAfterLoading = (originCoords, destCoords, ) => {

  // }

  useEffect(()=> {
    // if (!isNotInitialExec.current) {
      //not the initial load
      if (isLoading) {
        showLoadingScreen();
      } // nothing is done if set to false, as the other use effect will handle the replacement of the screen with the results screen
    // }
  }
  , [isLoading]);

  useEffect(() => {
    //to query for location permission
    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        setPermissionErrorMsg("Permission to access location was denied.");
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        console.log(location);
        setCurrentLocation(location.coords);
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } catch (error) {
        setLocationErrorMsg(`Failed to obtain location, ${error}`);
        console.error("Failed to obtain location.", error);
      }
    };
    getLocation();
  }, []);

  useEffect(() => {
    // Toast to display error from denial of gps permission
    if (permissionErrorMsg != "") {
      Toast.show({
        type: "error",
        text1: permissionErrorMsg,
        text2: "Please try again later",
        position: "top",
        autoHide: true,
      });
    }
  }, [permissionErrorMsg]);

  useEffect(() => {
    //Toast to display error from inability to fetch location even with gps permission
    if (locationErrorMsg != "") {
      Toast.show({
        type: "error",
        text1: locationErrorMsg,
        text2: "Please try again later",
        position: "top",
        autoHide: true,
      });
    }
  }, [locationErrorMsg]);

  useEffect(() => {
    //Toast to display error from inability to fetch route from backend
    if (routeErrorMsg != "") {
      Toast.show({
        type: "error",
        text1: routeErrorMsg,
        text2: "Please try again later",
        position: "top",
        autoHide: true,
      });
    }
  }, [routeErrorMsg]);

  useEffect(() => {
    //function that is executed when destination is changed (a new search result is attained)
    if (isNotInitialExec.current && destination !== DEFAULTDESTINATIONLatLng) {
      console.log("new destination: ", destination);
      fetchBestRoute(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
        {
          latitude: destination.latitude,
          longitude: destination.longitude,
        }
      ); //this will return back the gps coordinates which are then sent to the api
      return;
    } else {
      isNotInitialExec.current = true;
    }
  }, [destination]);

  //async functions
  async function getDestinationResult(data: GooglePlaceData) {
    //slight delay
    //sometimes doesnt always get called when clicked on
    const reversedDestinationLatLng = await getLatLngFromId(data.place_id);
    console.log("reversed: ", reversedDestinationLatLng);
    if (reversedDestinationLatLng != undefined) {
      setDestination({
        latitude: reversedDestinationLatLng.latitude,
        longitude: reversedDestinationLatLng.longitude,
        address: data.description,
        placeId: data.place_id,
      });
    }
  };

  async function getLatLngFromId(placeId: string) {
    //reverses geocoding
    try {
      const response = await axios.get(
        `https://places.googleapis.com/v1/places/${placeId}?fields=location&key=${mapsApiKey}`
      );
      const jsonResultOject = response.data;
      console.log('result object:', jsonResultOject);
      const result = {
        latitude: jsonResultOject.location.latitude,
        longitude: jsonResultOject.location.longitude
      };
      return result;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error(`HTTP error: ${error.response.status}`);
        } else if (error.request) {
          console.error("Request error: No response received");
        } else {
          console.error("Error:", error.message);
        };
      } else {
        console.error("Non axios error:", error);
      }
    }
  }; 

  async function fetchRoutesFromServer(
    origin: LatLng,
    destination: LatLng
  ): Promise<baseResultsCardType[]> {
    if (oneMapsAPIToken) {
      try {
        console.log("Origin location:", origin);
        const response = await axios.post(
          "https://nusmaps.onrender.com/transportRoute",
            {
              origin: origin,
              destination: destination,
            },
            {
              headers: {
              "Content-Type": "application/json",
              Authorization: oneMapsAPIToken,
            },
          }
        );
        return response.data;
      } catch (error) {
        setRouteErrorMsg("Server issues, please try again later. SERVER ERROR");
        console.error(
          "Route could not be found. Please try again later: ",error
        );
        throw new Error("Route could not be found. Please try again later");
      }
    } else {
      setRouteErrorMsg("Server issues, please try again later. API TOKEN ERROR");
      console.error("api token for OneMap not declared. Check server settings");
      throw new Error("API token could not be found. Please try again");
    }
  }

  async function fetchBestRoute(
    originCoords: LatLng,
    destinationCoords: LatLng
  ) {
    //fetches best route between two points, can pass a check to see if
      setIsLoading(true);
      const result = await fetchRoutesFromServer(
        originCoords,
        destinationCoords
      );
      console.log("finally", result);
      console.log('Current path:', segments.join('/'));
      setIsLoading(false);
      router.replace({
        pathname: "../routefindingScreens/ResultsScreen",
        params: {
          origin: JSON.stringify(originCoords),
          destination: JSON.stringify(destination),
          baseResultsData: JSON.stringify(result),
        },
      });
    };

  useImperativeHandle(ref, () => ({
    fetchRoutesFromServer, fetchBestRoute, getDestinationResult, getLatLngFromId, setDestination
  }));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <MapView style={styles.map} provider={PROVIDER_GOOGLE} region={region} testID="current-location-map">
          {currentLocation && (
            <Marker
              testID="current-location-marker"
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }}
              title="Your Location"
            />
          )}
        </MapView>
        <View style={styles.overlay}>
          <View style={{ paddingTop: "5%" }}>
            <RouteSearchBar
              location={currentLocation}
              getDestinationResult={getDestinationResult}
              testID="dest-search-bar"
            />
          </View>
        </View>
      </View>
    </GestureHandlerRootView>
  );
});



//stylesheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 50,
    alignContent: "center",
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0)",
  },
});
export default App;