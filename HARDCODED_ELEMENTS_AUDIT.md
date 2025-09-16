# Hard-Coded Elements Audit - KutiraAI Frontend

## 1. User Authentication & Profile
**Location:** `/src/layout/Dashboard/Header/HeaderContent/Profile/index.jsx`
- **Lines 94, 127:** Hard-coded "John Doe" username
- **Status:** Needs connection to real auth system

## 2. Voice System Buttons
**Location:** `/src/pages/dashboard/MCPDashboardSimple.jsx`
- **Line 303:** `onClick={() => console.log('Test STT')}` - Test STT button
- **Line 310:** `onClick={() => console.log('Test TTS')}` - Test TTS button
- **Status:** Needs real voice-mode MCP integration

## 3. Agent Spawning Buttons  
**Location:** `/src/pages/dashboard/MCPDashboardSimple.jsx`
- **Line 327:** `onClick={() => console.log('Spawn Researcher')}` - Spawn Researcher button
- **Line 334:** `onClick={() => console.log('Spawn Coder')}` - Spawn Coder button
- **Status:** Needs real claude-flow agent spawning

## 4. Notifications System
**Location:** `/src/layout/Dashboard/Header/HeaderContent/Notification.jsx`
- Mock notification data
- No real event subscription
- **Status:** Needs WebSocket/SSE integration for real MCP events

## 5. Mock Backend Data
**Location:** `/backend-mock.js`
- All data is simulated/fake
- Mock services, metrics, health data
- **Status:** Needs connection to real MCP servers

## 6. Dark Mode
**Location:** Multiple theme files
- Theme switching exists but not fully implemented
- **Status:** Needs proper dark mode implementation

## 7. Dashboard Metrics
**Location:** `/src/pages/dashboard/index.jsx`
- Using mock stats from backend
- **Status:** Needs real system metrics

## 8. Tool Execution
**Location:** `/src/pages/dashboard/MCPDashboardSimple.jsx` (line 83-93)
- `executeMCPTool` just logs to console
- **Status:** Needs real MCP tool execution

## Implementation Priority:
1. ✅ Fix logo (COMPLETED)
2. Voice system integration (High - user facing)
3. Agent spawning (High - core functionality)
4. Dark mode (High - user requested)
5. User authentication (Medium)
6. Real metrics (Medium)
7. Notifications (Medium)
8. WebSocket updates (Low - enhancement)