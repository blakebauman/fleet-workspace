# Fleet Service Troubleshooting

## 🐛 "I added a new agent but don't see it" Issue

I've added debug logging to help diagnose connectivity issues. Here's how to troubleshoot:

### 1. Check WebSocket Connection

Open browser DevTools (F12) and look at the Console tab. You should see:

```
Connecting to WebSocket: ws://localhost:8787/ws
WebSocket connected to: ws://localhost:8787/ws
WebSocket message received: {"type":"state","counter":0,"agents":[]}
```

If you don't see this, the WebSocket isn't connecting properly.

### 2. Check Agent Creation

When you create an agent, you should see in the console:

```
Creating agent: test-agent
Sending WebSocket message: {type: 'createAgent', name: 'test-agent'}
WebSocket message received: {"type":"agentCreated","name":"test-agent"}
WebSocket message received: {"type":"state","counter":0,"agents":["test-agent"]}
```

### 3. Check Server Logs

In the terminal where you ran `pnpm dev`, you should see:

```
Creating agent "test-agent" at path: /
Agent "test-agent" created successfully. Current agents: test-agent
WebSocket connected to path: /, agents: test-agent, counter: 0
```

## 🔧 Common Issues & Fixes

### Issue 1: WebSocket Connection Failed

**Symptoms**: Console shows "WebSocket not connected"
**Causes**:

- Dev server not running
- Port 8787 blocked
- WebSocket URL construction wrong

**Fix**:

1. Restart dev server: `pnpm --filter fleet-service dev`
2. Check URL: Should be `ws://localhost:8787/ws` for root
3. For child paths: `ws://localhost:8787/team1/ws`

### Issue 2: Agent Created But Not Visible

**Symptoms**: Console shows agent creation but UI doesn't update
**Causes**:

- WebSocket message not received
- UI update function not working
- State synchronization issue

**Fix**:

1. Check browser console for `WebSocket message received` logs
2. Verify the `updateState` function is called
3. Check if `agentList.innerHTML` is being updated

### Issue 3: Wrong Durable Object Instance

**Symptoms**: Agents appear in wrong locations
**Causes**:

- Path detection not working
- DO routing incorrect

**Fix**:

1. Check console logs for "WebSocket connected to path: X"
2. Verify the path matches your current URL
3. Ensure DO is created with correct `idFromName(path)`

## 🎯 Step-by-Step Debug Process

1. **Open DevTools Console**: F12 → Console tab
2. **Navigate to root**: `http://localhost:8787/`
3. **Check connection logs**: Should see WebSocket connection success
4. **Create an agent**: Enter name, click "Create Agent"
5. **Watch for logs**:
   - "Creating agent: [name]"
   - "Sending WebSocket message: ..."
   - "WebSocket message received: ..." (twice - agentCreated + state)
6. **Verify UI update**: Agent should appear in the list

## 🚨 If Still Not Working

1. **Hard refresh**: Ctrl+F5 or Cmd+Shift+R
2. **Clear browser cache**: DevTools → Application → Storage → Clear
3. **Restart dev server**: Kill and restart `pnpm dev`
4. **Check terminal**: Look for any error messages
5. **Try different browser**: Rule out browser-specific issues

## ✅ Expected Behavior

When everything works correctly:

1. ✅ WebSocket connects immediately on page load
2. ✅ Connection status shows "Connected" (green)
3. ✅ Creating agent shows success message
4. ✅ Agent appears in list with green status dot
5. ✅ Can navigate to agent by clicking "👥 Manage"
6. ✅ Each level maintains independent state
