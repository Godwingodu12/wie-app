import React, { forwardRef } from 'react';
import { View, Text } from 'react-native';

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapViewProps {
  style?: any;
  initialRegion?: Region;
  region?: Region;
  onRegionChangeComplete?: (region: Region) => void;
  showsUserLocation?: boolean;
  userInterfaceStyle?: 'light' | 'dark';
  customMapStyle?: any[];
  liteMode?: boolean;
  children?: React.ReactNode;
}

export const Marker = (props: any) => null;
export const Callout = (props: any) => null;
export const Polygon = (props: any) => null;
export const Circle = (props: any) => null;
export const Polyline = (props: any) => null;

const MapView = forwardRef((props: MapViewProps, ref: any) => {
  React.useImperativeHandle(ref, () => ({
    animateToRegion: () => {},
    animateCamera: () => {},
    fitToElements: () => {},
    fitToSuppliedMarkers: () => {},
    fitToCoordinates: () => {},
  }));

  return (
    <View 
      style={[{ 
        backgroundColor: '#18181b', 
        alignItems: 'center', 
        justifyContent: 'center',
        overflow: 'hidden'
      }, props.style]}
    >
      <Text style={{ color: '#71717a', textAlign: 'center', padding: 20 }}>
        Map View is not supported on web platform in this version.
      </Text>
    </View>
  );
});

export default MapView;
