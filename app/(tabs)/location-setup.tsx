import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, TextInput, Card, List, RadioButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useAuth } from '../../hooks/AuthProvider';
import { locationService, LocationData } from '@/src/services/location/location';
import { router } from 'expo-router';

const RADIUS_OPTIONS = [
  { label: '100 meters', value: 100 },
  { label: '500 meters', value: 500 },
  { label: '1 kilometer', value: 1000 },
  { label: '5 kilometers', value: 5000 },
  { label: '10 kilometers', value: 10000 },
];

export default function LocationSetupScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [selectedRadius, setSelectedRadius] = useState(1000);
  const [manualMode, setManualMode] = useState(false);

  const handleAutoLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const location = await locationService.getCurrentLocation();
      if (!location) {
        throw new Error('Could not get your location');
      }
      setLocationData(location);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!locationData || !user?.id) return;

    setLoading(true);
    setError(null);
    try {
      const { error } = await locationService.saveUserLocation(
        user.id,
        locationData,
        selectedRadius
      );

      if (error) throw error;
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateLocationField = (field: keyof LocationData, value: string) => {
    setLocationData((prev) => {
      if (!prev) {
        return {
          latitude: 0,
          longitude: 0,
          [field]: value,
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });
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
                Location Detection
              </Text>
              <Button
                mode="contained"
                onPress={handleAutoLocation}
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
                    label="City"
                    value={locationData?.city || ''}
                    onChangeText={(text) => updateLocationField('city', text)}
                    style={styles.input}
                  />
                  <TextInput
                    label="Area"
                    value={locationData?.area || ''}
                    onChangeText={(text) => updateLocationField('area', text)}
                    style={styles.input}
                  />
                  <TextInput
                    label="Road/Street"
                    value={locationData?.road || ''}
                    onChangeText={(text) => updateLocationField('road', text)}
                    style={styles.input}
                  />
                  <TextInput
                    label="Landmark"
                    value={locationData?.landmark || ''}
                    onChangeText={(text) => updateLocationField('landmark', text)}
                    style={styles.input}
                  />
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
            onPress={handleSaveLocation}
            loading={loading}
            disabled={!locationData}
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
}); 