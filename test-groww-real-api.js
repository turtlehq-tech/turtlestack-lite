#!/usr/bin/env node

// Test script to verify Groww API with real JWT token
import { GrowwBroker } from './src/brokers/GrowwBroker.js';

async function testGrowwRealAPI() {
  console.log('🧪 Testing Groww API with Real JWT Token...\n');
  
  const groww = new GrowwBroker();
  
  // Real JWT token provided
  const jwtToken = 'eyJraWQiOiJaTUtjVXciLCJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NTI5NzE0MDAsImlhdCI6MTc1MjkxNjY0MiwibmJmIjoxNzUyOTE2NjQyLCJzdWIiOiJ7XCJ0b2tlblJlZklkXCI6XCJjYzc1YWM3ZS0zOTdlLTRhMTUtODYxMi1iZjk2MWQ0ODYwYjNcIixcInZlbmRvckludGVncmF0aW9uS2V5XCI6XCJlMzFmZjIzYjA4NmI0MDZjODg3NGIyZjZkODQ5NTMxM1wiLFwidXNlckFjY291bnRJZFwiOlwiZWIxMWI5ZTgtMWYwOS00M2UzLWEwZWQtNTFiY2NjZWEzYWE4XCIsXCJkZXZpY2VJZFwiOlwiNWFjMzJlMDMtOGJiNy01YTYyLTlkOWYtODc5YjBkZmU1YjA1XCIsXCJzZXNzaW9uSWRcIjpcImNjYzgwNGRlLTE4ODAtNDhhMi1hODc3LTQyNTBkM2QwNGU2NlwiLFwiYWRkaXRpb25hbERhdGFcIjpcIno1NC9NZzltdjE2WXdmb0gvS0EwYlBSQ0tySjFoMlc0YW1pNWZscnBoNWxSTkczdTlLa2pWZDNoWjU1ZStNZERhWXBOVi9UOUxIRmtQejFFQisybTdRPT1cIixcInJvbGVcIjpcIm9yZGVyLWJhc2ljLGxpdmVfZGF0YS1iYXNpYyxub25fdHJhZGluZy1iYXNpYyxvcmRlcl9yZWFkX29ubHktYmFzaWNcIixcInNvdXJjZUlwQWRkcmVzc1wiOlwiMjQwMTo0OTAwOjFmMjc6YmI1ZDpjMWMxOjRiNDc6NjJlZDo0MTM2LDE2Mi4xNTguMjI3LjI1MSwzNS4yNDEuMjMuMTIzXCIsXCJ0d29GYUV4cGlyeVRzXCI6MTc1Mjk3MTQwMDAwMH0iLCJpc3MiOiJhcGV4LWF1dGgtcHJvZC1hcHAifQ.D7gx4mIMdkLVolOMhNkbIN018i4kAEmsig1dqWEN47-81PpA71gy3Flyj4Wi4ZE2fnijAno8pCKGntRpHXSodg';
  
  try {
    // Test 1: Authentication
    console.log('📋 Test 1: Authentication');
    const authResult = await groww.authenticate({
      access_token: jwtToken
    });
    console.log('✅ Authentication successful:', authResult.message);
    
    // Test 2: Get Portfolio (Holdings)
    console.log('\n📋 Test 2: Get Portfolio (Holdings)');
    try {
      const portfolio = await groww.getPortfolio();
      console.log('✅ Portfolio retrieved successfully');
      console.log('Portfolio data preview:', JSON.stringify(portfolio, null, 2).substring(0, 500) + '...');
    } catch (error) {
      console.log('❌ Portfolio error:', error.message);
    }
    
    // Test 3: Get Positions
    console.log('\n📋 Test 3: Get Positions');
    try {
      const positions = await groww.getPositions();
      console.log('✅ Positions retrieved successfully');
      console.log('Positions data preview:', JSON.stringify(positions, null, 2).substring(0, 500) + '...');
    } catch (error) {
      console.log('❌ Positions error:', error.message);
    }
    
    // Test 4: Get Margins
    console.log('\n📋 Test 4: Get Margins');
    try {
      const margins = await groww.getMargins();
      console.log('✅ Margins retrieved successfully');
      console.log('Margins data preview:', JSON.stringify(margins, null, 2).substring(0, 500) + '...');
    } catch (error) {
      console.log('❌ Margins error:', error.message);
    }
    
    // Test 5: Get Historical Data
    console.log('\n📋 Test 5: Get Historical Data');
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days back
      
      const startTime = startDate.toISOString().slice(0, 19).replace('T', ' ');
      const endTime = endDate.toISOString().slice(0, 19).replace('T', ' ');
      
      const historical = await groww.getHistoricalData('RELIANCE', startTime, endTime, 'NSE', 'CASH');
      console.log('✅ Historical data retrieved successfully');
      console.log('Historical data preview:', JSON.stringify(historical, null, 2).substring(0, 500) + '...');
    } catch (error) {
      console.log('❌ Historical data error:', error.message);
    }
    
    // Test 6: Technical Indicators
    console.log('\n📋 Test 6: Technical Indicators (RSI for RELIANCE)');
    try {
      const rsi = await groww.getRSI('RELIANCE', 14, 'NSE', 'CASH');
      console.log('✅ RSI calculated successfully');
      console.log('RSI data:', JSON.stringify(rsi, null, 2));
    } catch (error) {
      console.log('❌ RSI calculation error:', error.message);
    }
    
    // Test 7: Search Instruments
    console.log('\n📋 Test 7: Search Instruments');
    try {
      const instruments = await groww.searchInstruments('RELIANCE', 'CASH', 'NSE');
      console.log('✅ Instrument search successful');
      console.log('Found instruments:', instruments.data.length);
      if (instruments.data.length > 0) {
        console.log('Sample instrument:', JSON.stringify(instruments.data[0], null, 2));
      }
    } catch (error) {
      console.log('❌ Instrument search error:', error.message);
    }
    
    // Test 8: Get Orders List
    console.log('\n📋 Test 8: Get Orders List');
    try {
      const orders = await groww.getOrders({ segment: 'CASH', page: 1, page_size: 10 });
      console.log('✅ Orders list retrieved successfully');
      console.log('Orders data preview:', JSON.stringify(orders, null, 2).substring(0, 500) + '...');
    } catch (error) {
      console.log('❌ Orders list error:', error.message);
    }
    
  } catch (error) {
    console.log('❌ Authentication failed:', error.message);
  }
  
  console.log('\n🎯 Test Summary:');
  console.log('This test verified the fixed Groww API implementation with a real JWT token.');
  console.log('Any successful responses indicate the API endpoints are working correctly.');
  console.log('Any errors might be due to:');
  console.log('- Token expiration or insufficient permissions');
  console.log('- API rate limiting');
  console.log('- Missing data (empty portfolio, no recent orders, etc.)');
  
  console.log('\n📚 Manual curl test commands:');
  console.log('# Test holdings:');
  console.log(`curl "https://api.groww.in/v1/holdings/user" \\`);
  console.log(`  -H "Authorization: Bearer ${jwtToken.substring(0, 50)}..." \\`);
  console.log(`  -H "X-API-VERSION: 1.0"`);
  
  console.log('\n# Test positions:');
  console.log(`curl "https://api.groww.in/v1/positions/user?segment=CASH" \\`);
  console.log(`  -H "Authorization: Bearer ${jwtToken.substring(0, 50)}..." \\`);
  console.log(`  -H "X-API-VERSION: 1.0"`);
  
  console.log('\n🎉 Groww Real API Test Complete!');
}

testGrowwRealAPI().catch(console.error);