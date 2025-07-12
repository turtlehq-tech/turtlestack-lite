// src/utils/technicalIndicators.js
// Main Technical Indicators Module - Backward Compatibility

// Import from the new modular structure
export { TechnicalIndicators } from './technicalIndicators/index.js';

// Re-export individual classes for direct access
export {
  TrendIndicators,
  MomentumIndicators,
  VolatilityIndicators,
  VolumeIndicators,
  SupportResistanceIndicators
} from './technicalIndicators/index.js';