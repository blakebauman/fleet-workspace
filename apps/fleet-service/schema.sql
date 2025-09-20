-- Fleet Service D1 Database Schema
-- This file contains the schema for the global D1 database used for analytics and audit trails

-- Inventory transactions audit trail
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  agent_path TEXT NOT NULL,
  sku TEXT NOT NULL,
  operation TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  previous_stock INTEGER,
  new_stock INTEGER,
  user_id TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT -- JSON for additional context
);

-- AI analysis results and insights
CREATE TABLE IF NOT EXISTS inventory_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  agent_path TEXT NOT NULL,
  sku TEXT NOT NULL,
  analysis_type TEXT NOT NULL, -- 'demand_forecast', 'reorder_recommendation', 'trend_analysis'
  insights TEXT NOT NULL, -- JSON containing analysis results
  confidence REAL NOT NULL,
  model_used TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI decision history and approvals
CREATE TABLE IF NOT EXISTS inventory_decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  agent_path TEXT NOT NULL,
  sku TEXT NOT NULL,
  decision_type TEXT NOT NULL, -- 'reorder', 'price_adjustment', 'discontinue'
  recommendation TEXT NOT NULL, -- JSON containing recommendation details
  human_approved BOOLEAN,
  approved_by TEXT,
  executed BOOLEAN DEFAULT FALSE,
  execution_timestamp DATETIME,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tenant configurations and settings
CREATE TABLE IF NOT EXISTS tenant_configurations (
  tenant_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  settings TEXT NOT NULL, -- JSON containing tenant-specific settings
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User sessions and authentication
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  agent_path TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL
);

-- Workflow execution history
CREATE TABLE IF NOT EXISTS workflow_executions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workflow_name TEXT NOT NULL,
  agent_path TEXT,
  status TEXT NOT NULL, -- 'pending', 'running', 'completed', 'failed'
  input_data TEXT, -- JSON
  output_data TEXT, -- JSON
  error_message TEXT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

-- Performance metrics and monitoring
CREATE TABLE IF NOT EXISTS performance_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  agent_path TEXT,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  metric_unit TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT -- JSON for additional context
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_tenant_timestamp
  ON inventory_transactions(tenant_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_sku
  ON inventory_transactions(sku);

CREATE INDEX IF NOT EXISTS idx_inventory_analysis_tenant_sku
  ON inventory_analysis(tenant_id, sku, timestamp);

CREATE INDEX IF NOT EXISTS idx_inventory_decisions_tenant_status
  ON inventory_decisions(tenant_id, executed, timestamp);

CREATE INDEX IF NOT EXISTS idx_user_sessions_tenant_user
  ON user_sessions(tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_tenant_status
  ON workflow_executions(tenant_id, status, started_at);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_tenant_timestamp
  ON performance_metrics(tenant_id, timestamp);
