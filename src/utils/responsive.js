import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Baseline dimensions (Standard iPhone 13 mini / Modern Standard Mobile)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * Scales size based on screen width.
 */
export const scale = (size) => (width / guidelineBaseWidth) * size;

/**
 * Scales size based on screen height.
 */
export const verticalScale = (size) => (height / guidelineBaseHeight) * size;

/**
 * Scales size with a factor (default 0.5) to prevent over-scaling on large devices.
 */
export const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

export { width, height };
