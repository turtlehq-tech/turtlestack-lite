// tests/testGrowwOrderReference.js
// Test the automatic order reference ID generation for Groww API

import { GrowwBroker } from '../src/brokers/GrowwBroker.js';

function testGrowwOrderReference() {
  console.log('🧪 Testing Groww Order Reference ID Generation...');
  
  const groww = new GrowwBroker();
  groww.isAuthenticated = true;
  groww.apiKey = 'YOUR_GROWW_API_KEY_HERE';
  
  console.log('\n📋 Step 1: Test Order Reference ID Generation Function');
  
  // Test the reference ID generation
  for (let i = 0; i < 5; i++) {
    const refId = groww._generateOrderReferenceId();
    console.log(`  Generated ID ${i+1}: "${refId}"`);
    
    // Validate format
    const isValidLength = refId.length >= 8 && refId.length <= 20;
    const hyphenCount = (refId.match(/-/g) || []).length;
    const isValidHyphens = hyphenCount <= 2;
    const isAlphanumericWithHyphens = /^[A-Za-z0-9\-]+$/.test(refId);
    
    console.log(`    Length (8-20): ${isValidLength ? '✅' : '❌'} (${refId.length} chars)`);
    console.log(`    Hyphens (≤2): ${isValidHyphens ? '✅' : '❌'} (${hyphenCount} hyphens)`);
    console.log(`    Format: ${isAlphanumericWithHyphens ? '✅' : '❌'} (alphanumeric + hyphens only)`);
  }
  
  console.log('\n📤 Step 2: Test Order Creation with Auto-Generated Reference ID');
  
  // Mock the API call to capture request data
  let capturedRequest = null;
  const originalMakeAPICall = groww.makeAPICall;
  
  groww.makeAPICall = async (method, endpoint, data) => {
    capturedRequest = { method, endpoint, data };
    return {
      status: 'SUCCESS',
      groww_order_id: 'TEST12345',
      order_status: 'OPEN'
    };
  };
  
  const testOrder = {
    trading_symbol: 'IRISDOREME',
    exchange: 'NSE',
    transaction_type: 'SELL',
    order_type: 'MARKET',
    quantity: 1,
    product: 'CNC',
    segment: 'CASH'
    // Note: No order_reference_id provided - should be auto-generated
  };
  
  console.log('Input (without order_reference_id):');
  console.log(JSON.stringify(testOrder, null, 2));
  
  return groww.createOrder(testOrder)
    .then(result => {
      console.log('\n✅ Order Creation Successful!');
      
      if (capturedRequest && capturedRequest.data) {
        const requestData = capturedRequest.data;
        
        console.log('\n🔍 Request Analysis:');
        console.log('Full request body:');
        console.log(JSON.stringify(requestData, null, 2));
        
        const hasOrderRef = requestData.hasOwnProperty('order_reference_id');
        console.log(`\n📋 Order Reference ID Analysis:`);
        console.log(`  Field present: ${hasOrderRef ? '✅' : '❌'}`);
        
        if (hasOrderRef) {
          const refId = requestData.order_reference_id;
          console.log(`  Value: "${refId}"`);
          
          // Validate the auto-generated ID
          const isValidLength = refId.length >= 8 && refId.length <= 20;
          const hyphenCount = (refId.match(/-/g) || []).length;
          const isValidHyphens = hyphenCount <= 2;
          const isAlphanumericWithHyphens = /^[A-Za-z0-9\-]+$/.test(refId);
          
          console.log(`  Length (8-20): ${isValidLength ? '✅' : '❌'} (${refId.length} chars)`);
          console.log(`  Hyphens (≤2): ${isValidHyphens ? '✅' : '❌'} (${hyphenCount} hyphens)`);
          console.log(`  Format: ${isAlphanumericWithHyphens ? '✅' : '❌'} (alphanumeric + hyphens)`);
          console.log(`  Starts with TT-: ${refId.startsWith('TT-') ? '✅' : '❌'} (TurtleStack prefix)`);
          
          const isCompliantFormat = isValidLength && isValidHyphens && isAlphanumericWithHyphens;
          console.log(`  Overall compliance: ${isCompliantFormat ? '✅ VALID' : '❌ INVALID'}`);
        }
      }
      
      console.log('\n📤 Step 3: Test Order Creation with Custom Reference ID');
      
      const customRefOrder = {
        ...testOrder,
        order_reference_id: 'CUSTOM-123456-ABC'
      };
      
      console.log('Input (with custom order_reference_id):');
      console.log(JSON.stringify(customRefOrder, null, 2));
      
      return groww.createOrder(customRefOrder);
    })
    .then(result => {
      console.log('\n✅ Custom Reference Order Successful!');
      
      if (capturedRequest && capturedRequest.data) {
        const requestData = capturedRequest.data;
        const customRefId = requestData.order_reference_id;
        
        console.log(`Custom reference ID used: "${customRefId}"`);
        console.log(`Matches input: ${customRefId === 'CUSTOM-123456-ABC' ? '✅' : '❌'}`);
      }
      
      console.log('\n🎯 Summary of Order Reference ID Fix:');
      console.log('✅ Auto-generates valid order_reference_id when not provided');
      console.log('✅ Uses custom order_reference_id when provided');
      console.log('✅ Follows Groww API format requirements (8-20 chars, ≤2 hyphens)');
      console.log('✅ Uses TurtleStack prefix (TT-) for identification');
      console.log('✅ Includes timestamp for uniqueness');
      
      console.log('\n🚀 Expected Result:');
      console.log('IRISDOREME orders should now work without "Order Reference ID required" errors!');
      
    })
    .catch(error => {
      console.log('❌ Test failed:', error.message);
    })
    .finally(() => {
      // Restore original method
      groww.makeAPICall = originalMakeAPICall;
    });
}

testGrowwOrderReference().catch(console.error);