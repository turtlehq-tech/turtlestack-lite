// tests/debugAuthentication.js
// Debug authentication and session persistence issues

import { TurtleStack } from '../src/server/TurtleStack.js';
import { Logger } from '../src/utils/logger.js';

async function debugAuthentication() {
  console.log('🔍 Debugging Authentication & Session Persistence...');
  
  const server = new TurtleStack();
  
  // Simulate a consistent connection (same user)
  const mockConnection = {
    params: { name: 'authenticate_broker', arguments: {} },
    meta: {
      clientId: 'YOUR_CLIENT_ID_HERE',
      progressToken: 'YOUR_PROGRESS_TOKEN_HERE'
    }
  };
  
  // Test 1: Get initial session
  console.log('\n📱 Test 1: Initial Connection');
  const connectionId1 = server.getConnectionId(mockConnection);
  const sessionId1 = server.sessionManager.getSessionId(connectionId1);
  console.log('Connection ID:', connectionId1);
  console.log('Session ID:', sessionId1.substring(0, 12) + '...');
  
  // Test 2: Same connection should get same session
  console.log('\n📱 Test 2: Same Connection (should get same session)');
  const connectionId2 = server.getConnectionId(mockConnection);
  const sessionId2 = server.sessionManager.getSessionId(connectionId2);
  console.log('Connection ID:', connectionId2);
  console.log('Session ID:', sessionId2.substring(0, 12) + '...');
  console.log('Sessions match:', sessionId1 === sessionId2);
  
  // Test 3: List brokers before authentication
  console.log('\n📊 Test 3: List Brokers (Before Auth)');
  const brokersBefore = await server.listBrokers(sessionId1);
  const beforeData = JSON.parse(brokersBefore.content[0].text.split('\n\n')[1]);
  console.log('Authenticated brokers before:', beforeData.summary.authenticated);
  
  // Test 4: Authenticate Groww
  console.log('\n🔐 Test 4: Authenticate Groww');
  const growwToken = 'YOUR_GROWW_JWT_TOKEN_HERE';
  
  try {
    const authResult = await server.authenticateBroker(sessionId1, {
      broker: 'groww',
      access_token: growwToken
    });
    console.log('Authentication result:', authResult.content[0].text.includes('success'));
  } catch (error) {
    console.log('Authentication error:', error.message);
  }
  
  // Test 5: List brokers after authentication
  console.log('\n📊 Test 5: List Brokers (After Auth)');
  const brokersAfter = await server.listBrokers(sessionId1);
  const afterData = JSON.parse(brokersAfter.content[0].text.split('\n\n')[1]);
  console.log('Authenticated brokers after:', afterData.summary.authenticated);
  console.log('Groww authenticated:', afterData.brokers.find(b => b.name === 'groww')?.authenticated);
  
  // Test 6: Test session persistence with new "connection"
  console.log('\n📱 Test 6: New Connection (should get same session)');
  const connectionId3 = server.getConnectionId(mockConnection);
  const sessionId3 = server.sessionManager.getSessionId(connectionId3);
  console.log('Session ID:', sessionId3.substring(0, 12) + '...');
  console.log('Session persisted:', sessionId1 === sessionId3);
  
  const brokersPersisted = await server.listBrokers(sessionId3);
  const persistedData = JSON.parse(brokersPersisted.content[0].text.split('\n\n')[1]);
  console.log('Authentication persisted:', persistedData.summary.authenticated > 0);
  
  // Test 7: Check session manager state
  console.log('\n📈 Test 7: Session Manager State');
  const sessionInfo = server.sessionManager.getSessionsInfo();
  console.log('Total sessions:', sessionInfo.totalSessions);
  console.log('Session details:');
  sessionInfo.sessions.forEach(session => {
    const growwAuth = session.authenticatedBrokers.includes('groww');
    console.log(`  Session ${session.id.substring(0, 8)}... - Groww: ${growwAuth}`);
  });
  
  // Cleanup
  server.sessionManager.shutdown();
  
  console.log('\n🎯 Diagnosis Complete!');
}

debugAuthentication().catch(console.error);