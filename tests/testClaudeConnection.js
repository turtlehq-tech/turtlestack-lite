// tests/testClaudeConnection.js
// Test connection persistence like Claude would use it

import { TurtleStack } from '../src/server/TurtleStack.js';
import { Logger } from '../src/utils/logger.js';

async function testClaudeConnection() {
  console.log('🎭 Testing Claude-like Connection Behavior...');
  
  const server = new TurtleStack();
  
  // Simulate Claude Desktop requests (with same meta data)
  function createClaudeRequest(toolName, args = {}) {
    return {
      params: {
        name: toolName,
        arguments: args
      },
      meta: {
        // Claude typically sends consistent meta across a session
        progressToken: 'claude_session_abc123',
        clientId: 'claude_desktop_v1.0'
      }
    };
  }
  
  console.log('\n🔗 Step 1: First request - List Brokers');
  const request1 = createClaudeRequest('list_brokers');
  const connectionId1 = server.getConnectionId(request1);
  const sessionId1 = server.sessionManager.getSessionId(connectionId1);
  console.log('Connection ID:', connectionId1);
  console.log('Session ID:', sessionId1.substring(0, 12) + '...');
  
  const brokers1 = await server.listBrokers(sessionId1);
  console.log('Authenticated brokers:', JSON.parse(brokers1.content[0].text.split('\n\n')[1]).summary.authenticated);
  
  console.log('\n🔐 Step 2: Second request - Authenticate Groww');
  const request2 = createClaudeRequest('authenticate_broker', {
    broker: 'groww',
    access_token: 'YOUR_GROWW_JWT_TOKEN_HERE'
  });
  
  const connectionId2 = server.getConnectionId(request2);
  const sessionId2 = server.sessionManager.getSessionId(connectionId2);
  console.log('Connection ID:', connectionId2);
  console.log('Session ID:', sessionId2.substring(0, 12) + '...');
  console.log('Same session?', sessionId1 === sessionId2);
  
  try {
    const authResult = await server.authenticateBroker(sessionId2, {
      broker: 'groww',
      access_token: 'YOUR_GROWW_JWT_TOKEN_HERE'
    });
    console.log('Authentication successful:', authResult.content[0].text.includes('success'));
  } catch (error) {
    console.log('Authentication error:', error.message);
  }
  
  console.log('\n📊 Step 3: Third request - List Brokers Again');
  const request3 = createClaudeRequest('list_brokers');
  const connectionId3 = server.getConnectionId(request3);
  const sessionId3 = server.sessionManager.getSessionId(connectionId3);
  console.log('Connection ID:', connectionId3);
  console.log('Session ID:', sessionId3.substring(0, 12) + '...');
  console.log('Same session?', sessionId1 === sessionId3);
  
  const brokers3 = await server.listBrokers(sessionId3);
  const brokerData = JSON.parse(brokers3.content[0].text.split('\n\n')[1]);
  console.log('Authenticated brokers:', brokerData.summary.authenticated);
  console.log('Groww authenticated:', brokerData.brokers.find(b => b.name === 'groww')?.authenticated);
  
  console.log('\n🎯 Step 4: Set Active Broker');
  const request4 = createClaudeRequest('set_active_broker', { broker: 'groww' });
  const connectionId4 = server.getConnectionId(request4);
  const sessionId4 = server.sessionManager.getSessionId(connectionId4);
  console.log('Same session?', sessionId1 === sessionId4);
  
  const activeResult = await server.setActiveBroker(sessionId4, 'groww');
  console.log('Active broker set:', activeResult.content[0].text.includes('groww'));
  
  console.log('\n📈 Step 5: Final Broker List');
  const request5 = createClaudeRequest('list_brokers');
  const sessionId5 = server.sessionManager.getSessionId(server.getConnectionId(request5));
  const finalBrokers = await server.listBrokers(sessionId5);
  const finalData = JSON.parse(finalBrokers.content[0].text.split('\n\n')[1]);
  console.log('Active broker:', finalData.activeBroker);
  console.log('Authenticated count:', finalData.summary.authenticated);
  
  console.log('\n✅ Connection Test Results:');
  console.log(`  • Session persistence: ${sessionId1 === sessionId3 ? '✅' : '❌'}`);
  console.log(`  • Authentication persistence: ${finalData.summary.authenticated > 0 ? '✅' : '❌'}`);
  console.log(`  • Active broker persistence: ${finalData.activeBroker === 'groww' ? '✅' : '❌'}`);
  
  // Cleanup
  server.sessionManager.shutdown();
  
  console.log('\n🎉 Claude Connection Test Complete!');
}

testClaudeConnection().catch(console.error);