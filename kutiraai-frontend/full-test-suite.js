#!/usr/bin/env node

const http = require('http');
const https = require('https');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let passedTests = 0;
let failedTests = 0;

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function testPassed(testName) {
  passedTests++;
  log(`✅ PASS: ${testName}`, colors.green);
}

function testFailed(testName, error) {
  failedTests++;
  log(`❌ FAIL: ${testName}`, colors.red);
  if (error) {
    log(`   Error: ${error}`, colors.red);
  }
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ 
          statusCode: res.statusCode, 
          headers: res.headers,
          data: data 
        });
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testBackendAPI() {
  log('\n=== Testing Backend API ===', colors.cyan);
  
  const endpoints = [
    { url: 'http://localhost:8000/api/health', name: 'Health Endpoint' },
    { url: 'http://localhost:8000/api/mcp/services', name: 'MCP Services' },
    { url: 'http://localhost:8000/api/mcp/metrics', name: 'MCP Metrics' },
    { url: 'http://localhost:8000/api/mcp/health', name: 'MCP Health' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(endpoint.url);
      if (response.statusCode === 200) {
        const data = JSON.parse(response.data);
        
        // Validate response structure
        if (endpoint.name === 'MCP Services' && Array.isArray(data)) {
          testPassed(`${endpoint.name} - Returns array of services`);
          if (data.length > 0 && data[0].name && data[0].status) {
            testPassed(`${endpoint.name} - Valid service structure`);
          }
        } else if (endpoint.name === 'MCP Metrics' && data.totalServers !== undefined) {
          testPassed(`${endpoint.name} - Valid metrics structure`);
        } else if (endpoint.name === 'Health Endpoint' && data.status) {
          testPassed(`${endpoint.name} - Valid health response`);
        } else {
          testPassed(`${endpoint.name} - Returns valid JSON`);
        }
        
        // Check CORS headers
        if (response.headers['access-control-allow-origin']) {
          testPassed(`${endpoint.name} - CORS headers present`);
        } else {
          testFailed(`${endpoint.name} - Missing CORS headers`);
        }
      } else {
        testFailed(`${endpoint.name} - Unexpected status code: ${response.statusCode}`);
      }
    } catch (error) {
      testFailed(`${endpoint.name}`, error.message);
    }
  }
}

async function testFrontend() {
  log('\n=== Testing Frontend ===', colors.cyan);
  
  try {
    // Test main frontend
    const response = await makeRequest('http://localhost:3001');
    if (response.statusCode === 200) {
      testPassed('Frontend is accessible');
      
      // Check if it's HTML
      if (response.data.includes('<!doctype html>')) {
        testPassed('Frontend returns HTML');
      }
      
      // Check for React app
      if (response.data.includes('root')) {
        testPassed('React root element found');
      }
    } else {
      testFailed('Frontend accessibility', `Status code: ${response.statusCode}`);
    }
    
    // Test specific routes
    const routes = [
      '/dashboard/default',
      '/mcp',
      '/imagegen'
    ];
    
    for (const route of routes) {
      try {
        const routeResponse = await makeRequest(`http://localhost:3001${route}`);
        if (routeResponse.statusCode === 200) {
          testPassed(`Route ${route} is accessible`);
        } else {
          testFailed(`Route ${route}`, `Status code: ${routeResponse.statusCode}`);
        }
      } catch (error) {
        testFailed(`Route ${route}`, error.message);
      }
    }
    
  } catch (error) {
    testFailed('Frontend test', error.message);
  }
}

async function testIntegration() {
  log('\n=== Testing Frontend-Backend Integration ===', colors.cyan);
  
  // Since we can't test actual browser JS execution from Node.js,
  // we'll test that both services are running and responding correctly
  
  try {
    // Test that frontend can potentially connect to backend
    const frontendResponse = await makeRequest('http://localhost:3001');
    const backendResponse = await makeRequest('http://localhost:8000/api/health');
    
    if (frontendResponse.statusCode === 200 && backendResponse.statusCode === 200) {
      testPassed('Both frontend and backend are running');
      
      // Check if backend returns proper JSON
      const backendData = JSON.parse(backendResponse.data);
      if (backendData.status) {
        testPassed('Backend returns valid health status');
      }
      
      // Test POST endpoint
      const postData = JSON.stringify({
        service: 'test-service',
        tool: 'test-tool',
        params: {}
      });
      
      const postOptions = {
        hostname: 'localhost',
        port: 8000,
        path: '/api/mcp/execute',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        }
      };
      
      const postResponse = await new Promise((resolve, reject) => {
        const req = http.request(postOptions, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => resolve({ statusCode: res.statusCode, data }));
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
      });
      
      if (postResponse.statusCode === 200) {
        testPassed('POST /api/mcp/execute endpoint works');
      } else {
        testFailed('POST endpoint', `Status code: ${postResponse.statusCode}`);
      }
      
    } else {
      testFailed('Service availability', 'One or both services not responding');
    }
    
  } catch (error) {
    testFailed('Integration test', error.message);
  }
}

async function testDataValidation() {
  log('\n=== Testing Data Validation ===', colors.cyan);
  
  try {
    // Test MCP services data structure
    const servicesResponse = await makeRequest('http://localhost:8000/api/mcp/services');
    const services = JSON.parse(servicesResponse.data);
    
    if (Array.isArray(services) && services.length > 0) {
      const requiredFields = ['name', 'status', 'port', 'health', 'tools', 'description'];
      const service = services[0];
      
      for (const field of requiredFields) {
        if (service[field] !== undefined) {
          testPassed(`Service has required field: ${field}`);
        } else {
          testFailed(`Service missing field: ${field}`);
        }
      }
      
      // Validate field types
      if (typeof service.name === 'string') testPassed('Service name is string');
      if (typeof service.port === 'number') testPassed('Service port is number');
      if (Array.isArray(service.tools)) testPassed('Service tools is array');
      
      // Validate status values
      const validStatuses = ['running', 'stopped'];
      if (validStatuses.includes(service.status)) {
        testPassed('Service status has valid value');
      }
    }
    
    // Test metrics data structure
    const metricsResponse = await makeRequest('http://localhost:8000/api/mcp/metrics');
    const metrics = JSON.parse(metricsResponse.data);
    
    const metricsFields = ['totalServers', 'activeServers', 'cpuUsage', 'memoryUsage'];
    for (const field of metricsFields) {
      if (metrics[field] !== undefined) {
        testPassed(`Metrics has field: ${field}`);
      } else {
        testFailed(`Metrics missing field: ${field}`);
      }
    }
    
  } catch (error) {
    testFailed('Data validation', error.message);
  }
}

async function runAllTests() {
  log('🚀 Starting KutiraAI Dashboard Full Test Suite', colors.blue);
  log('=' .repeat(50), colors.blue);
  
  const startTime = Date.now();
  
  // Run test suites
  await testBackendAPI();
  await testFrontend();
  await testIntegration();
  await testDataValidation();
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Summary
  log('\n' + '=' .repeat(50), colors.blue);
  log('📊 Test Summary', colors.blue);
  log(`✅ Passed: ${passedTests}`, colors.green);
  log(`❌ Failed: ${failedTests}`, colors.red);
  log(`⏱️  Duration: ${duration}s`, colors.cyan);
  
  const successRate = ((passedTests / (passedTests + failedTests)) * 100).toFixed(1);
  if (failedTests === 0) {
    log(`\n🎉 All tests passed! Success rate: ${successRate}%`, colors.green);
  } else {
    log(`\n⚠️  Some tests failed. Success rate: ${successRate}%`, colors.yellow);
  }
  
  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  log(`\n💥 Fatal error: ${error.message}`, colors.red);
  process.exit(1);
});