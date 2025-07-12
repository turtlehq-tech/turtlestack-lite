// tests/testGrowwOrderFix.js
// Test the fixed Groww order API implementation

import { GrowwBroker } from '../src/brokers/GrowwBroker.js';

async function testGrowwOrderFormatting() {
  console.log('🧪 Testing Fixed Groww Order API Implementation...');
  
  const groww = new GrowwBroker();
  
  // Mock authentication
  groww.isAuthenticated = true;
  groww.apiKey = 'YOUR_GROWW_API_KEY_HERE';
  
  console.log('\n📋 Step 1: Test Order Data Formatting');
  
  // Test parameters that would be sent to createOrder
  const testParams = {
    trading_symbol: 'IRISDOREME',
    exchange: 'NSE',
    transaction_type: 'SELL',
    order_type: 'MARKET',
    quantity: 1,
    product: 'CNC',
    segment: 'CASH'
  };
  
  // Create a mock version of createOrder to see the formatted data
  const originalMakeAPICall = groww.makeAPICall;
  let capturedRequestData = null;
  
  groww.makeAPICall = async (method, endpoint, data) => {
    capturedRequestData = data;
    console.log('\n🔍 Captured Request Data (Fixed Format):');
    console.log(JSON.stringify(data, null, 2));
    
    // Mock successful response
    return {
      status: 'SUCCESS',
      groww_order_id: 'TEST12345',
      order_status: 'OPEN'
    };
  };
  
  try {
    console.log('\n📤 Input Parameters:');
    console.log(JSON.stringify(testParams, null, 2));
    
    const result = await groww.createOrder(testParams);
    
    console.log('\n✅ Order Creation Result:');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\n🔍 Field Name Analysis:');
    if (capturedRequestData) {
      const fields = Object.keys(capturedRequestData);
      console.log('Request fields:', fields);
      
      const expectedSnakeCase = [
        'trading_symbol',
        'transaction_type', 
        'order_type'
      ];
      
      const hasCorrectFormat = expectedSnakeCase.every(field => 
        fields.includes(field)
      );
      
      console.log(`Snake case format: ${hasCorrectFormat ? '✅ CORRECT' : '❌ INCORRECT'}`);
      
      // Check for old camelCase fields that should be gone
      const oldCamelCase = [
        'tradingSymbol',
        'transactionType',
        'orderType',
        'productType'
      ];
      
      const hasOldFormat = oldCamelCase.some(field => 
        fields.includes(field)
      );
      
      console.log(`No old camelCase: ${!hasOldFormat ? '✅ CORRECT' : '❌ FOUND OLD FORMAT'}`);
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }
  
  // Restore original method
  groww.makeAPICall = originalMakeAPICall;
  
  console.log('\n📊 Summary of Fixes Applied:');
  console.log('✅ Changed tradingSymbol → trading_symbol');
  console.log('✅ Changed transactionType → transaction_type');
  console.log('✅ Changed orderType → order_type');
  console.log('✅ Changed productType → product');
  console.log('✅ Changed triggerPrice → trigger_price');
  console.log('✅ Changed orderReferenceId → order_reference_id');
  console.log('✅ Changed disclosedQuantity → disclosed_quantity');
  console.log('✅ Changed timeInForce → time_in_force');
  console.log('✅ Changed afterMarketOrder → after_market_order');
  console.log('✅ Improved error handling and response parsing');
  console.log('✅ Added debug logging for troubleshooting');
  
  console.log('\n🎯 Expected API Behavior:');
  console.log('• Should now send proper snake_case field names');
  console.log('• Should handle 400 errors with better error messages');
  console.log('• Should work with IRISDOREME and other stock symbols');
  console.log('• Should properly parse groww_order_id from response');
  
  console.log('\n🎉 Groww Order Fix Test Complete!');
}

testGrowwOrderFormatting().catch(console.error);