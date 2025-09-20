-- Setup script for D1 database
-- Run this with: wrangler d1 execute fleet-analytics --file=scripts/setup-d1.sql

-- Create the database schema
.read schema.sql

-- Insert some sample tenant configurations
INSERT INTO tenant_configurations (tenant_id, name, settings) VALUES
('demo', 'Demo Tenant', '{"theme": "dark", "features": ["ai_analysis", "real_time_updates"]}'),
('walmart', 'Walmart Inc', '{"theme": "blue", "features": ["ai_analysis", "real_time_updates", "advanced_analytics"]}'),
('acme', 'ACME Corp', '{"theme": "green", "features": ["ai_analysis"]}');

-- Insert some sample performance metrics
INSERT INTO performance_metrics (tenant_id, agent_path, metric_name, metric_value, metric_unit, metadata) VALUES
('demo', '/', 'inventory_items_count', 150, 'items', '{"timestamp": "2025-01-15T10:00:00Z"}'),
('demo', '/', 'low_stock_alerts', 12, 'alerts', '{"timestamp": "2025-01-15T10:00:00Z"}'),
('walmart', '/warehouse-west', 'inventory_items_count', 2500, 'items', '{"timestamp": "2025-01-15T10:00:00Z"}'),
('acme', '/store-downtown', 'inventory_items_count', 75, 'items', '{"timestamp": "2025-01-15T10:00:00Z"}');

-- Create some sample inventory transactions
INSERT INTO inventory_transactions (tenant_id, agent_path, sku, operation, quantity, previous_stock, new_stock, user_id, metadata) VALUES
('demo', '/', 'LAPTOP-001', 'set', 50, 0, 50, 'system', '{"source": "initial_setup"}'),
('demo', '/', 'MOUSE-001', 'set', 100, 0, 100, 'system', '{"source": "initial_setup"}'),
('walmart', '/warehouse-west', 'WIDGET-A', 'increment', 25, 75, 100, 'warehouse_manager', '{"source": "reorder"}'),
('acme', '/store-downtown', 'GADGET-B', 'decrement', 5, 15, 10, 'cashier_001', '{"source": "sale"}');

-- Create some sample AI analysis results
INSERT INTO inventory_analysis (tenant_id, agent_path, sku, analysis_type, insights, confidence, model_used) VALUES
('demo', '/', 'LAPTOP-001', 'reorder_recommendation', '{"shouldReorder": true, "reorderQuantity": 25, "urgency": "medium"}', 0.85, '@cf/meta/llama-3.1-8b-instruct'),
('demo', '/', 'MOUSE-001', 'demand_forecast', '{"predictedDemand": 15, "confidence": 0.78, "trend": "stable"}', 0.78, '@cf/meta/llama-3.1-8b-instruct'),
('walmart', '/warehouse-west', 'WIDGET-A', 'trend_analysis', '{"trend": "increasing", "seasonality": "high", "recommendation": "increase_safety_stock"}', 0.92, '@cf/meta/llama-3.1-8b-instruct');

-- Create some sample AI decisions
INSERT INTO inventory_decisions (tenant_id, agent_path, sku, decision_type, recommendation, human_approved, approved_by, executed, execution_timestamp) VALUES
('demo', '/', 'LAPTOP-001', 'reorder', '{"quantity": 25, "supplier": "TechSupply Co", "urgency": "medium"}', true, 'manager_001', true, '2025-01-15T10:30:00Z'),
('walmart', '/warehouse-west', 'WIDGET-A', 'price_adjustment', '{"newPrice": 12.99, "reason": "demand_increase"}', false, null, false, null),
('acme', '/store-downtown', 'GADGET-B', 'discontinue', '{"reason": "low_demand", "alternative": "GADGET-C"}', true, 'store_manager', false, null);

-- Create some sample workflow executions
INSERT INTO workflow_executions (id, tenant_id, workflow_name, agent_path, status, input_data, output_data, started_at, completed_at) VALUES
('wf_001', 'demo', 'reorder-workflow', '/', 'completed', '{"sku": "LAPTOP-001", "quantity": 25}', '{"orderId": "ORD-001", "status": "confirmed"}', '2025-01-15T10:00:00Z', '2025-01-15T10:05:00Z'),
('wf_002', 'walmart', 'demand-forecast-workflow', '/warehouse-west', 'running', '{"location": "/warehouse-west", "period": "30_days"}', null, '2025-01-15T10:15:00Z', null),
('wf_003', 'acme', 'inventory-sync-workflow', '/store-downtown', 'failed', '{"updates": [{"sku": "GADGET-B", "quantity": 10}]}', '{"error": "Connection timeout"}', '2025-01-15T09:45:00Z', '2025-01-15T09:50:00Z');

-- Create some sample user sessions
INSERT INTO user_sessions (id, tenant_id, user_id, agent_path, created_at, last_activity, expires_at) VALUES
('session_001', 'demo', 'user_001', '/', '2025-01-15T09:00:00Z', '2025-01-15T10:30:00Z', '2025-01-15T18:00:00Z'),
('session_002', 'walmart', 'warehouse_manager', '/warehouse-west', '2025-01-15T08:30:00Z', '2025-01-15T10:25:00Z', '2025-01-15T17:30:00Z'),
('session_003', 'acme', 'store_manager', '/store-downtown', '2025-01-15T09:15:00Z', '2025-01-15T10:20:00Z', '2025-01-15T18:15:00Z');

-- Verify the setup
SELECT 'Database setup completed successfully!' as status;
SELECT COUNT(*) as tenant_count FROM tenant_configurations;
SELECT COUNT(*) as transaction_count FROM inventory_transactions;
SELECT COUNT(*) as analysis_count FROM inventory_analysis;
SELECT COUNT(*) as decision_count FROM inventory_decisions;
SELECT COUNT(*) as workflow_count FROM workflow_executions;
SELECT COUNT(*) as session_count FROM user_sessions;
