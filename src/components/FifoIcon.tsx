import React from 'react';
import {
  UCircle as Circle,
  ULine as Line,
  UPath as Path,
  UPolyline as Polyline,
  URect as Rect,
  USvg as Svg,
} from './UniversalSvg';

export type FifoIconName =
  | 'grid'
  | 'list'
  | 'maximize'
  | 'pie-chart'
  | 'sliders'
  | 'search'
  | 'x'
  | 'x-circle'
  | 'check'
  | 'check-circle'
  | 'unlock'
  | 'wind'
  | 'trash-2'
  | 'camera'
  | 'zap'
  | 'cpu'
  | 'file-text'
  | 'bell'
  | 'refresh-cw'
  | 'barcode';

interface FifoIconProps {
  name: FifoIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * Pure SVG vector icon component using react-native-svg.
 * Eliminates network font loading timeouts (e.g. Feather.ttf 12000ms timeout)
 * and renders crisp vector icons instantaneously offline across Android, iOS, and Web.
 */
export function FifoIcon({
  name,
  size = 18,
  color = '#0F172A',
  strokeWidth = 2.2,
}: FifoIconProps) {
  const common = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  switch (name) {
    case 'grid':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="3" y="3" width="7" height="7" rx="1.5" {...common} />
          <Rect x="14" y="3" width="7" height="7" rx="1.5" {...common} />
          <Rect x="14" y="14" width="7" height="7" rx="1.5" {...common} />
          <Rect x="3" y="14" width="7" height="7" rx="1.5" {...common} />
        </Svg>
      );

    case 'list':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Line x1="8" y1="6" x2="21" y2="6" {...common} />
          <Line x1="8" y1="12" x2="21" y2="12" {...common} />
          <Line x1="8" y1="18" x2="21" y2="18" {...common} />
          <Line x1="3" y1="6" x2="3.01" y2="6" {...common} />
          <Line x1="3" y1="12" x2="3.01" y2="12" {...common} />
          <Line x1="3" y1="18" x2="3.01" y2="18" {...common} />
        </Svg>
      );

    case 'maximize':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
            {...common}
          />
        </Svg>
      );

    case 'pie-chart':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M21.21 15.89A10 10 0 1 1 8 2.83" {...common} />
          <Path d="M22 12A10 10 0 0 0 12 2v10z" {...common} />
        </Svg>
      );

    case 'sliders':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Line x1="4" y1="21" x2="4" y2="14" {...common} />
          <Line x1="4" y1="10" x2="4" y2="3" {...common} />
          <Line x1="12" y1="21" x2="12" y2="12" {...common} />
          <Line x1="12" y1="8" x2="12" y2="3" {...common} />
          <Line x1="20" y1="21" x2="20" y2="16" {...common} />
          <Line x1="20" y1="12" x2="20" y2="3" {...common} />
          <Line x1="1" y1="14" x2="7" y2="14" {...common} />
          <Line x1="9" y1="8" x2="15" y2="8" {...common} />
          <Line x1="17" y1="16" x2="23" y2="16" {...common} />
        </Svg>
      );

    case 'search':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="11" cy="11" r="8" {...common} />
          <Line x1="21" y1="21" x2="16.65" y2="16.65" {...common} />
        </Svg>
      );

    case 'x':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Line x1="18" y1="6" x2="6" y2="18" {...common} />
          <Line x1="6" y1="6" x2="18" y2="18" {...common} />
        </Svg>
      );

    case 'x-circle':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="10" {...common} />
          <Line x1="15" y1="9" x2="9" y2="15" {...common} />
          <Line x1="9" y1="9" x2="15" y2="15" {...common} />
        </Svg>
      );

    case 'check':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Polyline points="20 6 9 17 4 12" {...common} />
        </Svg>
      );

    case 'check-circle':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" {...common} />
          <Polyline points="22 4 12 14.01 9 11.01" {...common} />
        </Svg>
      );

    case 'unlock':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" {...common} />
          <Path d="M7 11V7a5 5 0 0 1 9.9-1" {...common} />
        </Svg>
      );

    case 'wind':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"
            {...common}
          />
        </Svg>
      );

    case 'trash-2':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Polyline points="3 6 5 6 21 6" {...common} />
          <Path
            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
            {...common}
          />
          <Line x1="10" y1="11" x2="10" y2="17" {...common} />
          <Line x1="14" y1="11" x2="14" y2="17" {...common} />
        </Svg>
      );

    case 'camera':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
            {...common}
          />
          <Circle cx="12" cy="13" r="4" {...common} />
        </Svg>
      );

    case 'zap':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Polyline
            points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"
            {...common}
          />
        </Svg>
      );

    case 'cpu':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="4" y="4" width="16" height="16" rx="2" ry="2" {...common} />
          <Rect x="9" y="9" width="6" height="6" {...common} />
          <Line x1="9" y1="1" x2="9" y2="4" {...common} />
          <Line x1="15" y1="1" x2="15" y2="4" {...common} />
          <Line x1="9" y1="20" x2="9" y2="23" {...common} />
          <Line x1="15" y1="20" x2="15" y2="23" {...common} />
          <Line x1="20" y1="9" x2="23" y2="9" {...common} />
          <Line x1="20" y1="14" x2="23" y2="14" {...common} />
          <Line x1="1" y1="9" x2="4" y2="9" {...common} />
          <Line x1="1" y1="14" x2="4" y2="14" {...common} />
        </Svg>
      );

    case 'file-text':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            {...common}
          />
          <Polyline points="14 2 14 8 20 8" {...common} />
          <Line x1="16" y1="13" x2="8" y2="13" {...common} />
          <Line x1="16" y1="17" x2="8" y2="17" {...common} />
        </Svg>
      );

    case 'bell':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
            {...common}
          />
          <Path d="M13.73 21a2 2 0 0 1-3.46 0" {...common} />
        </Svg>
      );

    case 'refresh-cw':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Polyline points="23 4 23 10 17 10" {...common} />
          <Polyline points="1 20 1 14 7 14" {...common} />
          <Path
            d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
            {...common}
          />
        </Svg>
      );

    case 'barcode':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M3 5v14" {...common} />
          <Path d="M8 5v14" {...common} />
          <Path d="M12 5v14" {...common} />
          <Path d="M17 5v14" {...common} />
          <Path d="M21 5v14" {...common} />
        </Svg>
      );
  }
}
