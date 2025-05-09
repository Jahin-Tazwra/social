declare module 'react-native-google-places-autocomplete' {
  import { Component } from 'react';
  import { StyleProp, ViewStyle, TextStyle } from 'react-native';

  export interface GooglePlacesAutocompleteProps {
    placeholder?: string;
    onPress?: (data: any, details: any) => void;
    query?: {
      key: string;
      language?: string;
      components?: string;
    };
    styles?: {
      container?: StyleProp<ViewStyle>;
      textInput?: StyleProp<TextStyle>;
      listView?: StyleProp<ViewStyle>;
    };
    enablePoweredByContainer?: boolean;
    fetchDetails?: boolean;
    minLength?: number;
    nearbyPlacesAPI?: string;
    debounce?: number;
  }

  class GooglePlacesAutocomplete extends Component<GooglePlacesAutocompleteProps> {
    setAddressText: (text: string) => void;
    getAddressText: () => string;
  }

  export type GooglePlacesAutocompleteRef = GooglePlacesAutocomplete;

  export default GooglePlacesAutocomplete;
} 