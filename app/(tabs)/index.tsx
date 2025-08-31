import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Alert } from 'react-native';
import {
  Provider as PaperProvider,
  MD3LightTheme,
  Text,
  TextInput,
  Button,
} from 'react-native-paper';
import * as Location from 'expo-location';

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

  if (!locationEnabled) {
    return (
      <SafeAreaView style={styles.container}>
        <Text variant="headlineLarge" style={styles.heading}>
          Expo Echo App
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
        Expo Echo App
      </Text>

      {/* Display GPS Coordinates */}
      <Text variant="bodyLarge" style={styles.locationText}>
        Latitude: {location?.coords.latitude.toFixed(6) || 'N/A'}
      </Text>
      <Text variant="bodyLarge" style={styles.locationText}>
        Longitude: {location?.coords.longitude.toFixed(6) || 'N/A'}
      </Text>

      <TextInput
        mode="outlined"
        label="Type something"
        value={input}
        onChangeText={setInput}
        style={styles.input}
      />

      <Button mode="contained" onPress={() => setEcho(input)} style={styles.button}>
        Echo
      </Button>

      {echo ? (
        <Text variant="bodyLarge" style={styles.echoText}>
          You wrote: {echo}
        </Text>
      ) : null}
    </SafeAreaView>
  );
}

export default function App() {
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Request foreground location permission
        let { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          Alert.alert(
            'Permission Denied',
            'Precise location is required to use this app',
            [{ text: 'OK' }]
          );
          setLocationEnabled(false);
          return;
        }

        // Get precise location
        let locationData = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });

        if (locationData) {
          setLocation(locationData);
          setLocationEnabled(true);
        } else {
          Alert.alert(
            'Location Error',
            'Unable to get precise location. Please ensure location services are enabled.',
            [{ text: 'OK' }]
          );
          setLocationEnabled(false);
        }
      } catch (error) {
        Alert.alert(
          'Error',
          'An error occurred while checking location services',
          [{ text: 'OK' }]
        );
        setLocationEnabled(false);
      }
    })();
  }, []);

  return (
    <PaperProvider theme={lightTheme}>
      <EchoForm locationEnabled={locationEnabled} location={location} />
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#ffffff', // Ensure white background
  },
  heading: {
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 5,
  },
  echoText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#212121',
  },
  errorText: {
    textAlign: 'center',
    color: '#ff0000',
    marginTop: 10,
  },
  locationText: {
    textAlign: 'center',
    marginBottom: 10,
    color: '#212121',
  },
});