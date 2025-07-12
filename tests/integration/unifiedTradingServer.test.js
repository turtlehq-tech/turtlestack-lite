// tests/integration/unifiedTradingServer.test.js
import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert';
import { TurtleStack } from '../../src/server/TurtleStack.js';
import { mockBrokerCredentials, mockPortfolioData, mockTechnicalIndicatorData } from '../fixtures/mockData.js';

describe('TurtleStack Integration Tests', () => {
  let server;

  before(() => {
    server = new TurtleStack();
  });

  describe('Server Initialization', () => {
    it('should initialize with correct brokers', () => {
      assert.ok(server.brokers.kite, 'Should have Kite broker');
      assert.ok(server.brokers.groww, 'Should have Groww broker');
      assert.ok(server.brokers.dhan, 'Should have Dhan broker');
      assert.strictEqual(server.activeBroker, null, 'Should have no active broker initially');
    });

    it('should have MCP server instance', () => {
      assert.ok(server.server, 'Should have MCP server instance');
    });
  });

  describe('Broker Management', () => {
    beforeEach(() => {
      // Reset broker states
      Object.values(server.brokers).forEach(broker => {
        broker.isAuthenticated = false;
      });
      server.activeBroker = null;
    });

    it('should list brokers correctly', async () => {
      const result = await server.listBrokers();
      
      assert.ok(result.content, 'Should have content');
      assert.ok(result.content[0].text.includes('brokers'), 'Should include brokers information');
      assert.ok(result.content[0].text.includes('kite'), 'Should include Kite');
      assert.ok(result.content[0].text.includes('groww'), 'Should include Groww');
      assert.ok(result.content[0].text.includes('dhan'), 'Should include Dhan');
    });

    it('should set active broker correctly', async () => {
      const result = await server.setActiveBroker('kite');
      
      assert.strictEqual(server.activeBroker, 'kite', 'Should set active broker');
      assert.ok(result.content, 'Should have response content');
      
      const response = JSON.parse(result.content[0].text);
      assert.strictEqual(response.broker, 'kite', 'Response should confirm broker');
    });

    it('should reject invalid broker name', async () => {
      try {
        await server.setActiveBroker('invalid');
        assert.fail('Should throw error for invalid broker');
      } catch (error) {
        assert.ok(error.message.includes('Unknown broker'), 'Should throw unknown broker error');
      }
    });

    it('should authenticate broker correctly', async () => {
      // Mock successful authentication
      server.brokers.kite.authenticate = async (credentials) => {
        server.brokers.kite.isAuthenticated = true;
        return { success: true, message: "Authentication successful" };
      };

      const result = await server.authenticateBroker({
        broker: 'kite',
        ...mockBrokerCredentials.kite
      });

      assert.ok(server.brokers.kite.isAuthenticated, 'Should authenticate broker');
      assert.ok(result.content, 'Should have response content');
      
      const response = JSON.parse(result.content[0].text);
      assert.strictEqual(response.success, true, 'Should indicate success');
    });

    it('should logout broker correctly', async () => {
      // Set broker as authenticated
      server.brokers.kite.isAuthenticated = true;
      server.activeBroker = 'kite';

      const result = await server.logoutBroker({ broker: 'kite' });

      assert.strictEqual(server.brokers.kite.isAuthenticated, false, 'Should logout broker');
      assert.strictEqual(server.activeBroker, null, 'Should clear active broker');
    });

    it('should logout all brokers', async () => {
      // Set all brokers as authenticated
      Object.values(server.brokers).forEach(broker => {
        broker.isAuthenticated = true;
      });
      server.activeBroker = 'kite';

      const result = await server.logoutBroker({ broker: 'all' });

      Object.values(server.brokers).forEach(broker => {
        assert.strictEqual(broker.isAuthenticated, false, 'Should logout all brokers');
      });
      assert.strictEqual(server.activeBroker, null, 'Should clear active broker');
    });
  });

  describe('getBroker Helper', () => {
    beforeEach(() => {
      server.activeBroker = null;
      Object.values(server.brokers).forEach(broker => {
        broker.isAuthenticated = false;
      });
    });

    it('should return active broker when authenticated', () => {
      server.activeBroker = 'kite';
      server.brokers.kite.isAuthenticated = true;

      const broker = server.getBroker();
      assert.strictEqual(broker, server.brokers.kite, 'Should return active broker');
    });

    it('should return specific broker when specified', () => {
      server.brokers.groww.isAuthenticated = true;

      const broker = server.getBroker('groww');
      assert.strictEqual(broker, server.brokers.groww, 'Should return specified broker');
    });

    it('should throw error when no active broker', () => {
      assert.throws(() => {
        server.getBroker();
      }, /No active broker set/, 'Should throw error when no active broker');
    });

    it('should throw error when broker not authenticated', () => {
      server.activeBroker = 'kite';
      server.brokers.kite.isAuthenticated = false;

      assert.throws(() => {
        server.getBroker();
      }, /not authenticated/, 'Should throw error when broker not authenticated');
    });

    it('should throw error for unknown broker', () => {
      assert.throws(() => {
        server.getBroker('unknown');
      }, /Unknown broker/, 'Should throw error for unknown broker');
    });
  });

  describe('Technical Analysis Methods', () => {
    beforeEach(() => {
      // Mock authenticated broker
      server.activeBroker = 'kite';
      server.brokers.kite.isAuthenticated = true;
    });

    it('should have all technical indicator methods', () => {
      const technicalMethods = [
        'getTechnicalIndicators', 'getRSI', 'getMACD', 'getBollingerBands',
        'getVWAP', 'getATR', 'getADX', 'compareTechnicalIndicators'
      ];

      technicalMethods.forEach(method => {
        assert.ok(typeof server[method] === 'function', 
          `Should have ${method} method`);
      });
    });

    it('should route technical indicator calls to correct broker', async () => {
      // Mock broker methods
      server.brokers.kite.getRSI = async () => ({
        broker: 'Kite',
        indicator: 'RSI',
        data: mockTechnicalIndicatorData.rsi
      });

      const result = await server.getRSI({
        symbol: 'RELIANCE',
        period: 14
      });

      assert.ok(result.content, 'Should have response content');
      assert.ok(result.content[0].text.includes('Kite'), 'Should route to Kite broker');
      assert.ok(result.content[0].text.includes('RELIANCE'), 'Should include symbol');
    });

    it('should handle different broker implementations for technical indicators', async () => {
      // Mock different broker implementations
      server.brokers.kite.name = 'Kite';
      server.brokers.groww.name = 'Groww';
      server.brokers.dhan.name = 'Dhan';

      // Mock methods for each broker type
      server.brokers.kite.getRSI = async () => ({ broker: 'Kite', data: [50, 55, 60] });
      server.brokers.groww.getTechnicalIndicators = async () => ({ broker: 'Groww', data: { RSI: [51, 56, 61] } });
      server.brokers.dhan.getRSI = async () => ({ broker: 'Dhan', data: [49, 54, 59] });

      // Test Kite routing
      server.activeBroker = 'kite';
      server.brokers.kite.isAuthenticated = true;
      const kiteResult = await server.getRSI({ symbol: 'RELIANCE' });
      assert.ok(kiteResult.content, 'Should have Kite response');

      // Test Groww routing
      server.activeBroker = 'groww';
      server.brokers.groww.isAuthenticated = true;
      const growwResult = await server.getRSI({ symbol: 'RELIANCE' });
      assert.ok(growwResult.content, 'Should have Groww response');
    });

    it('should compare technical indicators across brokers', async () => {
      // Mock all brokers as authenticated
      Object.keys(server.brokers).forEach(brokerName => {
        server.brokers[brokerName].isAuthenticated = true;
        server.brokers[brokerName].name = brokerName.charAt(0).toUpperCase() + brokerName.slice(1);
      });

      // Mock getRSI method for comparison test
      server.getRSI = async ({ broker }) => ({
        content: [{ text: JSON.stringify({ broker, data: [50, 55, 60] }) }]
      });

      const result = await server.compareTechnicalIndicators({
        symbol: 'RELIANCE',
        indicator: 'RSI',
        brokers: ['kite', 'groww']
      });

      assert.ok(result.content, 'Should have comparison response');
      assert.ok(result.content[0].text.includes('RELIANCE'), 'Should include symbol');
      assert.ok(result.content[0].text.includes('RSI'), 'Should include indicator');
      assert.ok(result.content[0].text.includes('comparison'), 'Should include comparison data');
    });
  });

  describe('Portfolio Operations', () => {
    beforeEach(() => {
      server.activeBroker = 'kite';
      server.brokers.kite.isAuthenticated = true;
    });

    it('should get portfolio from active broker', async () => {
      // Mock portfolio method
      server.brokers.kite.getPortfolio = async () => mockPortfolioData.kite;

      const result = await server.getPortfolio();
      assert.ok(result.content, 'Should have response content');
    });

    it('should compare portfolios across brokers', async () => {
      // Mock all brokers as authenticated with portfolio data
      Object.keys(server.brokers).forEach(brokerName => {
        server.brokers[brokerName].isAuthenticated = true;
        server.brokers[brokerName].getPortfolio = async () => mockPortfolioData[brokerName] || { broker: brokerName, data: [] };
      });

      const result = await server.comparePortfolios();
      assert.ok(result.content, 'Should have comparison response');
      assert.ok(result.content[0].text.includes('kite'), 'Should include Kite portfolio');
      assert.ok(result.content[0].text.includes('groww'), 'Should include Groww portfolio');
      assert.ok(result.content[0].text.includes('dhan'), 'Should include Dhan portfolio');
    });

    it('should get consolidated portfolio', async () => {
      // Mock authenticated brokers with portfolio data
      Object.keys(server.brokers).forEach(brokerName => {
        server.brokers[brokerName].isAuthenticated = true;
        server.brokers[brokerName].getPortfolio = async () => ({
          broker: brokerName,
          data: [
            {
              symbol: 'RELIANCE',
              quantity: 10,
              currentValue: 26000,
              investedValue: 25000
            }
          ]
        });
      });

      const result = await server.getConsolidatedPortfolio();
      assert.ok(result.content, 'Should have consolidated response');
      assert.ok(result.content[0].text.includes('consolidated'), 'Should include consolidated holdings');
      assert.ok(result.content[0].text.includes('RELIANCE'), 'Should include holdings data');
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors gracefully', async () => {
      // Ensure kite broker is not authenticated
      server.brokers.kite.isAuthenticated = false;
      
      try {
        await server.getPortfolio({ broker: 'kite' });
        assert.fail('Should throw authentication error');
      } catch (error) {
        assert.ok(error.message.includes('not authenticated'), 
          'Should throw authentication error');
      }
    });

    it('should handle broker errors in comparison', async () => {
      // Mock one broker as authenticated, others as failing
      server.brokers.kite.isAuthenticated = true;
      server.brokers.kite.getPortfolio = async () => mockPortfolioData.kite;
      
      server.brokers.groww.isAuthenticated = true;
      server.brokers.groww.getPortfolio = async () => {
        throw new Error('API Error');
      };

      const result = await server.comparePortfolios();
      assert.ok(result.content, 'Should handle errors gracefully');
      assert.ok(result.content[0].text.includes('kite'), 'Should include successful broker');
      assert.ok(result.content[0].text.includes('error'), 'Should include error information');
    });
  });
});