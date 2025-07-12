#!/usr/bin/env node

import https from 'https';
const WORKER_URL = 'https://YOUR_WORKER_SUBDOMAIN.YOUR_USERNAME.workers.dev';
let sessionId = null;

async function makeRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(WORKER_URL + endpoint);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (sessionId) options.headers['X-Session-ID'] = sessionId;
    
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          resolve({ error: 'Parse error' });
        }
      });
    });
    
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

let buffer = '';

process.stdin.on('data', async (chunk) => {
  buffer += chunk.toString();
  
  // Process complete messages (separated by newlines)
  const lines = buffer.split('\n');
  buffer = lines.pop() || ''; // Keep incomplete line in buffer
  
  for (const line of lines) {
    if (line.trim()) {
      try {
        const message = JSON.parse(line);
        console.error('Received message:', JSON.stringify(message));
        
        if (message.method === 'initialize') {
          const response = {
            jsonrpc: '2.0',
            id: message.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: { tools: {} },
              serverInfo: { name: 'TurtleStack Trading', version: '2.0.0' }
            }
          };
          console.error('Sending initialize response:', JSON.stringify(response));
          process.stdout.write(JSON.stringify(response) + '\n');
          
        } else if (message.method === 'tools/list') {
          const tools = await makeRequest('/mcp/tools');
          console.error('Received tools from worker:', JSON.stringify(tools));
          const response = {
            jsonrpc: '2.0',
            id: message.id,
            result: { tools: Array.isArray(tools) ? tools : (tools.tools || []) }
          };
          console.error('Sending tools response:', JSON.stringify(response));
          process.stdout.write(JSON.stringify(response) + '\n');
          
        } else if (message.method === 'tools/call') {
          if (!sessionId) {
            const session = await makeRequest('/session/create', 'POST');
            sessionId = session.sessionId;
            console.error('Created session:', sessionId);
          }
          
          const result = await makeRequest('/mcp/call', 'POST', {
            tool: message.params.name,
            arguments: message.params.arguments
          });
          
          const response = {
            jsonrpc: '2.0',
            id: message.id,
            result: {
              content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
            }
          };
          console.error('Sending tool call response:', JSON.stringify(response));
          process.stdout.write(JSON.stringify(response) + '\n');
        }
        
      } catch (error) {
        console.error('Error processing message:', error);
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          error: { code: -32700, message: error.message }
        }) + '\n');
      }
    }
  }
});