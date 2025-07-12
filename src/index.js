// src/index.js
// Main entry point for TurtleStack

import { TurtleStack } from './server/TurtleStack.js';
import { Logger } from './utils/logger.js';

async function main() {
  try {
    const server = new TurtleStack();
    await server.run();
  } catch (error) {
    Logger.error("Failed to start server", { error: error.message });
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  Logger.info("Received SIGINT, shutting down gracefully");
  process.exit(0);
});

process.on('SIGTERM', () => {
  Logger.info("Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

// Start the server
main();