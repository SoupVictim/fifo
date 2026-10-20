import React from 'react';
import { Platform } from 'react-native';
import Svg, {
  Circle as RNSvgCircle,
  Line as RNSvgLine,
  Path as RNSvgPath,
  Polyline as RNSvgPolyline,
  Rect as RNSvgRect,
} from 'react-native-svg';

/**
 * Universal SVG primitives that use native DOM <svg> elements on Web
 * (avoiding react-native-svg's deprecated unstable_createElement call on react-native-web 0.21+)
 * and native RNSVG views on Android & iOS.
 */
export function USvg(props: any) {
  if (Platform.OS === 'web') {
    const { width, height, viewBox, style, children } = props;
    return React.createElement(
      'svg',
      {
        width,
        height,
        viewBox,
        style: Array.isArray(style) ? Object.assign({}, ...style) : style,
      },
      children
    );
  }
  return <Svg {...props} />;
}

export function UCircle(props: any) {
  if (Platform.OS === 'web') {
    const { rotation, origin, ...rest } = props;
    const transform =
      rotation !== undefined && origin !== undefined
        ? `rotate(${rotation} ${origin.replace(',', ' ')})`
        : undefined;
    return React.createElement('circle', { ...rest, transform });
  }
  return <RNSvgCircle {...props} />;
}

export function URect(props: any) {
  if (Platform.OS === 'web') {
    return React.createElement('rect', props);
  }
  return <RNSvgRect {...props} />;
}

export function UPath(props: any) {
  if (Platform.OS === 'web') {
    return React.createElement('path', props);
  }
  return <RNSvgPath {...props} />;
}

export function ULine(props: any) {
  if (Platform.OS === 'web') {
    return React.createElement('line', props);
  }
  return <RNSvgLine {...props} />;
}

export function UPolyline(props: any) {
  if (Platform.OS === 'web') {
    return React.createElement('polyline', props);
  }
  return <RNSvgPolyline {...props} />;
}
