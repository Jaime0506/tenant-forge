# Example Usage Scenario

This document provides a quickstart example to demonstrate how **Tenant Forge** handles multiple database connections.

## 1. Environment Configuration

Paste the following configuration into your project's connection editor. This example defines 3 separate PostgreSQL connections (Tenants 1, 2, and 3).

> **Note**: We assume you have a local PostgreSQL instance running. The third tenant is configured on port `5433` for demonstration purposes.

```properties
# Tenant 1 Configuration
POSTGRES_TYPE_TENANT_1="postgres"
POSTGRES_HOST_TENANT_1="localhost"
POSTGRES_DB_TENANT_1="tenant_forge_1"
POSTGRES_SCHEMA_TENANT_1="public"
POSTGRES_USER_TENANT_1="admin"
POSTGRES_PASSWORD_TENANT_1="admin123"
POSTGRES_PORT_TENANT_1=5432

# Tenant 2 Configuration
POSTGRES_TYPE_TENANT_2="postgres"
POSTGRES_HOST_TENANT_2="localhost"
POSTGRES_DB_TENANT_2="tenant_forge_2"
POSTGRES_SCHEMA_TENANT_2="public"
POSTGRES_USER_TENANT_2="admin"
POSTGRES_PASSWORD_TENANT_2="admin123"
POSTGRES_PORT_TENANT_2=5432

# Tenant 3 Configuration (Different Port)
POSTGRES_TYPE_TENANT_3="postgres"
POSTGRES_HOST_TENANT_3="localhost"
POSTGRES_DB_TENANT_3="tenant_forge_3"
POSTGRES_SCHEMA_TENANT_3="public"
POSTGRES_USER_TENANT_3="admin"
POSTGRES_PASSWORD_TENANT_3="admin123"
POSTGRES_PORT_TENANT_3=5433
```

## 2. Execute SQL

Once the connections are configured, copy and paste the following SQL into the editor to create a `users` table and insert dummy data across **all** active connections.

```sql
-- Create the users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert a dummy user to verify execution
INSERT INTO users (username, email)
VALUES ('demo_user', 'demo@example.com')
ON CONFLICT (email) DO NOTHING;

```

## 3. View Results

After clicking **Run**, you should see successful execution results for all 3 tenants (assuming the databases exist and are accessible).
