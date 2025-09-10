import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Alert, Dimensions, View, Linking } from 'react-native';
import {
  Provider as PaperProvider,
  MD3LightTheme,
  Text,
  TextInput,
  Button,
} from 'react-native-paper';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';

// Custom Light Theme (White-based)
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6a1b9a', // Purple
    secondary: '#f50057', // Pink accent
    background: '#ffffff', // Pure white background
    surface: '#ffffff', // White surface
    text: '#212121', // Dark text for contrast
  },
};

type EchoFormProps = {
  locationEnabled: boolean;
  location: Location.LocationObject | null;
};

function EchoForm({ locationEnabled, location }: EchoFormProps) {
  const [input, setInput] = useState('');
  const [echo, setEcho] = useState('');
  const [mapHtml, setMapHtml] = useState('');

  // Generate Google Maps iframe HTML when location changes
  useEffect(() => {
    if (location && location.coords) {
      const { latitude, longitude } = location.coords;
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body, html { margin: 0; padding: 0; height: 100%; }
              iframe { width: 100%; height: 100%; border: none; }
            </style>
          </head>
          <body>
            <iframe
              src="https://www.google.com/maps/embed/v1/view?key=tttt&center=${latitude},${longitude}&zoom=18&maptype=roadmap"
              allowfullscreen>
            </iframe>
          </body>
        </html>
      `;
      setMapHtml(html);
    }
  }, [location]);

  const openInMapsApp = () => {
    if (location) {
      const { latitude, longitude } = location.coords;
      const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      Linking.openURL(url).catch(err => console.error('Error opening maps:', err));
    }
  };

  if (!locationEnabled) {
    return (
      <SafeAreaView style={styles.container}>
        <Text variant="headlineLarge" style={styles.heading}>
          Murang'a GPS APP
        </Text>
        <Text variant="bodyLarge" style={styles.errorText}>
          Please enable precise location to use this app
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text variant="headlineLarge" style={styles.heading}>
        Murang'a GPS APP
      </Text>

      {/* Display GPS Coordinates */}
      <Text variant="bodyMedium" style={styles.locationText}>
        📍 Latitude: {location?.coords.latitude.toFixed(8) || 'Loading...'}
      </Text>
      <Text variant="bodyMedium" style={styles.locationText}>
        📍 Longitude: {location?.coords.longitude.toFixed(8) || 'Loading...'}
      </Text>
      <Text variant="bodySmall" style={styles.accuracyText}>
        Accuracy: ±{location?.coords.accuracy?.toFixed(0) || 'N/A'}m
      </Text>

      {/* Google Maps via WebView */}
      {mapHtml ? (
        <View style={styles.mapContainer}>
          <WebView
            originWhitelist={['*']}
            source={{ html: mapHtml }}
            style={styles.map}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
          />
          <View style={styles.mapOverlay}>
            <Button 
              mode="contained" 
              onPress={openInMapsApp}
              style={styles.openMapsButton}
              icon="map"
            >
              Open in Maps App
            </Button>
          </View>
        </View>
      ) : (
        <View style={[styles.mapPlaceholder, styles.mapContainer]}>
          <Text>Loading map...</Text>
        </View>
      )}

      <TextInput
        mode="outlined"
        label="Type something to echo"
        value={input}
        onChangeText={setInput}
        style={styles.input}
        multiline={false}
        right={<TextInput.Icon icon="send" onPress={() => setEcho(input)} />}
      />

      <Button 
        mode="contained" 
        onPress={() => setEcho(input)} 
        style={styles.button}
        disabled={!input.trim()}
      >
        Echo GPS Coordinates
      </Button>

      {echo ? (
        <Text variant="bodyLarge" style={styles.echoText}>
          🔊 Echo: "{echo}"
        </Text>
      ) : null}
    </SafeAreaView>
  );
}

export default function App() {
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        
        // First check if location services are enabled
        let enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) {
          Alert.alert(
            'Location Services Disabled',
            'Please enable location services in your device settings to use this app',
            [{ text: 'OK' }]
          );
          setLocationEnabled(false);
          setIsLoading(false);
          return;
        }

        // Request foreground location permission
        let { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          Alert.alert(
            'Permission Denied',
            'Precise location access is required to use this app. Please grant location permission.',
            [{ text: 'OK' }]
          );
          setLocationEnabled(false);
          setIsLoading(false);
          return;
        }

        // Get high accuracy location
        let locationData = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation, // Highest accuracy
        });

        if (locationData) {
          setLocation(locationData);
          setLocationEnabled(true);
          
          // Set up location watching for real-time updates
          Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 5000, // Update every 5 seconds
              distanceInterval: 10, // Update when moved 10 meters
            },
            (newLocation) => {
              setLocation(newLocation);
            }
          );
          
        } else {
          Alert.alert(
            'Location Error',
            'Unable to get your current location. Please check your GPS settings.',
            [{ text: 'OK' }]
          );
          setLocationEnabled(false);
        }
      } catch (error) {
        console.error('Location error:', error);
        let errorMessage = 'Unknown error';
        if (error && typeof error === 'object' && 'message' in error) {
          errorMessage = String((error as { message?: string }).message) || 'Unknown error';
        }
        Alert.alert(
          'Location Error',
          `Failed to get location: ${errorMessage}`,
          [{ text: 'OK' }]
        );
        setLocationEnabled(false);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return (
      <PaperProvider theme={lightTheme}>
        <SafeAreaView style={[styles.container, styles.centerContent]}>
          <Text variant="headlineMedium" style={styles.loadingText}>
            🌍 Getting your location...
          </Text>
          <Text variant="bodyMedium" style={styles.subText}>
            Please ensure GPS is enabled
          </Text>
        </SafeAreaView>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={lightTheme}>
      <EchoForm locationEnabled={locationEnabled} location={location} />
    </PaperProvider>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#6a1b9a',
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#ffffff',
  },
  button: {
    marginTop: 5,
    marginBottom: 15,
  },
  echoText: {
    marginTop: 15,
    textAlign: 'center',
    color: '#212121',
    fontWeight: '500',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    textAlign: 'center',
    color: '#d32f2f',
    marginTop: 10,
    fontSize: 16,
  },
  locationText: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#424242',
    fontWeight: '500',
  },
  accuracyText: {
    textAlign: 'center',
    marginBottom: 15,
    color: '#757575',
    fontStyle: 'italic',
  },
  loadingText: {
    textAlign: 'center',
    color: '#6a1b9a',
    marginBottom: 10,
  },
  subText: {
    textAlign: 'center',
    color: '#757575',
  },
  mapContainer: {
    height: Math.min(300, height * 0.4),
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  openMapsButton: {
    borderRadius: 20,
  },
});