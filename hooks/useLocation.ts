import { useState } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export function useLocation() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setErrorMsg('Error requesting location permission');
      return false;
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return location;
    } catch (error) {
      console.error('Error getting location:', error);
      setErrorMsg('Error getting location');
      return null;
    }
  };

  return {
    errorMsg,
    requestLocationPermission,
    getCurrentLocation,
  };
} 