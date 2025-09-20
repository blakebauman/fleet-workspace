# Database Setup Guide

This guide explains how to set up the D1 database for the Fleet Service with real Cloudflare services.

## Prerequisites

1. **Wrangler CLI** installed and configured
2. **Cloudflare account** with D1 database access
3. **Project configured** with proper bindings

## Step 1: Create D1 Database

```bash
# Create the D1 database
wrangler d1 create fleet-analytics

# Note the database ID from the output - you'll need it for wrangler.jsonc
```

## Step 2: Update wrangler.jsonc

Update the `d1_databases` section in `wrangler.jsonc` with your actual database ID:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "fleet-analytics",
      "database_id": "your-actual-database-id-here"
    }
  ]
}
```

## Step 3: Run Database Schema

```bash
# Apply the schema
wrangler d1 execute fleet-analytics --file=schema.sql

# Set up sample data
wrangler d1 execute fleet-analytics --file=scripts/setup-d1.sql
```

## Step 4: Verify Setup

```bash
# Check tables were created
wrangler d1 execute fleet-analytics --command="SELECT name FROM sqlite_master WHERE type='table';"

# Check sample data
wrangler d1 execute fleet-analytics --command="SELECT COUNT(*) as tenant_count FROM tenant_configurations;"
```

## Database Schema Overview

### Core Tables

- **`inventory_transactions`** - Audit trail for all inventory changes
- **`inventory_analysis`** - AI analysis results and insights
- **`inventory_decisions`** - AI decision history and approvals
- **`tenant_configurations`** - Multi-tenant settings and configurations
- **`user_sessions`** - User authentication and session management
- **`workflow_executions`** - Workflow execution history and status
- **`performance_metrics`** - System performance and monitoring data

### Key Features

- **Multi-tenant isolation** - All data is tenant-scoped
- **Audit trails** - Complete transaction history
- **AI integration** - Stores analysis results and decisions
- **Performance monitoring** - Metrics and analytics
- **Workflow tracking** - Execution history and status

## Production Considerations

### Indexes
The schema includes optimized indexes for:
- Tenant-based queries
- Time-based analytics
- SKU lookups
- Performance metrics

### Data Retention
Consider implementing data retention policies:
- **Transactions**: Keep for 2+ years
- **Sessions**: Keep for 90 days
- **Metrics**: Keep for 1 year
- **Analysis**: Keep for 6 months

### Backup Strategy
- **Daily backups** of critical tables
- **Point-in-time recovery** for transactions
- **Cross-region replication** for disaster recovery

## Monitoring

### Key Metrics to Track
- Transaction volume per tenant
- AI analysis accuracy
- Workflow success rates
- Database performance

### Alerts to Set Up
- High transaction volume
- Failed AI analyses
- Workflow execution failures
- Database connection issues

## Troubleshooting

### Common Issues

1. **Database not found**
   - Check database ID in wrangler.jsonc
   - Verify database exists in Cloudflare dashboard

2. **Permission denied**
   - Check Wrangler authentication
   - Verify account permissions

3. **Schema errors**
   - Check SQL syntax
   - Verify table dependencies

### Debug Commands

```bash
# Check database status
wrangler d1 list

# View database info
wrangler d1 info fleet-analytics

# Execute custom queries
wrangler d1 execute fleet-analytics --command="SELECT * FROM tenant_configurations LIMIT 5;"
```

## Next Steps

After database setup:
1. **Test the API** - Verify inventory operations work
2. **Check audit logs** - Ensure transactions are being recorded
3. **Monitor performance** - Watch for any issues
4. **Set up alerts** - Configure monitoring and alerting

## Support

For issues with database setup:
1. Check Cloudflare D1 documentation
2. Review Wrangler CLI logs
3. Check Cloudflare dashboard for errors
4. Contact support if needed
