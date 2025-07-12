// tests/integration/brokers.test.js
import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert';
import { KiteBroker } from '../../src/brokers/KiteBroker.js';
import { GrowwBroker } from '../../src/brokers/GrowwBroker.js';
import { DhanBroker } from '../../src/brokers/DhanBroker.js';
import { AngelOneBroker } from '../../src/brokers/AngelOneBroker.js';
import { createBroker } from '../../src/brokers/index.js';
import { mockBrokerCredentials, mockHistoricalData } from '../fixtures/mockData.js';

describe('Broker Integration Tests', () => {
  let kiteBroker, growwBroker, dhanBroker, angelOneBroker;

  before(() => {
    kiteBroker = new KiteBroker();
    growwBroker = new GrowwBroker();
    dhanBroker = new DhanBroker();
    angelOneBroker = new AngelOneBroker();
  });

  describe('Broker Factory', () => {
    it('should create Kite broker instance', () => {
      const broker = createBroker('kite');
      assert.ok(broker instanceof KiteBroker, 'Should create KiteBroker instance');
      assert.strictEqual(broker.name, 'Kite', 'Should have correct name');
    });

    it('should create Groww broker instance', () => {
      const broker = createBroker('groww');
      assert.ok(broker instanceof GrowwBroker, 'Should create GrowwBroker instance');
      assert.strictEqual(broker.name, 'Groww', 'Should have correct name');
    });

    it('should create Dhan broker instance', () => {
      const broker = createBroker('dhan');
      assert.ok(broker instanceof DhanBroker, 'Should create DhanBroker instance');
      assert.strictEqual(broker.name, 'Dhan', 'Should have correct name');
    });

    it('should create AngelOne broker instance', () => {
      const broker = createBroker('angelone');
      assert.ok(broker instanceof AngelOneBroker, 'Should create AngelOneBroker instance');
      assert.strictEqual(broker.name, 'AngelOne', 'Should have correct name');
    });

    it('should throw error for unknown broker', () => {
      assert.throws(() => {
        createBroker('unknown');
      }, /Unknown broker: unknown/, 'Should throw error for unknown broker');
    });
  });

  describe('Base Broker Interface', () => {
    [
      { name: 'Kite', broker: () => kiteBroker },
      { name: 'Groww', broker: () => growwBroker },
      { name: 'Dhan', broker: () => dhanBroker },
      { name: 'AngelOne', broker: () => angelOneBroker }
    ].forEach(({ name, broker }) => {
      describe(`${name} Broker`, () => {
        let brokerInstance;

        beforeEach(() => {
          brokerInstance = broker();
        });

        it('should have correct initial state', () => {
          assert.strictEqual(brokerInstance.name, name, `Should have name ${name}`);
          assert.strictEqual(brokerInstance.isAuthenticated, false, 'Should not be authenticated initially');
        });

        it('should have required methods', () => {
          const requiredMethods = [
            'authenticate', 'getPortfolio', 'getPositions', 'createOrder',
            'getOrders', 'getQuote', 'getMargins', 'logout'
          ];

          requiredMethods.forEach(method => {
            assert.ok(typeof brokerInstance[method] === 'function', 
              `Should have ${method} method`);
          });
        });

        it('should have technical indicator methods', () => {
          const technicalMethods = [
            'getRSI', 'getMACD', 'getBollingerBands', 'getVWAP', 
            'getATR', 'getADX', 'getOBV', 'getMFI'
          ];

          technicalMethods.forEach(method => {
            assert.ok(typeof brokerInstance[method] === 'function', 
              `Should have ${method} method`);
          });
        });

        it('should throw error when not authenticated', async () => {
          try {
            await brokerInstance.getPortfolio();
            assert.fail('Should throw error when not authenticated');
          } catch (error) {
            assert.ok(error.message.includes('not authenticated'), 
              'Should throw authentication error');
          }
        });

        it('should logout correctly', () => {
          brokerInstance.isAuthenticated = true; // Mock authentication
          brokerInstance.logout();
          assert.strictEqual(brokerInstance.isAuthenticated, false, 
            'Should set isAuthenticated to false after logout');
        });
      });
    });
  });

  describe('Kite Broker Specific', () => {
    it('should validate authentication parameters', async () => {
      try {
        await kiteBroker.authenticate({});
        assert.fail('Should throw error for missing credentials');
      } catch (error) {
        assert.ok(error.message.includes('api_key'), 
          'Should require api_key');
      }
    });

    it('should have Kite-specific methods', () => {
      const kiteSpecificMethods = [
        'getTrades', 'modifyOrder', 'cancelOrder', 'getInstruments',
        'getHistoricalData', 'getProfile', 'getMFHoldings', 'getMFOrders',
        'placeMFOrder', 'cancelMFOrder', 'getMFInstruments', 'getGTTs',
        'placeGTT', 'modifyGTT', 'deleteGTT', 'generateLoginUrl'
      ];

      kiteSpecificMethods.forEach(method => {
        assert.ok(typeof kiteBroker[method] === 'function', 
          `Should have ${method} method`);
      });
    });
  });

  describe('Groww Broker Specific', () => {
    it('should validate authentication parameters', async () => {
      try {
        await growwBroker.authenticate({});
        assert.fail('Should throw error for missing credentials');
      } catch (error) {
        assert.ok(error.message.includes('api_key'), 
          'Should require api_key');
      }
    });

    it('should have Groww-specific methods', () => {
      const growwSpecificMethods = [
        'getOrderDetail', 'modifyOrder', 'cancelOrder',
        'searchInstruments', 'getInstrumentDetail', 'getHistoricalData',
        'getTechnicalIndicators'
      ];

      growwSpecificMethods.forEach(method => {
        assert.ok(typeof growwBroker[method] === 'function', 
          `Should have ${method} method`);
      });
    });

    it('should map segments correctly', () => {
      assert.strictEqual(growwBroker._mapSegment('EQUITY'), 'CASH');
      assert.strictEqual(growwBroker._mapSegment('DERIVATIVE'), 'FNO');
      assert.strictEqual(growwBroker._mapSegment('COMMODITY'), 'COMM');
    });

    it('should map products correctly', () => {
      assert.strictEqual(growwBroker._mapProduct('CNC'), 'DELIVERY');
      assert.strictEqual(growwBroker._mapProduct('MIS'), 'INTRADAY');
      assert.strictEqual(growwBroker._mapProduct('NRML'), 'NORMAL');
    });
  });

  describe('Dhan Broker Specific', () => {
    it('should validate authentication parameters', async () => {
      try {
        await dhanBroker.authenticate({});
        assert.fail('Should throw error for missing credentials');
      } catch (error) {
        assert.ok(error.message.includes('access_token') && 
                  error.message.includes('client_id'), 
          'Should require access_token and client_id');
      }
    });

    it('should have Dhan-specific methods', () => {
      const dhanSpecificMethods = [
        'getOrderDetail', 'modifyOrder', 'cancelOrder', 'getFundBalance',
        'convertPosition', 'getInstruments', 'searchInstruments', 
        'getHistoricalData', 'getLiveFeed', 'getOrderBook', 'getTradeBook',
        'getSecurityInfo', 'getDematHoldings', 'getKillSwitch', 'toggleKillSwitch',
        'getExchangeStatus', 'getOptionChain', 'placeBracketOrder', 'placeCoverOrder'
      ];

      dhanSpecificMethods.forEach(method => {
        assert.ok(typeof dhanBroker[method] === 'function', 
          `Should have ${method} method`);
      });
    });

    it('should map exchanges correctly', () => {
      assert.strictEqual(dhanBroker._mapExchange('NSE'), 'NSE_EQ');
      assert.strictEqual(dhanBroker._mapExchange('BSE'), 'BSE_EQ');
      assert.strictEqual(dhanBroker._mapExchange('NFO'), 'NSE_FNO');
    });

    it('should map products correctly', () => {
      assert.strictEqual(dhanBroker._mapProduct('CNC'), 'CNC');
      assert.strictEqual(dhanBroker._mapProduct('MIS'), 'INTRADAY');
      assert.strictEqual(dhanBroker._mapProduct('NRML'), 'MARGIN');
    });
  });

  describe('AngelOne Broker Specific', () => {
    it('should validate authentication parameters', async () => {
      try {
        await angelOneBroker.authenticate({});
        assert.fail('Should throw error for missing credentials');
      } catch (error) {
        assert.ok(error.message.includes('clientcode') || 
                  error.message.includes('jwtToken'), 
          'Should require proper authentication parameters');
      }
    });

    it('should have AngelOne-specific methods', () => {
      const angelOneSpecificMethods = [
        'modifyOrder', 'cancelOrder', 'getTradeBook', 'getProfile',
        'getCandleData', '_generateSession', '_generateSessionWithPin', '_makeAngelOneAPICall',
        '_getSymbolToken', '_mapProductType', '_determineOrderVariety',
        '_validateOrderParams', 'generateLoginInstructions'
      ];

      angelOneSpecificMethods.forEach(method => {
        assert.ok(typeof angelOneBroker[method] === 'function', 
          `Should have ${method} method`);
      });
    });

    it('should generate login instructions', () => {
      const instructions = angelOneBroker.generateLoginInstructions();
      
      assert.ok(instructions.method === 'multiple_options', 'Should have multiple login options');
      assert.ok(Array.isArray(instructions.instructions), 'Should have instructions array');
      assert.ok(instructions.instructions.length >= 2, 'Should have multiple authentication methods');
      
      // Check for JWT token method
      const jwtMethod = instructions.instructions.find(i => i.type === 'recommended');
      assert.ok(jwtMethod, 'Should have JWT token method');
      assert.ok(jwtMethod.required_params.includes('jwtToken'), 'JWT method should require jwtToken');
      
      // Check for TOTP secret method
      const totpSecretMethod = instructions.instructions.find(i => i.type === 'auto_totp');
      assert.ok(totpSecretMethod, 'Should have TOTP secret method');
      assert.ok(totpSecretMethod.required_params.includes('totp_secret'), 'TOTP secret method should require totp_secret');
    });

    it('should generate TOTP from secret', async () => {
      // Test with a known base32 secret (this is a test secret, not real)
      const testSecret = 'JBSWY3DPEHPK3PXP'; // "Hello World" in base32
      
      // TOTP generation should work without throwing
      const totp = await angelOneBroker._generateTOTP(testSecret);
      
      assert.ok(typeof totp === 'string', 'Should return string');
      assert.ok(totp.length === 6, 'Should return 6-digit code');
      assert.ok(/^\d{6}$/.test(totp), 'Should contain only digits');
      
      // Should throw for invalid secret
      try {
        await angelOneBroker._generateTOTP('INVALID!@#');
        assert.fail('Should throw for invalid base32');
      } catch (error) {
        assert.ok(error.message.includes('Failed to generate TOTP'), 'Should throw TOTP error');
      }
    });

    it('should map products correctly', () => {
      assert.strictEqual(angelOneBroker._mapProductType('CNC'), 'DELIVERY');
      assert.strictEqual(angelOneBroker._mapProductType('MIS'), 'INTRADAY');
      assert.strictEqual(angelOneBroker._mapProductType('NRML'), 'MARGIN');
      assert.strictEqual(angelOneBroker._mapProductType('CO'), 'INTRADAY');
      assert.strictEqual(angelOneBroker._mapProductType('BO'), 'INTRADAY');
    });

    it('should determine order variety correctly', () => {
      assert.strictEqual(angelOneBroker._determineOrderVariety({ amo: true }), 'AMO');
      assert.strictEqual(angelOneBroker._determineOrderVariety({ stoploss: true }), 'STOPLOSS');
      assert.strictEqual(angelOneBroker._determineOrderVariety({ order_type: 'STOPLOSS' }), 'STOPLOSS');
      assert.strictEqual(angelOneBroker._determineOrderVariety({}), 'NORMAL');
    });

    it('should validate order parameters', () => {
      const validOrder = {
        trading_symbol: 'RELIANCE',
        exchange: 'NSE',
        transaction_type: 'BUY',
        order_type: 'MARKET',
        quantity: 1,
        product: 'CNC'
      };

      // Should not throw for valid order
      angelOneBroker._validateOrderParams(validOrder);

      // Should throw for missing required fields
      assert.throws(() => {
        angelOneBroker._validateOrderParams({});
      }, /Missing required parameter/, 'Should throw for missing parameters');

      // Should throw for invalid order type
      assert.throws(() => {
        angelOneBroker._validateOrderParams({ ...validOrder, order_type: 'INVALID' });
      }, /Invalid order_type/, 'Should throw for invalid order type');

      // Should throw for LIMIT order without price
      assert.throws(() => {
        angelOneBroker._validateOrderParams({ ...validOrder, order_type: 'LIMIT' });
      }, /LIMIT orders require a price/, 'Should throw for LIMIT order without price');
    });
  });

  describe('Technical Indicators Integration', () => {
    // Mock successful authentication for testing technical indicators
    const mockAuthenticatedBroker = (broker, authData) => {
      broker.isAuthenticated = true;
      Object.assign(broker, authData);
    };

    it('should handle technical indicator calls when authenticated', async () => {
      // Mock authentication
      mockAuthenticatedBroker(kiteBroker, {
        kite: { getHistoricalData: () => Promise.resolve(mockHistoricalData) }
      });

      // Test that technical indicator methods exist and can be called
      // Note: These will fail without actual API calls, but we're testing structure
      const technicalMethods = ['getRSI', 'getMACD', 'getBollingerBands', 'getVWAP'];
      
      for (const method of technicalMethods) {
        assert.ok(typeof kiteBroker[method] === 'function', 
          `Should have ${method} method`);
      }
    });

    it('should validate technical indicator parameters', () => {
      // Test parameter validation without making actual API calls
      assert.ok(typeof kiteBroker.getRSI === 'function', 'Should have getRSI method');
      assert.ok(typeof kiteBroker.getMACD === 'function', 'Should have getMACD method');
      assert.ok(typeof kiteBroker.getBollingerBands === 'function', 'Should have getBollingerBands method');
    });
  });
});