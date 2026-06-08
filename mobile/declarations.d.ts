declare module "@dudigital/react-native-zoomable-view" {
  import { Component } from "react";
  import { ViewProps } from "react-native";

  export interface ReactNativeZoomableViewProps extends ViewProps {
    zoomEnabled?: boolean;
    maxZoom?: number;
    minZoom?: number;
    zoomStep?: number;
    initialZoom?: number;
    bindToBorders?: boolean;
    onZoomBefore?: (event: any, gestureState: any, zoomableViewEventObject: any) => void;
    onZoomAfter?: (event: any, gestureState: any, zoomableViewEventObject: any) => void;
    onZoomEnd?: (event: any, gestureState: any, zoomableViewEventObject: any) => void;
    onShiftingBefore?: (event: any, gestureState: any, zoomableViewEventObject: any) => void;
    onShiftingAfter?: (event: any, gestureState: any, zoomableViewEventObject: any) => void;
    onShiftingEnd?: (event: any, gestureState: any, zoomableViewEventObject: any) => void;
  }

  export class ReactNativeZoomableView extends Component<ReactNativeZoomableViewProps> {}
}

declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.gif";
declare module "*.svg";
