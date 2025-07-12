// tests/testGrowwProductMapping.js
// Test the fixed Groww product mapping

import { GrowwBroker } from '../src/brokers/GrowwBroker.js';

function testGrowwProductMapping() {
  console.log('🧪 Testing Fixed Groww Product Mapping...');
  
  const groww = new GrowwBroker();
  
  console.log('\n📋 Testing Product Mappings:');
  
  const testCases = [
    { input: 'CNC', expected: 'CNC', description: 'CNC should stay CNC' },
    { input: 'MIS', expected: 'MIS', description: 'MIS should stay MIS' },
    { input: 'NRML', expected: 'NRML', description: 'NRML should stay NRML' },
    { input: 'DELIVERY', expected: 'CNC', description: 'DELIVERY should map to CNC' },
    { input: 'INTRADAY', expected: 'MIS', description: 'INTRADAY should map to MIS' },
    { input: 'NORMAL', expected: 'NRML', description: 'NORMAL should map to NRML' },
    { input: 'MTF', expected: 'MIS', description: 'MTF should map to MIS' },
    { input: 'CO', expected: 'MIS', description: 'CO should map to MIS' },
    { input: 'BO', expected: 'MIS', description: 'BO should map to MIS' },
    { input: 'INVALID', expected: 'CNC', description: 'Invalid product should default to CNC' }
  ];
  
  let allPassed = true;
  
  testCases.forEach((testCase, index) => {
    const result = groww._mapProduct(testCase.input);
    const passed = result === testCase.expected;
    
    console.log(`  ${index + 1}. ${testCase.description}:`);
    console.log(`     Input: "${testCase.input}" → Output: "${result}" ${passed ? '✅' : '❌'}`);
    
    if (!passed) {
      console.log(`     Expected: "${testCase.expected}", Got: "${result}"`);
      allPassed = false;
    }
  });
  
  console.log('\n📊 Valid Groww Product Types (API Reference):');
  console.log('  ✅ CNC  - Cash and Carry (delivery-based with full payment)');
  console.log('  ✅ MIS  - Margin Intraday Square-off (must close by day end)');
  console.log('  ✅ NRML - Regular margin trading (overnight positions allowed)');
  
  console.log('\n🚫 Invalid Product Types (will cause 400 errors):');
  console.log('  ❌ DELIVERY, INTRADAY, NORMAL, MTF, CO, BO, etc.');
  
  console.log('\n🔍 Before Fix vs After Fix:');
  console.log('  Before: CNC → "DELIVERY" ❌ (caused 400 error)');
  console.log('  After:  CNC → "CNC"      ✅ (works correctly)');
  
  console.log('\n🎯 Test for IRISDOREME Order:');
  const irisdoremeTest = {
    trading_symbol: 'IRISDOREME',
    exchange: 'NSE',
    transaction_type: 'SELL',
    order_type: 'MARKET',
    quantity: 1,
    product: 'CNC',
    segment: 'CASH'
  };
  
  const mappedProduct = groww._mapProduct(irisdoremeTest.product);
  console.log(`  Product mapping: "${irisdoremeTest.product}" → "${mappedProduct}"`);
  console.log(`  This should now work with Groww API: ${mappedProduct === 'CNC' ? '✅' : '❌'}`);
  
  console.log(`\n🎉 Product Mapping Test ${allPassed ? 'PASSED' : 'FAILED'}!`);
  
  if (allPassed) {
    console.log('✅ All product mappings are now correct for Groww API');
    console.log('✅ IRISDOREME sell orders should work without 400 errors');
  } else {
    console.log('❌ Some product mappings are still incorrect');
  }
}

testGrowwProductMapping();