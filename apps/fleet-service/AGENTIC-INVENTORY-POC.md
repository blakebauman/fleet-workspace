# Agentic AI Inventory Management POC

## Overview

This POC demonstrates an enhanced FleetManager that incorporates agentic AI workflows for intelligent inventory management. The implementation combines your existing fleet architecture with AI-powered decision-making capabilities.

## Key Features Implemented

### 🤖 AI-Powered Inventory Analysis

- **Smart Reorder Recommendations**: AI analyzes stock levels, sales velocity, and seasonal patterns
- **Autonomous Decision Making**: Agents can make reorder decisions with human-in-the-loop for high-value items
- **Demand Forecasting**: Predictive analytics for future inventory needs

### 🔄 Enhanced Fleet Coordination

- **Hierarchical Propagation**: Inventory updates and AI decisions propagate through agent hierarchy
- **Real-time Sync**: WebSocket-based real-time communication between agents
- **Audit Trail**: Complete tracking of all AI decisions and inventory transactions

### 📊 Analytics & Insights

- **Performance Metrics**: Track AI decision confidence and accuracy
- **Historical Analysis**: Store and analyze inventory patterns over time
- **Alert Management**: Intelligent prioritization of inventory alerts

## API Endpoints

### Basic Inventory Operations

```bash
# Get inventory for a location
GET /{location}/inventory/stock

# Update stock levels
POST /{location}/inventory/stock
{
  "sku": "ITEM-001",
  "quantity": 50,
  "operation": "set|increment|decrement"
}

# Query specific SKU
GET /{location}/inventory/query?sku=ITEM-001

# Get inventory alerts
GET /{location}/inventory/alerts
```

### AI-Powered Operations

```bash
# Trigger AI analysis for a specific SKU
GET /{location}/ai/analyze?sku=ITEM-001

# Run demand forecasting
POST /{location}/ai/forecast

# Get AI insights and decision history
GET /{location}/ai/insights
```

## Demo Workflow

### 1. Create Hierarchical Agents

```bash
# Root orchestrator
POST /createAgent {"name": "usa"}

# Regional warehouse
POST /usa/createAgent {"name": "warehouse-west"}

# Retail location
POST /usa/warehouse-west/createAgent {"name": "store-sf"}
```

### 2. Set Up Inventory

```bash
# Add initial stock at warehouse
POST /usa/warehouse-west/inventory/stock
{
  "sku": "LAPTOP-001",
  "quantity": 100,
  "operation": "set"
}

# Add stock at retail store
POST /usa/warehouse-west/store-sf/inventory/stock
{
  "sku": "LAPTOP-001",
  "quantity": 10,
  "operation": "set"
}
```

### 3. Trigger AI Workflows

```bash
# Simulate a sale (triggers low stock analysis)
POST /usa/warehouse-west/store-sf/inventory/stock
{
  "sku": "LAPTOP-001",
  "quantity": 8,
  "operation": "decrement"
}

# Get AI analysis
GET /usa/warehouse-west/store-sf/ai/analyze?sku=LAPTOP-001

# Run demand forecast
POST /usa/warehouse-west/store-sf/ai/forecast
```

### 4. Monitor Real-time Updates

Connect to WebSocket at `/{location}/ws` to see:

- Real-time inventory updates
- AI-generated alerts and recommendations
- Automated reorder notifications
- Cross-agent coordination messages

## Agentic Behaviors Demonstrated

### 🎯 Autonomous Decision Making

- **Low Stock Detection**: Automatically triggered when stock falls below threshold
- **AI Analysis**: Evaluates historical data, seasonality, and trends
- **Reorder Recommendations**: Calculates optimal reorder quantities and timing
- **Human Approval**: Requests approval for high-value or critical decisions

### 🔗 Hierarchical Coordination

- **Upward Propagation**: Child agents report decisions to parents
- **Downward Distribution**: Parent agents coordinate allocation decisions
- **Lateral Communication**: Peer agents can share capacity and demand info

### 📈 Continuous Learning

- **Decision Tracking**: All AI decisions stored with confidence scores
- **Pattern Recognition**: Learns from historical sales and demand patterns
- **Performance Monitoring**: Tracks accuracy of predictions and decisions

## Technical Architecture

### Agent Types

- **Global Orchestrator**: Multi-tenant coordination and analytics
- **Regional Orchestrator**: Geographic demand patterns and allocation
- **Fulfillment Center**: Warehouse operations and supply chain
- **Retail Location**: Point-of-sale and customer demand

### AI Integration

- **Cloudflare Workers AI**: For demand forecasting and decision analysis
- **Vectorize**: For product similarity and recommendation engines
- **Durable Object SQL**: For persistent analytics and audit trails
- **Workflows**: For long-running autonomous processes

## POC Limitations & Future Enhancements

### Current POC Limitations

- Mock AI responses (easily replaceable with real Workers AI)
- Simplified SQL storage (ready for DO SQL when available)
- Basic scheduling (ready for Cloudflare Workflows integration)

### Production Enhancements

- **Multi-tenant Isolation**: Complete tenant separation and security
- **Advanced Analytics**: ML models for demand prediction and anomaly detection
- **External Integrations**: ERP, WMS, POS, and supplier system connectors
- **Human Interfaces**: Approval workflows and dashboard integrations

## Getting Started

1. **Start the service**:

   ```bash
   cd apps/fleet-service
   npm run dev
   ```

2. **Open WebSocket connection**:

   ```javascript
   const ws = new WebSocket('ws://localhost:8787/ws')
   ws.onmessage = (event) => console.log(JSON.parse(event.data))
   ```

3. **Run the demo workflow** using the API endpoints above

4. **Monitor the console** for AI decision logs and agent coordination

## Next Steps

This POC provides a solid foundation for building a full-scale agentic inventory management system. The architecture is ready to scale from small businesses to global enterprises by leveraging Cloudflare's edge computing platform.

Key next steps:

1. Integrate real Cloudflare Workers AI models
2. Add Cloudflare Workflows for complex business processes
3. Implement multi-tenant security and isolation
4. Build external system integrations (ERP, WMS, etc.)
5. Add comprehensive analytics and reporting dashboards
