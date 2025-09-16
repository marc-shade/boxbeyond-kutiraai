#!/usr/bin/env node

const http = require('http');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
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
    }).on('error', reject);
  });
}

async function verifyDashboard() {
  log('\n📊 KutiraAI Dashboard Verification\n', colors.cyan);
  
  // Check backend is running
  try {
    const backendResponse = await makeRequest('http://localhost:8000/api/mcp/services');
    const services = JSON.parse(backendResponse.data);
    log(`✅ Backend API: ${services.length} MCP services available`, colors.green);
    
    // Display service summary
    const runningServices = services.filter(s => s.status === 'running').length;
    const stoppedServices = services.filter(s => s.status === 'stopped').length;
    
    log(`   - Running: ${runningServices}`, colors.green);
    log(`   - Stopped: ${stoppedServices}`, colors.green);
    
    // List services
    log('\n📦 Available MCP Services:', colors.blue);
    services.forEach(service => {
      const status = service.status === 'running' ? '🟢' : '🔴';
      log(`   ${status} ${service.name} (Port: ${service.port})`, colors.cyan);
      log(`      Tools: ${service.tools.join(', ')}`, colors.reset);
    });
    
  } catch (error) {
    log(`❌ Backend API Error: ${error.message}`, colors.red);
  }
  
  // Check frontend is running
  try {
    const frontendResponse = await makeRequest('http://localhost:3001/mcp');
    if (frontendResponse.statusCode === 200) {
      log('\n✅ Frontend Dashboard: Accessible at http://localhost:3001/mcp', colors.green);
    }
  } catch (error) {
    log(`❌ Frontend Error: ${error.message}`, colors.red);
  }
  
  // Check metrics endpoint
  try {
    const metricsResponse = await makeRequest('http://localhost:8000/api/mcp/metrics');
    const metrics = JSON.parse(metricsResponse.data);
    
    log('\n📈 System Metrics:', colors.blue);
    log(`   CPU Usage: ${Math.round(metrics.cpuUsage)}%`, colors.cyan);
    log(`   Memory Usage: ${Math.round(metrics.memoryUsage)}%`, colors.cyan);
    log(`   Network Latency: ${Math.round(metrics.networkLatency)}ms`, colors.cyan);
    
  } catch (error) {
    log(`❌ Metrics Error: ${error.message}`, colors.red);
  }
  
  log('\n🔗 Dashboard Links:', colors.blue);
  log('   Main Dashboard: http://localhost:3001/dashboard/default', colors.cyan);
  log('   MCP Services: http://localhost:3001/mcp', colors.cyan);
  log('   Image Generator: http://localhost:3001/imagegen', colors.cyan);
  
  log('\n✨ Dashboard verification complete!', colors.green);
}

verifyDashboard().catch(error => {
  log(`\n💥 Fatal error: ${error.message}`, colors.red);
  process.exit(1);
});