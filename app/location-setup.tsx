import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Button, Text, TextInput, Card, List, RadioButton, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef } from 'react';
import { router } from 'expo-router';
import { useLocation } from '@/hooks/useLocation';
import { useAuth } from '../hooks/AuthProvider';
import { supabase } from '@/lib/supabase';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import GooglePlacesAutocomplete, { GooglePlacesAutocompleteRef } from 'react-native-google-places-autocomplete';

interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
}

interface PlaceDetails {
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

const RADIUS_OPTIONS = [
  { label: '100 meters', value: 100 },
  { label: '500 meters', value: 500 },
  { label: '1 kilometer', value: 1000 },
  { label: '5 kilometers', value: 5000 },
  { label: '10 kilometers', value: 10000 },
];

const INITIAL_REGION = {
  latitude: 23.8103,  // Default to Dhaka
  longitude: 90.4125,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function LocationSetupScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { requestLocationPermission, getCurrentLocation } = useLocation();
  const { user } = useAuth();
  const [selectedRadius, setSelectedRadius] = useState(1000);
  const [manualMode, setManualMode] = useState(false);
  const [address, setAddress] = useState<Address>({
    street: '',
    city: '',
    state: '',
    country: '',
  });
  const [selectedLocation, setSelectedLocation] = useState(INITIAL_REGION);
  const [addressError, setAddressError] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);
  const placesRef = useRef<GooglePlacesAutocompleteRef>(null);

  const validateAddress = (address: Address): boolean => {
    if (!address.city || !address.country) {
      setAddressError('City and country are required');
      return false;
    }
    if (address.country !== 'Bangladesh') {
      setAddressError('Only locations in Bangladesh are supported');
      return false;
    }
    setAddressError(null);
    return true;
  };

  const handleLocationSetup = async () => {
    try {
      setLoading(true);
      setError(null);
      setAddressError(null);

      if (manualMode && !validateAddress(address)) {
        return;
      }

      const hasPermission = await requestLocationPermission();
      
      if (hasPermission) {
        const location = await getCurrentLocation();
        if (location) {
          // Update map to user's location
          const newRegion = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          };
          setSelectedLocation(newRegion);
          mapRef.current?.animateToRegion(newRegion, 1000);

          // Get address from coordinates
          const [addressResult] = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });

          if (addressResult) {
            const newAddress = {
              street: addressResult.street || '',
              city: addressResult.city || '',
              state: addressResult.region || '',
              country: addressResult.country || '',
            };

            if (!validateAddress(newAddress)) {
              throw new Error('Invalid address detected');
            }

            setAddress(newAddress);
          }

          // Update user's location in the database
          const { error } = await supabase
            .from('profiles')
            .update({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              location_updated_at: new Date().toISOString(),
              address: addressResult?.street,
              city: addressResult?.city,
              state: addressResult?.region,
              country: addressResult?.country,
              neighborhood_radius: selectedRadius,
            })
            .eq('id', user?.id);

          if (error) throw error;
          
          // Navigate to main app
          router.replace('/(tabs)');
        }
      }
    } catch (error) {
      console.error('Error setting up location:', error);
      setError('Failed to set up location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = async (e: any) => {
    try {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      setSelectedLocation(prev => ({ ...prev, latitude, longitude }));

      // Get address from coordinates
      const [addressResult] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addressResult) {
        const newAddress = {
          street: addressResult.street || '',
          city: addressResult.city || '',
          state: addressResult.region || '',
          country: addressResult.country || '',
        };

        if (!validateAddress(newAddress)) {
          throw new Error('Invalid address detected');
        }

        setAddress(newAddress);
      }
    } catch (error) {
      console.error('Error getting address:', error);
      setError('Failed to get address for selected location');
    }
  };

  const handlePlaceSelect = async (data: any, details: PlaceDetails) => {
    try {
      if (details) {
        const { geometry, address_components } = details;
        const { location } = geometry;
        
        // Update map location
        const newRegion = {
          latitude: location.lat,
          longitude: location.lng,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };
        setSelectedLocation(newRegion);
        mapRef.current?.animateToRegion(newRegion, 1000);

        // Extract address components
        const street = address_components.find((component) => 
          component.types.includes('route'))?.long_name || '';
        const city = address_components.find((component) => 
          component.types.includes('locality'))?.long_name || '';
        const state = address_components.find((component) => 
          component.types.includes('administrative_area_level_1'))?.long_name || '';
        const country = address_components.find((component) => 
          component.types.includes('country'))?.long_name || '';

        const newAddress = { street, city, state, country };

        if (!validateAddress(newAddress)) {
          throw new Error('Invalid address detected');
        }

        setAddress(newAddress);
      }
    } catch (error) {
      console.error('Error selecting place:', error);
      setError('Failed to select location. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.content}>
          <Text variant="headlineMedium" style={styles.title}>
            Set Up Your Location
          </Text>

          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Search Location
              </Text>
              <GooglePlacesAutocomplete
                ref={placesRef}
                placeholder="Search for a location"
                onPress={handlePlaceSelect}
                query={{
                  key: 'AIzaSyDYSsIhRYqc7zNr0Tz_yCTrDnmf-9QOWXw',
                  language: 'en',
                  components: 'country:bd',
                }}
                styles={{
                  container: styles.searchContainer,
                  textInput: styles.searchInput,
                  listView: styles.searchList,
                }}
                enablePoweredByContainer={false}
                fetchDetails={true}
                minLength={2}
                nearbyPlacesAPI="GooglePlacesSearch"
                debounce={300}
              />
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Select Location on Map
              </Text>
              <View style={styles.mapContainer}>
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  provider={PROVIDER_GOOGLE}
                  initialRegion={selectedLocation}
                  onPress={handleMapPress}
                >
                  <Marker
                    coordinate={{
                      latitude: selectedLocation.latitude,
                      longitude: selectedLocation.longitude,
                    }}
                    draggable
                    onDragEnd={handleMapPress}
                  />
                </MapView>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Location Detection
              </Text>
              <Button
                mode="contained"
                onPress={handleLocationSetup}
                loading={loading}
                style={styles.button}
              >
                Use Current Location
              </Button>

              <Text
                variant="bodyMedium"
                style={styles.orText}
                onPress={() => setManualMode(!manualMode)}
              >
                {manualMode ? 'Use Automatic Detection' : 'Enter Location Manually'}
              </Text>

              {manualMode && (
                <View style={styles.manualInputs}>
                  <TextInput
                    label="Street Address"
                    value={address.street}
                    onChangeText={(text) => setAddress(prev => ({ ...prev, street: text }))}
                    style={styles.input}
                    error={!!addressError}
                  />
                  <TextInput
                    label="City"
                    value={address.city}
                    onChangeText={(text) => setAddress(prev => ({ ...prev, city: text }))}
                    style={styles.input}
                    error={!!addressError}
                  />
                  <TextInput
                    label="State"
                    value={address.state}
                    onChangeText={(text) => setAddress(prev => ({ ...prev, state: text }))}
                    style={styles.input}
                  />
                  <TextInput
                    label="Country"
                    value={address.country}
                    onChangeText={(text) => setAddress(prev => ({ ...prev, country: text }))}
                    style={styles.input}
                    error={!!addressError}
                  />
                  {addressError && (
                    <HelperText type="error" visible={!!addressError}>
                      {addressError}
                    </HelperText>
                  )}
                </View>
              )}
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Neighborhood Radius
              </Text>
              <RadioButton.Group
                onValueChange={(value) => setSelectedRadius(Number(value))}
                value={selectedRadius.toString()}
              >
                {RADIUS_OPTIONS.map((option) => (
                  <RadioButton.Item
                    key={option.value}
                    label={option.label}
                    value={option.value.toString()}
                  />
                ))}
              </RadioButton.Group>
            </Card.Content>
          </Card>

          {error && (
            <Text style={styles.error} variant="bodyMedium">
              {error}
            </Text>
          )}

          <Button
            mode="contained"
            onPress={handleLocationSetup}
            loading={loading}
            style={styles.saveButton}
          >
            Save Location
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 10,
  },
  button: {
    marginTop: 10,
  },
  orText: {
    textAlign: 'center',
    marginVertical: 15,
    color: '#666',
  },
  manualInputs: {
    marginTop: 10,
  },
  input: {
    marginBottom: 10,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  saveButton: {
    marginTop: 10,
  },
  mapContainer: {
    height: 200,
    marginVertical: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  searchContainer: {
    flex: 0,
  },
  searchInput: {
    height: 48,
    fontSize: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  searchList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
}); 