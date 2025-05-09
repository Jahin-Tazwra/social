import * as Location from 'expo-location';
import { supabase } from '../supabase/client';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  area?: string;
  road?: string;
  landmark?: string;
}

export const locationService = {
  async requestPermissions() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  },

  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      // Get address from coordinates
      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      return {
        latitude,
        longitude,
        address: address?.street,
        city: address?.city,
        area: address?.district,
        road: address?.street,
        landmark: address?.name,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  },

  async saveUserLocation(userId: string, locationData: LocationData, radius: number = 1000) {
    try {
      const { data, error } = await supabase
        .from('user_locations')
        .insert({
          user_id: userId,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          address: locationData.address,
          city: locationData.city,
          area: locationData.area,
          road: locationData.road,
          landmark: locationData.landmark,
          neighborhood_radius: radius,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Error saving location',
        },
      };
    }
  },

  async getUserLocations(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_locations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Error fetching user locations',
        },
      };
    }
  },

  async updateNeighborhoodRadius(locationId: string, radius: number) {
    try {
      const { data, error } = await supabase
        .from('user_locations')
        .update({ neighborhood_radius: radius })
        .eq('id', locationId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Error updating neighborhood radius',
        },
      };
    }
  },
}; 