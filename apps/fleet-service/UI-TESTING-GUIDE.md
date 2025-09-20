# Agentic AI Inventory Management UI Testing Guide

## Overview

The UI has been enhanced with three main sections:
1. **Fleet Management** - Original fleet functionality (creating agents, messaging)
2. **Inventory Dashboard** - Inventory management with real-time updates
3. **AI Control Center** - AI-powered analysis and workflows

## Getting Started

1. **Start the development server**:
   ```bash
   cd apps/fleet-service
   npm run dev
   ```

2. **Open your browser** to `http://localhost:8787`

3. **Connect WebSocket** for real-time updates (auto-connects)

## Complete Testing Workflow

### 1. Setup Hierarchical Agents

**Create a multi-level inventory hierarchy:**

1. Navigate to **Fleet Management** tab
2. Create regional agent:
   - Agent Name: `usa`
   - Click "Create Agent"
3. Navigate to `/usa` (click breadcrumb or URL)
4. Create warehouse agent:
   - Agent Name: `warehouse-west`
   - Click "Create Agent"
5. Navigate to `/usa/warehouse-west`
6. Create retail location:
   - Agent Name: `store-sf`
   - Click "Create Agent"

### 2. Setup Initial Inventory

**Add inventory at the warehouse level:**

1. Navigate to `/usa/warehouse-west`
2. Switch to **Inventory Dashboard** tab
3. Add inventory items:

   **Item 1 - Laptops:**
   - SKU: `LAPTOP-001`
   - Product Name: `MacBook Pro 16`
   - Quantity: `100`
   - Operation: `Set Stock`
   - Threshold: `20`
   - Click "Update Inventory"

   **Item 2 - Phones:**
   - SKU: `PHONE-002`
   - Product Name: `iPhone 15 Pro`
   - Quantity: `50`
   - Operation: `Set Stock`
   - Threshold: `10`
   - Click "Update Inventory"

   **Item 3 - Tablets:**
   - SKU: `TABLET-003`
   - Product Name: `iPad Pro`
   - Quantity: `25`
   - Operation: `Set Stock`
   - Threshold: `5`
   - Click "Update Inventory"

**Add inventory at the retail location:**

1. Navigate to `/usa/warehouse-west/store-sf`
2. Switch to **Inventory Dashboard** tab
3. Add smaller quantities:
   - `LAPTOP-001`: 10 units (threshold: 3)
   - `PHONE-002`: 15 units (threshold: 5)
   - `TABLET-003`: 8 units (threshold: 2)

### 3. Test Inventory Operations

**Basic inventory management:**

1. **View Current Inventory**: Check the inventory list and stats cards
2. **Quick Actions**:
   - Use ➕ and ➖ buttons next to items
   - Try "Simulate Sale" button (random stock reduction)
   - Try "Simulate Restock" button (random stock increase)
3. **Manual Updates**: Update stock levels using the form
4. **Real-time Sync**: Watch WebSocket messages for updates

### 4. Test AI-Powered Features

**Switch to AI Control Center tab:**

**AI Analysis:**
1. Enter a SKU (e.g., `LAPTOP-001`) in "SKU to Analyze"
2. Click the brain icon to run analysis
3. Observe AI recommendations for reorder quantity, urgency, etc.
4. Check the real-time AI activity feed

**Demand Forecasting:**
1. Click "Run 30-Day Demand Forecast"
2. Watch the forecast results populate
3. Check WebSocket messages for AI notifications

**AI Insights:**
1. Click "Get AI Insights" to see decision history
2. Monitor confidence levels and decision patterns

### 5. Test Agentic AI Workflows

**Trigger autonomous AI behavior:**

1. **Low Stock Alerts**:
   - Click "Trigger Low Stock" to set items to very low stock
   - Watch for automatic AI analysis and reorder recommendations
   - Check AI activity feed for autonomous decisions

2. **AI Mode Controls**:
   - Click "Enable AI Auto-Reorder Mode"
   - Make inventory changes and watch AI responses
   - Try "Trigger AI Workflow" for bulk analysis

3. **Human-in-the-Loop**:
   - AI will request approval for high-value decisions
   - Watch for approval requests in WebSocket messages

### 6. Test Real-time Coordination

**Multi-agent coordination:**

1. Open multiple browser tabs for different agent levels:
   - Tab 1: `/usa/warehouse-west` (warehouse)
   - Tab 2: `/usa/warehouse-west/store-sf` (retail)
   - Tab 3: `/usa` (regional)

2. Make inventory changes in one tab
3. Watch real-time updates in other tabs
4. Observe hierarchical message propagation
5. See AI decisions propagate up the hierarchy

### 7. Advanced Testing Scenarios

**Complex workflow testing:**

1. **Supply Chain Simulation**:
   - Warehouse starts with 100 laptops
   - Retail store sells 8 units (trigger AI analysis)
   - AI recommends restock from warehouse
   - Warehouse transfers stock to retail
   - Monitor entire process in real-time

2. **Demand Spike Handling**:
   - Run demand forecast showing increased demand
   - Simulate rapid sales to trigger low stock
   - Watch AI make proactive reorder decisions
   - Test human approval workflow

3. **Multi-SKU Analysis**:
   - Add multiple inventory items
   - Run AI analysis on each
   - Generate comprehensive demand forecasts
   - Compare AI confidence across different products

## Expected UI Features

### Fleet Management Tab
- ✅ Agent creation and hierarchy navigation
- ✅ Real-time messaging between agents
- ✅ WebSocket connection status
- ✅ Agent list with navigation

### Inventory Dashboard Tab
- ✅ Real-time inventory overview cards
- ✅ Inventory management form
- ✅ Current inventory list with quick actions
- ✅ Low stock alerts panel
- ✅ Quick action buttons for demos

### AI Control Center Tab
- ✅ AI status overview with metrics
- ✅ Individual SKU analysis panel
- ✅ Demand forecasting controls
- ✅ AI decision history
- ✅ Workflow control buttons
- ✅ Real-time AI activity feed

## Real-time Features to Test

### WebSocket Messages
- Inventory updates appear in communication panel
- AI decisions show in activity feeds
- Low stock alerts trigger immediately
- Cross-agent coordination messages

### Live UI Updates
- Inventory stats update on changes
- Alert panels refresh automatically
- AI activity feed updates in real-time
- Decision history populates dynamically

## Troubleshooting

### Common Issues
1. **WebSocket not connecting**: Check browser console for errors
2. **Inventory not updating**: Verify API endpoints are responding
3. **AI analysis failing**: Check if mock AI responses are working
4. **Missing icons**: Icons should display using included SVG components

### Debug Information
- Check browser console for errors
- Monitor Network tab for API calls
- Watch WebSocket messages in browser dev tools
- Look for server-side logs in terminal

## Success Criteria

A successful test demonstrates:
1. ✅ Hierarchical agent creation and navigation
2. ✅ Real-time inventory management across multiple locations
3. ✅ AI-powered analysis and recommendations
4. ✅ Autonomous reorder workflows with human approval
5. ✅ Demand forecasting and trend analysis
6. ✅ Cross-agent real-time coordination
7. ✅ Comprehensive audit trail of all decisions

This UI effectively demonstrates the full capabilities of the agentic AI inventory management system built on your fleet architecture!
