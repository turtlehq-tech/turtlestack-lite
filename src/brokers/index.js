// src/brokers/index.js
// Central exports for all broker implementations

import { BaseBroker } from './BaseBroker.js';
import { KiteBroker } from './KiteBroker.js'; // Now uses curl-based implementation
import { GrowwBroker } from './GrowwBroker.js';
import { DhanBroker } from './DhanBroker.js';
import { AngelOneBroker } from './AngelOneBroker.js';

export { BaseBroker, KiteBroker, GrowwBroker, DhanBroker, AngelOneBroker };

// Broker registry for easy access
export const BROKERS = {
  kite: 'KiteBroker',
  groww: 'GrowwBroker', 
  dhan: 'DhanBroker',
  angelone: 'AngelOneBroker'
};

// Broker factory function
export function createBroker(brokerName) {
  switch (brokerName.toLowerCase()) {
    case 'kite':
      return new KiteBroker(); // Use curl-based implementation
    case 'groww':
      return new GrowwBroker();
    case 'dhan':
      return new DhanBroker();
    case 'angelone':
      return new AngelOneBroker();
    default:
      throw new Error(`Unknown broker: ${brokerName}`);
  }
}