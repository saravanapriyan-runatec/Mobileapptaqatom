import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Platform, Animated } from 'react-native';
import Svg, { Circle, G, Line, Path, Defs, Mask, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import tokens from '../../../locales/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * DigitalDigit
 * Renders a single 7-segment display digit using SVG paths.
 * Match the "pixel-perfect" style from the user image.
 */
const DigitalDigit = ({ value = 0, size = 30, activeColor = "#363636", inactiveColor = "#F2F2F2" }) => {
  const segments = {
    '0': [true, true, true, true, true, true, false],
    '1': [false, true, true, false, false, false, false],
    '2': [true, true, false, true, true, false, true],
    '3': [true, true, true, true, false, false, true],
    '4': [false, true, true, false, false, true, true],
    '5': [true, false, true, true, false, true, true],
    '6': [true, false, true, true, true, true, true],
    '7': [true, true, true, false, false, false, false],
    '8': [true, true, true, true, true, true, true],
    '9': [true, true, true, true, false, true, true],
    '-': [false, false, false, false, false, false, true],
    '٠': [true, true, true, true, true, true, false],
    '١': [false, true, true, false, false, false, false],
    '٢': [true, true, false, true, true, false, true],
    '٣': [true, true, true, true, false, false, true],
    '٤': [false, true, true, false, false, true, true],
    '٥': [true, false, true, true, false, true, true],
    '٦': [true, false, true, true, true, true, true],
    '٧': [true, true, true, false, false, false, false],
    '٨': [true, true, true, true, true, true, true],
    '٩': [true, true, true, true, false, true, true],
  };

  const active = segments[value] || [];
  const strokeWidth = size * 0.18; // More solid digits
  const padding = size * 0.1;
  const w = size;
  const h = size * 1.55;

  // Segment points
  const pts = {
    a: `M ${padding} ${padding} L ${w - padding} ${padding}`,
    b: `M ${w - padding} ${padding} L ${w - padding} ${h / 2}`,
    c: `M ${w - padding} ${h / 2} L ${w - padding} ${h - padding}`,
    d: `M ${padding} ${h - padding} L ${w - padding} ${h - padding}`,
    e: `M ${padding} ${h / 2} L ${padding} ${h - padding}`,
    f: `M ${padding} ${padding} L ${padding} ${h / 2}`,
    g: `M ${padding} ${h / 2} L ${w - padding} ${h / 2}`,
  };

  if (value === ':') {
    return (
      <Svg width={size / 2.5} height={h} viewBox={`0 0 ${size / 2.5} ${h}`}>
        <Circle cx={size / 5} cy={h * 0.38} r={size * 0.08} fill={activeColor} />
        <Circle cx={size / 5} cy={h * 0.62} r={size * 0.08} fill={activeColor} />
      </Svg>
    );
  }

  if (active.length === 0) {
    return <View style={{ width: size / 4, height: h }} />;
  }

  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {Object.keys(pts).map((key, i) => (
        <Path
          key={key}
          d={pts[key]}
          stroke={active[i] ? activeColor : inactiveColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      ))}
    </Svg>
  );
};

const DigitalDisplay = ({ text = "00:00:00", containerWidth = 200 }) => {
  // Normalize input: remove spaces and handle potential negative signs
  const cleanText = text.replace(/\s/g, "");
  const parts = cleanText.split("");
  
  // Calculate proportional digit size
  // Assuming ~8-10 chars max, with some variance for colon vs digit
  const digitSize = Math.floor(containerWidth / (parts.length * 1.2));
  
  return (
    <View style={styles.digitalContainer}>
      {parts.map((char, index) => (
        <View key={index} style={char === ':' ? styles.colonWrapper : styles.digitWrapper}>
          <DigitalDigit value={char} size={Math.min(digitSize, 25)} />
        </View>
      ))}
    </View>
  );
};

/**
 * WorkDurationClock
 * 
 * A 100% pixel-perfect recreation of the provided design.
 */
const WorkDurationClock = ({ 
  progress = 0.4, 
  durationText = "01:42:30", 
  remainingText = "6h 19m left today",
  size = 300 
}) => {
  const { t } = useTranslation();
  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Set a very small minimum progress for visibility
    const targetValue = progress > 0 ? progress : 0.001;
    Animated.timing(animatedProgress, {
      toValue: targetValue,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // Relative Geometry for 1000% perfect scaling and alignment
  const center = size / 2;
  const innerCircleRadius = size * 0.40; 
  const innerCardSize = innerCircleRadius * 2;
  
  // Line dimensions (The radial thickness/height of the texture ring)
  const r1 = size * 0.44; // Inner start of lines (Moved out for padding gap)
  const r2 = size * 0.498; // Outer end of lines
  const lineTotalHeight = r2 - r1; 
  
  // Progress Arc - Centered exactly on the lines with MATCHING width
  const arcRadius = (r1 + r2) / 2; 
  const trackWidth = lineTotalHeight; 
  const circumference = 2 * Math.PI * arcRadius;

  const baseStrokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1, 100],
    outputRange: [circumference, 0, 0],
    extrapolate: 'clamp'
  });


  const renderTicks = () => {
    const ticks = [];
    const spacing = size * 0.035; // Increased spacing for a cleaner look
    const slant = 0.6; // Right-to-Left leaning \
    
    // Cover the entire square with parallel lines
    // We iterate beyond the bounds to account for the slant
    for (let x_offset = -size * 0.6; x_offset < size * 1.5; x_offset += spacing) {
        ticks.push(
          <Line
            key={x_offset}
            x1={x_offset}
            y1={0}
            x2={x_offset - (size * slant)}
            y2={size}
            stroke="#baa2f0ff" 
            strokeWidth={size * 0.0059} 
            strokeLinecap="round"
            opacity={0.6}
          />
        );
    }
    return (
      <G mask="url(#ringMask)">
        {ticks}
      </G>
    );
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <Mask id="ringMask">
            {/* Black background hides everything */}
            <Rect x="0" y="0" width={size} height={size} fill="black" />
            {/* White circle shows the ticks */}
            <Circle cx={center} cy={center} r={r2} fill="white" />
            {/* Inner black circle punches a hole */}
            <Circle cx={center} cy={center} r={r1} fill="black" />
          </Mask>
        </Defs>

        {/* Decorative Ring */}
        {renderTicks()}

        {/* Dynamic Progress Arc (Solid Purple for base shift) */}
        <G rotation="-90" origin={`${center}, ${center}`}>
          <AnimatedCircle
            cx={center}
            cy={center}
            r={arcRadius}
            stroke="#7E49FF" 
            strokeWidth={trackWidth}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={baseStrokeDashoffset}
            strokeLinecap="round"
          />
          
        </G>
      </Svg>

      <View style={[styles.innerCard, { 
        width: innerCardSize, 
        height: innerCardSize, 
        borderRadius: innerCardSize / 2 
      }]}>
        <View style={styles.textContainer}>
          <Text style={[styles.label, { fontSize: size * 0.06 }]}>{t(tokens.dashboard.workDuration)}</Text>
          
          <DigitalDisplay text={durationText} containerWidth={innerCardSize * 0.85}  />

          <Text style={[styles.label, { marginTop: size * 0.06, fontSize: size * 0.06 }]}>{t(tokens.dashboard.remainingTime)}</Text>
          
          <View style={[styles.badge, { paddingVertical: size * 0.02, paddingHorizontal: size * 0.04 }]}>
            <View style={[styles.iconCircle, { width: size * 0.085, height: size * 0.085, borderRadius: size * 0.048 ,display:"flex",alignItems:"center",justifyContent:"center"}]}>
                <Ionicons name="time" size={size * 0.055} color="#FFFFFF"  style={{textAlign:"center"}}/>
            </View>
            <Text style={[styles.badgeText, { fontSize: size * 0.058 }]}>
              {remainingText}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  innerCard: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.1,
        shadowRadius: 25,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  label: {
    color: '#9E9E9E',
    fontWeight: '400',
    marginBottom: 4,
  },
  digitalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  digitWrapper: {
    marginHorizontal: 1,
  },
  colonWrapper: {
    marginHorizontal: 1,
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    borderRadius: 30,
    marginTop: 0,
  },
  iconCircle: {
    backgroundColor: '#3461D1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  badgeText: {
    color: '#3461D1',
    fontWeight: '500',
  },
});

export default WorkDurationClock;
