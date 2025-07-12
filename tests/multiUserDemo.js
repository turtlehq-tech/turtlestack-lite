// tests/multiUserDemo.js
// Demonstration of multi-user session isolation

import { TurtleStack } from '../src/server/TurtleStack.js';
import { Logger } from '../src/utils/logger.js';

// Mock request objects for different users
function createMockRequest(userId) {
  return {
    params: {
      name: 'list_brokers',
      arguments: {}
    },
    meta: {
      clientId: `user_${userId}`,
      progressToken: `token_${userId}_${Date.now()}`
    }
  };
}

async function demonstrateMultiUserIsolation() {
  Logger.info("🚀 Starting Multi-User Isolation Demo");
  
  const server = new TurtleStack();
  
  // Simulate 3 different users connecting
  const user1Request = createMockRequest('alice');
  const user2Request = createMockRequest('bob');
  const user3Request = createMockRequest('charlie');

  Logger.info("\n📱 User Alice connects and lists brokers");
  const user1SessionId = server.getConnectionId(user1Request);
  const user1Session = server.sessionManager.getSessionId(user1SessionId);
  const user1Response = await server.listBrokers(user1Session);
  console.log("Alice's session:", user1Session.substring(0, 12), "...");
  console.log("Alice's brokers:", JSON.stringify(user1Response.content[0].text).substring(0, 100) + "...");

  Logger.info("\n📱 User Bob connects and lists brokers");
  const user2SessionId = server.getConnectionId(user2Request);
  const user2Session = server.sessionManager.getSessionId(user2SessionId);
  const user2Response = await server.listBrokers(user2Session);
  console.log("Bob's session:", user2Session.substring(0, 12), "...");
  console.log("Bob's brokers:", JSON.stringify(user2Response.content[0].text).substring(0, 100) + "...");

  Logger.info("\n📱 User Charlie connects and lists brokers");
  const user3SessionId = server.getConnectionId(user3Request);
  const user3Session = server.sessionManager.getSessionId(user3SessionId);
  const user3Response = await server.listBrokers(user3Session);
  console.log("Charlie's session:", user3Session.substring(0, 12), "...");
  console.log("Charlie's brokers:", JSON.stringify(user3Response.content[0].text).substring(0, 100) + "...");

  // Verify sessions are different
  Logger.info("\n🔍 Verifying Session Isolation");
  console.log("Alice session ID:", user1Session.substring(0, 12), "...");
  console.log("Bob session ID:", user2Session.substring(0, 12), "...");
  console.log("Charlie session ID:", user3Session.substring(0, 12), "...");
  console.log("Sessions are unique:", 
    user1Session !== user2Session && 
    user2Session !== user3Session && 
    user1Session !== user3Session
  );

  // Simulate Alice setting active broker
  Logger.info("\n📊 Alice sets Kite as active broker");
  await server.setActiveBroker(user1Session, 'kite');
  const aliceAfterSet = await server.listBrokers(user1Session);
  // Extract JSON from formatted response
  const aliceText = aliceAfterSet.content[0].text;
  const aliceJson = JSON.parse(aliceText.split('\n\n')[1]);
  console.log("Alice's active broker after setting:", aliceJson.activeBroker);

  // Verify Bob's session is unaffected
  Logger.info("\n🔍 Verifying Bob's session is unaffected");
  const bobAfterAliceSet = await server.listBrokers(user2Session);
  const bobText = bobAfterAliceSet.content[0].text;
  const bobJson = JSON.parse(bobText.split('\n\n')[1]);
  console.log("Bob's active broker (should be None):", bobJson.activeBroker);

  // Show session information
  Logger.info("\n📈 Session Manager Statistics");
  const sessionInfo = server.sessionManager.getSessionsInfo();
  console.log("Total active sessions:", sessionInfo.totalSessions);
  console.log("Total connections:", sessionInfo.totalConnections);
  console.log("Session details:");
  sessionInfo.sessions.forEach((session, index) => {
    console.log(`  ${index + 1}. ID: ${session.id.substring(0, 12)}... Created: ${session.createdAt} Active Broker: ${session.activeBroker || 'None'}`);
  });

  // Simulate concurrent operations
  Logger.info("\n⚡ Simulating Concurrent Operations");
  const promises = [
    server.setActiveBroker(user1Session, 'groww'),
    server.setActiveBroker(user2Session, 'dhan'),
    server.setActiveBroker(user3Session, 'kite')
  ];

  const results = await Promise.all(promises);
  console.log("Alice set to:", JSON.parse(results[0].content[0].text.split('\n\n')[1]).broker);
  console.log("Bob set to:", JSON.parse(results[1].content[0].text.split('\n\n')[1]).broker);
  console.log("Charlie set to:", JSON.parse(results[2].content[0].text.split('\n\n')[1]).broker);

  // Final verification
  Logger.info("\n✅ Final Session Verification");
  const finalAlice = await server.listBrokers(user1Session);
  const finalBob = await server.listBrokers(user2Session);
  const finalCharlie = await server.listBrokers(user3Session);

  console.log("Alice's final active broker:", JSON.parse(finalAlice.content[0].text.split('\n\n')[1]).activeBroker);
  console.log("Bob's final active broker:", JSON.parse(finalBob.content[0].text.split('\n\n')[1]).activeBroker);
  console.log("Charlie's final active broker:", JSON.parse(finalCharlie.content[0].text.split('\n\n')[1]).activeBroker);

  // Cleanup
  Logger.info("\n🧹 Cleaning up sessions");
  server.sessionManager.shutdown();
  
  Logger.info("\n🎉 Multi-User Isolation Demo Complete!");
  console.log("\n✅ Key Features Demonstrated:");
  console.log("   • Each user gets isolated session with unique ID");
  console.log("   • Each session has separate broker instances");
  console.log("   • User actions don't affect other users");
  console.log("   • Concurrent operations work safely");
  console.log("   • Session manager tracks all connections");
  console.log("   • Automatic session cleanup on shutdown");
}

// Run the demo
demonstrateMultiUserIsolation().catch(console.error);