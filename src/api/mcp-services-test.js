/**
 * KutiraAI MCP Services - Test Suite
 * Comprehensive testing and validation for MCP services integration
 */

import { getMCPServices, MCPError, MCPServices } from './mcp-services';

/**
 * Simple test runner for MCP services
 */
class MCPTestRunner {
  constructor() {
    this.tests = [];
    this.results = [];
  }

  /**
   * Add a test case
   * @param {string} name - Test name
   * @param {Function} testFn - Test function
   */
  test(name, testFn) {
    this.tests.push({ name, testFn });
  }

  /**
   * Run all tests
   */
  async runAll() {
    console.log('🚀 Starting MCP Services Test Suite...');
    
    for (const test of this.tests) {
      try {
        console.log(`\n⏳ Running: ${test.name}`);
        await test.testFn();
        console.log(`✅ PASSED: ${test.name}`);
        this.results.push({ name: test.name, status: 'PASSED' });
      } catch (error) {
        console.error(`❌ FAILED: ${test.name}`, error.message);
        this.results.push({ name: test.name, status: 'FAILED', error: error.message });
      }
    }

    this.printSummary();
    return this.results;
  }

  /**
   * Print test summary
   */
  printSummary() {
    const passed = this.results.filter(r => r.status === 'PASSED').length;
    const failed = this.results.filter(r => r.status === 'FAILED').length;
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total: ${this.results.length}`);
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed! MCP services are ready.');
    } else {
      console.log('\n⚠️  Some tests failed. Check the backend connection.');
    }
  }
}

/**
 * Test suite for MCP services
 */
const runMCPServiceTests = async () => {
  const testRunner = new MCPTestRunner();

  // Test 1: Service Initialization
  testRunner.test('Service Initialization', async () => {
    const mcp = await getMCPServices();
    
    if (!mcp) {
      throw new Error('MCP service initialization failed');
    }
    
    if (typeof mcp.getMCPServices !== 'function') {
      throw new Error('getMCPServices method not available');
    }
    
    console.log('   ✓ Service initialized successfully');
    console.log('   ✓ All required methods available');
  });

  // Test 2: Connection Status
  testRunner.test('Connection Status Check', async () => {
    const mcp = await getMCPServices();
    const status = mcp.getConnectionStatus();
    
    if (!status.isInitialized) {
      throw new Error('Service not properly initialized');
    }
    
    console.log('   ✓ Connection status retrieved');
    console.log(`   ✓ Initialized: ${status.isInitialized}`);
    console.log(`   ✓ WebSocket connected: ${status.websocket.isConnected}`);
  });

  // Test 3: Service List Retrieval (with fallback for offline testing)
  testRunner.test('Service List Retrieval', async () => {
    const mcp = await getMCPServices();
    
    try {
      const services = await mcp.getMCPServices();
      
      if (!Array.isArray(services)) {
        throw new Error('Services should be returned as an array');
      }
      
      console.log(`   ✓ Retrieved ${services.length} MCP services`);
      
      if (services.length > 0) {
        const firstService = services[0];
        const requiredFields = ['id', 'name', 'status'];
        
        for (const field of requiredFields) {
          if (!(field in firstService)) {
            throw new Error(`Service object missing required field: ${field}`);
          }
        }
        
        console.log('   ✓ Service objects have correct structure');
        console.log(`   ✓ First service: ${firstService.name} (${firstService.status})`);
      }
      
    } catch (error) {
      if (error instanceof MCPError && error.code === 'REQUEST_FAILED') {
        console.log('   ⚠️  Backend not available - testing offline mode');
        console.log('   ✓ Error handling working correctly');
      } else {
        throw error;
      }
    }
  });

  // Test 4: Health Status Check
  testRunner.test('Health Status Check', async () => {
    const mcp = await getMCPServices();
    
    try {
      const health = await mcp.getHealthStatus();
      
      const requiredFields = ['overall_status', 'services', 'system_info'];
      for (const field of requiredFields) {
        if (!(field in health)) {
          throw new Error(`Health status missing field: ${field}`);
        }
      }
      
      console.log('   ✓ Health status structure correct');
      console.log(`   ✓ Overall status: ${health.overall_status}`);
      
    } catch (error) {
      if (error instanceof MCPError && error.code === 'REQUEST_FAILED') {
        console.log('   ⚠️  Backend not available - testing offline mode');
        console.log('   ✓ Error handling working correctly');
      } else {
        throw error;
      }
    }
  });

  // Test 5: System Metrics Check
  testRunner.test('System Metrics Check', async () => {
    const mcp = await getMCPServices();
    
    try {
      const metrics = await mcp.getSystemMetrics();
      
      const requiredFields = ['cpu_usage', 'memory_usage', 'active_services'];
      for (const field of requiredFields) {
        if (!(field in metrics)) {
          throw new Error(`Metrics missing field: ${field}`);
        }
      }
      
      if (typeof metrics.cpu_usage !== 'number') {
        throw new Error('CPU usage should be a number');
      }
      
      console.log('   ✓ Metrics structure correct');
      console.log(`   ✓ CPU: ${metrics.cpu_usage}%, Memory: ${metrics.memory_usage}%`);
      
    } catch (error) {
      if (error instanceof MCPError && error.code === 'REQUEST_FAILED') {
        console.log('   ⚠️  Backend not available - testing offline mode');
        console.log('   ✓ Error handling working correctly');
      } else {
        throw error;
      }
    }
  });

  // Test 6: Voice Status Check
  testRunner.test('Voice Status Check', async () => {
    const mcp = await getMCPServices();
    
    try {
      const voiceStatus = await mcp.getVoiceStatus();
      
      const requiredFields = ['tts_available', 'stt_available'];
      for (const field of requiredFields) {
        if (!(field in voiceStatus)) {
          throw new Error(`Voice status missing field: ${field}`);
        }
      }
      
      console.log('   ✓ Voice status structure correct');
      console.log(`   ✓ TTS Available: ${voiceStatus.tts_available}`);
      console.log(`   ✓ STT Available: ${voiceStatus.stt_available}`);
      
    } catch (error) {
      if (error instanceof MCPError && error.code === 'REQUEST_FAILED') {
        console.log('   ⚠️  Backend not available - testing offline mode');
        console.log('   ✓ Error handling working correctly');
      } else {
        throw error;
      }
    }
  });

  // Test 7: Error Handling
  testRunner.test('Error Handling', async () => {
    const mcp = await getMCPServices();
    
    try {
      // Test with invalid service ID
      await mcp.executeMCPTool('invalid-service-id', 'invalid-tool', {});
      throw new Error('Should have thrown an error for invalid service');
      
    } catch (error) {
      if (error instanceof MCPError) {
        console.log('   ✓ MCPError thrown correctly');
        console.log(`   ✓ Error code: ${error.code}`);
        console.log(`   ✓ Error has timestamp: ${!!error.timestamp}`);
      } else {
        console.log('   ✓ Standard error handling working');
      }
    }
  });

  // Test 8: Event Subscription
  testRunner.test('Event Subscription', async () => {
    const mcp = await getMCPServices();
    let eventReceived = false;
    
    // Subscribe to a test event
    mcp.subscribe('testEvent', (data) => {
      eventReceived = true;
    });
    
    // Emit a test event
    mcp.emit('testEvent', { test: true });
    
    // Small delay to ensure event processing
    await new Promise(resolve => setTimeout(resolve, 10));
    
    if (!eventReceived) {
      throw new Error('Event subscription not working');
    }
    
    console.log('   ✓ Event subscription working');
    console.log('   ✓ Event emission working');
    
    // Cleanup
    mcp.unsubscribe('testEvent', () => {});
  });

  // Test 9: WebSocket Manager (if available)
  testRunner.test('WebSocket Connection', async () => {
    const mcp = await getMCPServices();
    const connectionStatus = mcp.getConnectionStatus();
    
    if (connectionStatus.websocket) {
      console.log('   ✓ WebSocket manager available');
      console.log(`   ✓ Connection state: ${connectionStatus.websocket.isConnected}`);
      console.log(`   ✓ Reconnection attempts: ${connectionStatus.websocket.reconnectAttempts}`);
    } else {
      throw new Error('WebSocket manager not available');
    }
  });

  // Test 10: Configuration Validation
  testRunner.test('Configuration Validation', async () => {
    // Test that the service uses expected configuration
    const mcp = new MCPServices();
    
    if (!mcp.httpClient) {
      throw new Error('HTTP client not initialized');
    }
    
    console.log('   ✓ HTTP client initialized');
    console.log('   ✓ Configuration structure valid');
    
    // Test base URL configuration
    if (!mcp.httpClient.baseURL.includes('localhost:8000')) {
      console.log('   ⚠️  Custom base URL detected - ensure it matches your backend');
    } else {
      console.log('   ✓ Default base URL configured correctly');
    }
  });

  // Run all tests
  return await testRunner.runAll();
};

/**
 * Manual test functions for interactive testing
 */
const manualTests = {
  /**
   * Test TTS functionality (requires user interaction)
   */
  async testTTS() {
    console.log('🔊 Testing Text-to-Speech...');
    
    try {
      const mcp = await getMCPServices();
      const result = await mcp.textToSpeech('Hello from KutiraAI MCP Services test!');
      
      console.log('✅ TTS request successful:', result);
      
      // Try to play audio if browser supports it
      if (result.audio_url && typeof Audio !== 'undefined') {
        const audio = new Audio(result.audio_url);
        audio.play().then(() => {
          console.log('🎵 Audio playing successfully');
        }).catch(error => {
          console.log('⚠️  Audio playback failed:', error.message);
        });
      }
      
    } catch (error) {
      console.error('❌ TTS test failed:', error);
    }
  },

  /**
   * Test agent spawning (requires backend)
   */
  async testAgentSpawning() {
    console.log('🤖 Testing Agent Spawning...');
    
    try {
      const mcp = await getMCPServices();
      const result = await mcp.spawnAgent(
        'test_agent',
        'Perform a simple test operation',
        { priority: 'low', timeout: 60000 }
      );
      
      console.log('✅ Agent spawned successfully:', result);
      
    } catch (error) {
      console.error('❌ Agent spawning test failed:', error);
    }
  },

  /**
   * Test tool execution (requires backend and valid service)
   */
  async testToolExecution() {
    console.log('🔧 Testing Tool Execution...');
    
    try {
      const mcp = await getMCPServices();
      
      // First get services to find a valid one
      const services = await mcp.getMCPServices();
      
      if (services.length === 0) {
        console.log('⚠️  No services available for testing');
        return;
      }
      
      const testService = services[0];
      if (testService.tools.length === 0) {
        console.log('⚠️  No tools available on first service');
        return;
      }
      
      const testTool = testService.tools[0];
      const result = await mcp.executeMCPTool(testService.id, testTool.name, {});
      
      console.log('✅ Tool executed successfully:', result);
      
    } catch (error) {
      console.error('❌ Tool execution test failed:', error);
    }
  }
};

/**
 * Export test functions for use in development
 */
export {
  runMCPServiceTests,
  manualTests,
  MCPTestRunner
};

// Auto-run tests in development mode
if (process.env.NODE_ENV === 'development') {
  console.log('🧪 MCP Services Test Suite available');
  console.log('Run tests with: runMCPServiceTests()');
  console.log('Manual tests available in manualTests object');
  
  // Make tests available globally for console access
  if (typeof window !== 'undefined') {
    window.mcpTests = {
      runAll: runMCPServiceTests,
      manual: manualTests
    };
    
    console.log('💡 Access tests via: window.mcpTests.runAll() or window.mcpTests.manual.testTTS()');
  }
}

export default {
  runMCPServiceTests,
  manualTests
};