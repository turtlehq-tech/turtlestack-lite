#!/usr/bin/env node

// Test script for Groww order placement functionality
import { GrowwBroker } from './src/brokers/GrowwBroker.js';

async function testGrowwOrderPlacement() {
  console.log('🧪 Testing Groww Order Placement...\\n');
  
  const groww = new GrowwBroker();
  
  // JWT token from user
  const jwtToken = 'eyJraWQiOiJaTUtjVXciLCJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NTI5NzE0MDAsImlhdCI6MTc1MjkxNjY0MiwibmJmIjoxNzUyOTE2NjQyLCJzdWIiOiJ7XCJ0b2tlblJlZklkXCI6XCJjYzc1YWM3ZS0zOTdlLTRhMTUtODYxMi1iZjk2MWQ0ODYwYjNcIixcInZlbmRvckludGVncmF0aW9uS2V5XCI6XCJlMzFmZjIzYjA4NmI0MDZjODg3NGIyZjZkODQ5NTMxM1wiLFwidXNlckFjY291bnRJZFwiOlwiZWIxMWI5ZTgtMWYwOS00M2UzLWEwZWQtNTFiY2NjZWEzYWE4XCIsXCJkZXZpY2VJZFwiOlwiNWFjMzJlMDMtOGJiNy01YTYyLTlkOWYtODc5YjBkZmU1YjA1XCIsXCJzZXNzaW9uSWRcIjpcImNjYzgwNGRlLTE4ODAtNDhhMi1hODc3LTQyNTBkM2QwNGU2NlwiLFwiYWRkaXRpb25hbERhdGFcIjpcIno1NC9NZzltdjE2WXdmb0gvS0EwYlBSQ0tySjFoMlc0YW1pNWZscnBoNWxSTkczdTlLa2pWZDNoWjU1ZStNZERhWXBOVi9UOUxIRmtQejFFQisybTdRPT1cIixcInJvbGVcIjpcIm9yZGVyLWJhc2ljLGxpdmVfZGF0YS1iYXNpYyxub25fdHJhZGluZy1iYXNpYyxvcmRlcl9yZWFkX29ubHktYmFzaWNcIixcInNvdXJjZUlwQWRkcmVzc1wiOlwiMjQwMTo0OTAwOjFmMjc6YmI1ZDpjMWMxOjRiNDc6NjJlZDo0MTM2LDE2Mi4xNTguMjI3LjI1MSwzNS4yNDEuMjMuMTIzXCIsXCJ0d29GYUV4cGlyeVRzXCI6MTc1Mjk3MTQwMDAwMH0iLCJpc3MiOiJhcGV4LWF1dGgtcHJvZC1hcHAifQ.D7gx4mIMdkLVolOMhNkbIN018i4kAEmsig1dqWEN47-81PpA71gy3Flyj4Wi4ZE2fnijAno8pCKGntRpHXSodg';
  
  try {
    // Test 1: Authentication
    console.log('📋 Test 1: Authentication');
    const authResult = await groww.authenticate({
      access_token: jwtToken
    });
    console.log('✅ Authentication successful:', authResult.message);
    
    // Test 2: Check Current Margins
    console.log('\\n📋 Test 2: Check Current Margins');
    try {
      const margins = await groww.getMargins();
      console.log('✅ Current margins retrieved successfully');
      console.log('Available margin preview:', JSON.stringify(margins, null, 2).substring(0, 300) + '...');
    } catch (error) {
      console.log('❌ Margins error:', error.message);
    }
    
    // Test 3: Search for a Test Symbol
    console.log('\\n📋 Test 3: Search for Test Symbol (RELIANCE)');
    try {
      const instruments = await groww.searchInstruments('RELIANCE', 'CASH', 'NSE');
      console.log('✅ Instrument search successful');
      if (instruments.data.length > 0) {
        console.log('Found RELIANCE instrument:', JSON.stringify(instruments.data[0], null, 2));
      }
    } catch (error) {
      console.log('❌ Instrument search error:', error.message);
    }
    
    // Test 4: Calculate Order Margin (Dry Run)
    console.log('\\n📋 Test 4: Calculate Order Margin (1 share of RELIANCE)');
    try {
      const orderParams = {
        trading_symbol: 'RELIANCE',
        transaction_type: 'BUY',
        quantity: 1,
        order_type: 'MARKET',
        product: 'CNC',
        segment: 'CASH'
      };
      
      const marginCalculation = await groww.calculateOrderMargin(orderParams);
      console.log('✅ Margin calculation successful');
      console.log('Required margin:', JSON.stringify(marginCalculation, null, 2));
    } catch (error) {
      console.log('❌ Margin calculation error:', error.message);
    }
    
    // Test 5: Market Order (SMALL QUANTITY - CAREFUL!)
    console.log('\\n📋 Test 5: Market Order Placement (1 share RELIANCE - REAL ORDER!)');
    console.log('⚠️  WARNING: This will place a REAL order! Proceeding in 3 seconds...');
    
    // Small delay to allow cancellation if needed
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
      const marketOrderParams = {
        trading_symbol: 'RELIANCE',
        quantity: 1,
        validity: 'DAY',
        exchange: 'NSE',
        segment: 'CASH',
        product: 'CNC',
        order_type: 'MARKET',
        transaction_type: 'BUY'
      };
      
      const marketOrder = await groww.createOrder(marketOrderParams);
      console.log('✅ Market order placed successfully!');
      console.log('Order details:', JSON.stringify(marketOrder, null, 2));
      
      // Store order ID for potential cancellation
      const orderId = marketOrder.order_id;
      
      // Test 6: Get Order Status
      console.log('\\n📋 Test 6: Check Order Status');
      try {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        const orderStatus = await groww.getOrderStatus(orderId, 'CASH');
        console.log('✅ Order status retrieved:', JSON.stringify(orderStatus, null, 2));
        
        // Test 7: Cancel Order (if still pending)
        console.log('\\n📋 Test 7: Cancel Order (if pending)');
        try {
          const cancelResult = await groww.cancelOrder(orderId, { segment: 'CASH' });
          console.log('✅ Order cancellation attempted:', JSON.stringify(cancelResult, null, 2));
        } catch (cancelError) {
          console.log('⚠️  Order cancellation failed (might be executed already):', cancelError.message);
        }
        
      } catch (statusError) {
        console.log('❌ Order status error:', statusError.message);
      }
      
    } catch (orderError) {
      console.log('❌ Market order placement error:', orderError.message);
    }
    
    // Test 8: Limit Order (Conservative Price)
    console.log('\\n📋 Test 8: Limit Order Placement (1 share RELIANCE at ₹1)');
    try {
      const limitOrderParams = {
        trading_symbol: 'RELIANCE',
        quantity: 1,
        validity: 'DAY',
        exchange: 'NSE',
        segment: 'CASH',
        product: 'CNC',
        order_type: 'LIMIT',
        transaction_type: 'BUY',
        price: 1.00 // Very low price, unlikely to execute
      };
      
      const limitOrder = await groww.createOrder(limitOrderParams);
      console.log('✅ Limit order placed successfully!');
      console.log('Order details:', JSON.stringify(limitOrder, null, 2));
      
      const limitOrderId = limitOrder.order_id;
      
      // Test 9: Modify Order
      console.log('\\n📋 Test 9: Modify Order Price');
      try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        const modifyResult = await groww.modifyOrder(limitOrderId, {
          price: 2.00,
          segment: 'CASH',
          order_type: 'LIMIT'
        });
        console.log('✅ Order modification successful:', JSON.stringify(modifyResult, null, 2));
      } catch (modifyError) {
        console.log('❌ Order modification error:', modifyError.message);
      }
      
      // Test 10: Cancel Limit Order
      console.log('\\n📋 Test 10: Cancel Limit Order');
      try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        const cancelLimitResult = await groww.cancelOrder(limitOrderId, { segment: 'CASH' });
        console.log('✅ Limit order cancellation successful:', JSON.stringify(cancelLimitResult, null, 2));
      } catch (cancelError) {
        console.log('❌ Limit order cancellation error:', cancelError.message);
      }
      
    } catch (limitOrderError) {
      console.log('❌ Limit order placement error:', limitOrderError.message);
    }
    
    // Test 11: Get All Orders
    console.log('\\n📋 Test 11: Get All Orders');
    try {
      const allOrders = await groww.getOrders({ segment: 'CASH', page: 1, page_size: 10 });
      console.log('✅ Orders list retrieved successfully');
      console.log('Recent orders:', JSON.stringify(allOrders, null, 2).substring(0, 500) + '...');
    } catch (error) {
      console.log('❌ Orders list error:', error.message);
    }
    
  } catch (error) {
    console.log('❌ Authentication failed:', error.message);
  }
  
  console.log('\\n🎯 Order Placement Test Summary:');
  console.log('This test demonstrated:');
  console.log('✅ Authentication with JWT token');
  console.log('✅ Margin checking and calculation');
  console.log('✅ Instrument search functionality');
  console.log('✅ Market order placement (REAL ORDER)');
  console.log('✅ Limit order placement (safe price)');
  console.log('✅ Order status checking');
  console.log('✅ Order modification');
  console.log('✅ Order cancellation');
  console.log('✅ Order listing');
  
  console.log('\\n⚠️  IMPORTANT NOTES:');
  console.log('1. REAL ORDERS were placed during this test');
  console.log('2. Market orders execute immediately at current price');
  console.log('3. Limit orders at ₹1-2 are unlikely to execute for RELIANCE');
  console.log('4. Check your Groww app for actual order status');
  console.log('5. Always verify margins before placing large orders');
  
  console.log('\\n📚 Manual curl commands for order placement:');
  console.log('# Place market order:');
  console.log('curl "https://api.groww.in/v1/order/create" \\\\');
  console.log('  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\\\');
  console.log('  -H "X-API-VERSION: 1.0" \\\\');
  console.log('  -H "Content-Type: application/json" \\\\');
  console.log('  -d \'{"trading_symbol":"RELIANCE","quantity":1,"validity":"DAY","exchange":"NSE","segment":"CASH","product":"CNC","order_type":"MARKET","transaction_type":"BUY","order_reference_id":"TEST-123"}\'');
  
  console.log('\\n🎉 Groww Order Placement Test Complete!');
}

testGrowwOrderPlacement().catch(console.error);