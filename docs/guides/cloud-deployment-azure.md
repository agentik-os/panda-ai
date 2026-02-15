# Azure Deployment Guide

> **Deploy Agentik OS on Microsoft Azure with Container Apps, Cosmos DB, and managed services**

Complete guide for deploying Agentik OS on Azure using Container Apps for serverless containers, Cosmos DB for databases, and Azure Cache for Redis.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Resource Group Setup](#resource-group-setup)
4. [Container Deployment with Container Apps](#container-deployment-with-container-apps)
5. [Database with Cosmos DB](#database-with-cosmos-db)
6. [Caching with Azure Cache for Redis](#caching-with-azure-cache-for-redis)
7. [Load Balancing & CDN](#load-balancing--cdn)
8. [Secret Management with Key Vault](#secret-management-with-key-vault)
9. [Monitoring & Logging](#monitoring--logging)
10. [Auto-Scaling Configuration](#auto-scaling-configuration)
11. [CI/CD with Azure DevOps](#cicd-with-azure-devops)
12. [Cost Optimization](#cost-optimization)
13. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Production Architecture

```
                    ┌─────────────────────┐
                    │  Azure Front Door   │
                    │  (Global CDN + WAF) │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Application Gateway│
                    │  (Load Balancer)    │
                    └──────────┬──────────┘
                               │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
  ┌──────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐
  │ Container   │     │ Container   │     │ Container   │
  │ App 1       │     │ App 2       │     │ App 3       │
  │ (Runtime)   │     │ (Runtime)   │     │ (Runtime)   │
  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                 ┌────────────┴────────────┐
                 │                         │
       ┌─────────▼─────────┐    ┌─────────▼─────────┐
       │  Azure Cache       │    │  Convex Cloud     │
       │  (Redis)           │    │  (Database)       │
       └────────────────────┘    └───────────────────┘
```

### Azure Services Used

| Service | Purpose | Pricing Model |
|---------|---------|---------------|
| **Container Apps** | Serverless containers | $0.000016/vCPU-second + $0.000002/GB-second |
| **Application Gateway** | Layer 7 load balancer | $0.36/hour + data processed |
| **Azure Front Door** | Global CDN + WAF | $35/month + data transfer |
| **Azure Cache for Redis** | Managed Redis | $0.12/hour (C1 Basic) |
| **Key Vault** | Secrets management | $0.03/10k operations |
| **Container Registry** | Docker image storage | $0.167/day (Basic tier) |
| **Log Analytics** | Centralized logging | $2.76/GB ingested |
| **Application Insights** | APM + monitoring | $2.88/GB ingested |
| **Azure DevOps** | CI/CD pipelines | Free tier: 1800 min/month |

---

## Prerequisites

### 1. Azure Account Setup

```bash
# Install Azure CLI
brew install azure-cli  # macOS
# or: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash  # Linux

# Login
az login

# Set subscription
az account set --subscription "YOUR_SUBSCRIPTION_ID"

# Verify
az account show
```

### 2. Install Required Tools

```bash
# Install Docker
brew install docker  # macOS

# Install Bicep (Infrastructure as Code)
brew tap azure/bicep
brew install bicep

# Install Terraform (alternative)
brew install terraform  # macOS
```

### 3. Enable Resource Providers

```bash
# Register required providers
az provider register --namespace Microsoft.App
az provider register --namespace Microsoft.OperationalInsights
az provider register --namespace Microsoft.ContainerRegistry
az provider register --namespace Microsoft.KeyVault
az provider register --namespace Microsoft.Cache
az provider register --namespace Microsoft.Cdn

# Verify registration
az provider show --namespace Microsoft.App --query "registrationState"
```

---

## Resource Group Setup

### 1. Create Resource Group

```bash
# Set variables
export RESOURCE_GROUP=agentik-production
export LOCATION=eastus
export ACR_NAME=agentikregistry
export CONTAINER_APP_ENV=agentik-env

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION
```

### 2. Create Container Registry

```bash
# Create Azure Container Registry
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true

# Login to ACR
az acr login --name $ACR_NAME

# Get credentials
ACR_USERNAME=$(az acr credential show \
  --name $ACR_NAME \
  --query "username" \
  --output tsv)

ACR_PASSWORD=$(az acr credential show \
  --name $ACR_NAME \
  --query "passwords[0].value" \
  --output tsv)
```

---

## Container Deployment with Container Apps

### 1. Build and Push Docker Image

**Dockerfile (same as other clouds):**

```dockerfile
FROM oven/bun:1.2-alpine AS builder
WORKDIR /app
COPY package.json bun.lockb ./
COPY packages/runtime/package.json ./packages/runtime/
RUN bun install --frozen-lockfile
COPY packages/runtime ./packages/runtime
RUN cd packages/runtime && bun run build

FROM oven/bun:1.2-alpine
WORKDIR /app
COPY --from=builder /app/packages/runtime/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

ENV PORT=8080
EXPOSE 8080

USER bun
CMD ["bun", "run", "dist/index.js"]
```

**Build and push:**

```bash
# Build image
docker build -t $ACR_NAME.azurecr.io/agentik-runtime:latest \
  --platform linux/amd64 \
  -f packages/runtime/Dockerfile .

# Tag with commit hash
GIT_HASH=$(git rev-parse --short HEAD)
docker tag $ACR_NAME.azurecr.io/agentik-runtime:latest \
  $ACR_NAME.azurecr.io/agentik-runtime:$GIT_HASH

# Push to ACR
docker push $ACR_NAME.azurecr.io/agentik-runtime:latest
docker push $ACR_NAME.azurecr.io/agentik-runtime:$GIT_HASH
```

### 2. Create Container Apps Environment

```bash
# Create Log Analytics workspace (required for Container Apps)
az monitor log-analytics workspace create \
  --resource-group $RESOURCE_GROUP \
  --workspace-name agentik-logs

# Get workspace ID and key
WORKSPACE_ID=$(az monitor log-analytics workspace show \
  --resource-group $RESOURCE_GROUP \
  --workspace-name agentik-logs \
  --query customerId \
  --output tsv)

WORKSPACE_KEY=$(az monitor log-analytics workspace get-shared-keys \
  --resource-group $RESOURCE_GROUP \
  --workspace-name agentik-logs \
  --query primarySharedKey \
  --output tsv)

# Create Container Apps environment
az containerapp env create \
  --name $CONTAINER_APP_ENV \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --logs-workspace-id $WORKSPACE_ID \
  --logs-workspace-key $WORKSPACE_KEY
```

### 3. Deploy Container App

```bash
# Create container app
az containerapp create \
  --name agentik-runtime \
  --resource-group $RESOURCE_GROUP \
  --environment $CONTAINER_APP_ENV \
  --image $ACR_NAME.azurecr.io/agentik-runtime:latest \
  --registry-server $ACR_NAME.azurecr.io \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --target-port 8080 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 30 \
  --cpu 1.0 \
  --memory 2.0Gi \
  --env-vars \
    NODE_ENV=production \
    CONVEX_URL=https://your-deployment.convex.cloud

# Get app URL
FQDN=$(az containerapp show \
  --name agentik-runtime \
  --resource-group $RESOURCE_GROUP \
  --query properties.configuration.ingress.fqdn \
  --output tsv)

echo "App URL: https://$FQDN"
```

### 4. Add Secrets from Key Vault

```bash
# Link secrets from Key Vault (created later)
az containerapp secret set \
  --name agentik-runtime \
  --resource-group $RESOURCE_GROUP \
  --secrets \
    anthropic-key=keyvaultref:https://agentik-vault.vault.azure.net/secrets/anthropic-key,identityref:/subscriptions/SUB_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.ManagedIdentity/userAssignedIdentities/agentik-identity

# Update environment variables to use secrets
az containerapp update \
  --name agentik-runtime \
  --resource-group $RESOURCE_GROUP \
  --set-env-vars \
    ANTHROPIC_API_KEY=secretref:anthropic-key
```

### 5. Enable Custom Domain

```bash
# Add custom domain
az containerapp hostname add \
  --name agentik-runtime \
  --resource-group $RESOURCE_GROUP \
  --hostname api.agentik-os.com

# Bind certificate
az containerapp hostname bind \
  --name agentik-runtime \
  --resource-group $RESOURCE_GROUP \
  --hostname api.agentik-os.com \
  --environment $CONTAINER_APP_ENV \
  --validation-method HTTP
```

---

## Database with Cosmos DB

### Option 1: Convex Cloud (Recommended)

```bash
# Set as environment variable (already done above)
CONVEX_URL=https://your-deployment.convex.cloud
```

### Option 2: Cosmos DB (PostgreSQL)

```bash
# Create Cosmos DB account (PostgreSQL API)
az cosmosdb create \
  --name agentik-cosmos \
  --resource-group $RESOURCE_GROUP \
  --kind GlobalDocumentDB \
  --locations regionName=$LOCATION failoverPriority=0 \
  --default-consistency-level Session \
  --enable-automatic-failover true \
  --enable-multiple-write-locations false

# Create database
az cosmosdb sql database create \
  --account-name agentik-cosmos \
  --resource-group $RESOURCE_GROUP \
  --name agentik

# Create container
az cosmosdb sql container create \
  --account-name agentik-cosmos \
  --resource-group $RESOURCE_GROUP \
  --database-name agentik \
  --name sessions \
  --partition-key-path "/userId" \
  --throughput 400

# Get connection string
CONNECTION_STRING=$(az cosmosdb keys list \
  --name agentik-cosmos \
  --resource-group $RESOURCE_GROUP \
  --type connection-strings \
  --query "connectionStrings[0].connectionString" \
  --output tsv)
```

**Connection in code:**

```typescript
import { CosmosClient } from '@azure/cosmos';

const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!);
const database = client.database('agentik');
const container = database.container('sessions');

// Query
const { resources } = await container.items
  .query({
    query: 'SELECT * FROM c WHERE c.userId = @userId',
    parameters: [{ name: '@userId', value: userId }],
  })
  .fetchAll();
```

---

## Caching with Azure Cache for Redis

### 1. Create Redis Instance

```bash
# Create Azure Cache for Redis
az redis create \
  --name agentik-redis \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Basic \
  --vm-size c1 \
  --enable-non-ssl-port false

# Get connection info
REDIS_HOST=$(az redis show \
  --name agentik-redis \
  --resource-group $RESOURCE_GROUP \
  --query hostName \
  --output tsv)

REDIS_KEY=$(az redis list-keys \
  --name agentik-redis \
  --resource-group $RESOURCE_GROUP \
  --query primaryKey \
  --output tsv)
```

### 2. Connect from Container App

```bash
# Update container app with Redis connection
az containerapp update \
  --name agentik-runtime \
  --resource-group $RESOURCE_GROUP \
  --set-env-vars \
    REDIS_HOST=$REDIS_HOST \
    REDIS_PORT=6380 \
    REDIS_PASSWORD=$REDIS_KEY \
    REDIS_TLS=true
```

**Connection in code:**

```typescript
import { createClient } from 'redis';

const redis = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6380'),
    tls: true,
  },
  password: process.env.REDIS_PASSWORD,
});

await redis.connect();

// Usage
await redis.set('session:123', JSON.stringify(data), { EX: 3600 });
const cached = await redis.get('session:123');
```

---

## Load Balancing & CDN

### 1. Application Gateway (Layer 7 LB)

```bash
# Create public IP
az network public-ip create \
  --resource-group $RESOURCE_GROUP \
  --name agentik-gateway-ip \
  --allocation-method Static \
  --sku Standard

# Create virtual network
az network vnet create \
  --name agentik-vnet \
  --resource-group $RESOURCE_GROUP \
  --address-prefix 10.0.0.0/16 \
  --subnet-name gateway-subnet \
  --subnet-prefix 10.0.1.0/24

# Create Application Gateway
az network application-gateway create \
  --name agentik-gateway \
  --resource-group $RESOURCE_GROUP \
  --vnet-name agentik-vnet \
  --subnet gateway-subnet \
  --public-ip-address agentik-gateway-ip \
  --sku Standard_v2 \
  --capacity 2 \
  --http-settings-cookie-based-affinity Disabled \
  --frontend-port 443 \
  --http-settings-port 443 \
  --http-settings-protocol Https

# Add backend pool with Container App
az network application-gateway address-pool update \
  --gateway-name agentik-gateway \
  --resource-group $RESOURCE_GROUP \
  --name appGatewayBackendPool \
  --servers $FQDN
```

### 2. Azure Front Door (Global CDN)

```bash
# Create Front Door profile
az afd profile create \
  --profile-name agentik-frontdoor \
  --resource-group $RESOURCE_GROUP \
  --sku Standard_AzureFrontDoor

# Create endpoint
az afd endpoint create \
  --profile-name agentik-frontdoor \
  --resource-group $RESOURCE_GROUP \
  --endpoint-name agentik-api \
  --enabled-state Enabled

# Create origin group
az afd origin-group create \
  --profile-name agentik-frontdoor \
  --resource-group $RESOURCE_GROUP \
  --origin-group-name agentik-origins \
  --probe-request-type GET \
  --probe-protocol Https \
  --probe-interval-in-seconds 30 \
  --probe-path /health

# Add origin (Container App)
az afd origin create \
  --profile-name agentik-frontdoor \
  --resource-group $RESOURCE_GROUP \
  --origin-group-name agentik-origins \
  --origin-name containerapp \
  --host-name $FQDN \
  --origin-host-header $FQDN \
  --priority 1 \
  --weight 1000 \
  --enabled-state Enabled \
  --http-port 80 \
  --https-port 443

# Create route
az afd route create \
  --profile-name agentik-frontdoor \
  --resource-group $RESOURCE_GROUP \
  --endpoint-name agentik-api \
  --route-name default-route \
  --origin-group agentik-origins \
  --supported-protocols Https \
  --https-redirect Enabled \
  --forwarding-protocol HttpsOnly
```

---

## Secret Management with Key Vault

### 1. Create Key Vault

```bash
# Create Key Vault
az keyvault create \
  --name agentik-vault \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --enable-rbac-authorization false

# Store secrets
az keyvault secret set \
  --vault-name agentik-vault \
  --name anthropic-key \
  --value "sk-ant-..."

az keyvault secret set \
  --vault-name agentik-vault \
  --name openai-key \
  --value "sk-..."
```

### 2. Grant Access to Container App

```bash
# Create managed identity
az identity create \
  --name agentik-identity \
  --resource-group $RESOURCE_GROUP

# Get identity details
IDENTITY_ID=$(az identity show \
  --name agentik-identity \
  --resource-group $RESOURCE_GROUP \
  --query id \
  --output tsv)

PRINCIPAL_ID=$(az identity show \
  --name agentik-identity \
  --resource-group $RESOURCE_GROUP \
  --query principalId \
  --output tsv)

# Assign identity to container app
az containerapp identity assign \
  --name agentik-runtime \
  --resource-group $RESOURCE_GROUP \
  --user-assigned $IDENTITY_ID

# Grant Key Vault access
az keyvault set-policy \
  --name agentik-vault \
  --object-id $PRINCIPAL_ID \
  --secret-permissions get list
```

### 3. Access Secrets in Code

```typescript
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

const credential = new DefaultAzureCredential();
const client = new SecretClient(
  'https://agentik-vault.vault.azure.net',
  credential
);

async function getSecret(name: string): Promise<string> {
  const secret = await client.getSecret(name);
  return secret.value || '';
}

// Usage
const anthropicKey = await getSecret('anthropic-key');
const openaiKey = await getSecret('openai-key');
```

---

## Monitoring & Logging

### 1. Application Insights

```bash
# Create Application Insights
az monitor app-insights component create \
  --app agentik-insights \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --application-type web

# Get instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app agentik-insights \
  --resource-group $RESOURCE_GROUP \
  --query instrumentationKey \
  --output tsv)

# Add to container app
az containerapp update \
  --name agentik-runtime \
  --resource-group $RESOURCE_GROUP \
  --set-env-vars \
    APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=$INSTRUMENTATION_KEY"
```

**Instrumentation in code:**

```typescript
import * as appInsights from 'applicationinsights';

appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
  .setAutoDependencyCorrelation(true)
  .setAutoCollectRequests(true)
  .setAutoCollectPerformance(true, true)
  .setAutoCollectExceptions(true)
  .setAutoCollectDependencies(true)
  .setAutoCollectConsole(true)
  .setUseDiskRetryCaching(true)
  .start();

const client = appInsights.defaultClient;

// Track custom events
client.trackEvent({ name: 'AgentCreated', properties: { model: 'opus' } });

// Track metrics
client.trackMetric({ name: 'TokensUsed', value: 1847 });

// Track dependencies
client.trackDependency({
  target: 'convex.cloud',
  name: 'query',
  data: 'api.sessions.get',
  duration: 234,
  resultCode: 200,
  success: true,
});
```

### 2. Log Analytics Queries

```bash
# Query container app logs
az monitor log-analytics query \
  --workspace $WORKSPACE_ID \
  --analytics-query "
    ContainerAppConsoleLogs_CL
    | where ContainerAppName_s == 'agentik-runtime'
    | where TimeGenerated > ago(1h)
    | project TimeGenerated, Log_s
    | order by TimeGenerated desc
    | take 100
  "
```

**Common queries:**

```kusto
// Error rate
ContainerAppConsoleLogs_CL
| where Log_s contains "ERROR"
| summarize ErrorCount = count() by bin(TimeGenerated, 5m)

// Response times
requests
| where name == "POST /api/agents/messages"
| summarize avg(duration), percentile(duration, 95) by bin(timestamp, 5m)

// Failed requests
requests
| where success == false
| project timestamp, name, resultCode, duration
| order by timestamp desc
```

---

## Auto-Scaling Configuration

### 1. HTTP-Based Scaling

```bash
# Update scaling rules
az containerapp update \
  --name agentik-runtime \
  --resource-group $RESOURCE_GROUP \
  --min-replicas 1 \
  --max-replicas 30 \
  --scale-rule-name http-scaling \
  --scale-rule-type http \
  --scale-rule-http-concurrency 100
```

### 2. CPU/Memory-Based Scaling

```bash
az containerapp update \
  --name agentik-runtime \
  --resource-group $RESOURCE_GROUP \
  --scale-rule-name cpu-scaling \
  --scale-rule-type cpu \
  --scale-rule-metadata type=Utilization value=70

az containerapp update \
  --name agentik-runtime \
  --resource-group $RESOURCE_GROUP \
  --scale-rule-name memory-scaling \
  --scale-rule-type memory \
  --scale-rule-metadata type=Utilization value=80
```

### 3. Custom Metrics Scaling

```yaml
# container-app-scale.yaml
properties:
  configuration:
    scale:
      minReplicas: 1
      maxReplicas: 30
      rules:
        - name: active-agents
          custom:
            type: azure-application-insights
            metadata:
              metricName: "customMetrics/activeAgents"
              targetValue: "100"
              activationThreshold: "50"
            auth:
              - secretRef: insights-connection
                triggerParameter: connection
```

---

## CI/CD with Azure DevOps

### 1. Create azure-pipelines.yml

```yaml
# azure-pipelines.yml
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  - group: agentik-secrets
  - name: acrName
    value: 'agentikregistry'
  - name: imageName
    value: 'agentik-runtime'
  - name: resourceGroup
    value: 'agentik-production'

stages:
  - stage: Build
    jobs:
      - job: BuildAndTest
        steps:
          # Install Bun
          - script: |
              curl -fsSL https://bun.sh/install | bash
              export PATH="$HOME/.bun/bin:$PATH"
            displayName: 'Install Bun'

          # Install dependencies
          - script: |
              bun install --frozen-lockfile
            displayName: 'Install dependencies'

          # Run tests
          - script: |
              bun test
            displayName: 'Run tests'
            env:
              NODE_ENV: test

          # Type check
          - script: |
              bun run type-check
            displayName: 'Type check'

          # Build Docker image
          - task: Docker@2
            displayName: 'Build image'
            inputs:
              containerRegistry: 'AzureContainerRegistry'
              repository: $(imageName)
              command: 'build'
              Dockerfile: 'packages/runtime/Dockerfile'
              tags: |
                $(Build.BuildId)
                latest

          # Push to ACR
          - task: Docker@2
            displayName: 'Push image'
            inputs:
              containerRegistry: 'AzureContainerRegistry'
              repository: $(imageName)
              command: 'push'
              tags: |
                $(Build.BuildId)
                latest

  - stage: Deploy
    dependsOn: Build
    jobs:
      - deployment: DeployToProduction
        environment: 'production'
        strategy:
          runOnce:
            deploy:
              steps:
                # Deploy to Container Apps
                - task: AzureCLI@2
                  displayName: 'Deploy to Container Apps'
                  inputs:
                    azureSubscription: 'Azure Service Connection'
                    scriptType: 'bash'
                    scriptLocation: 'inlineScript'
                    inlineScript: |
                      az containerapp update \
                        --name agentik-runtime \
                        --resource-group $(resourceGroup) \
                        --image $(acrName).azurecr.io/$(imageName):$(Build.BuildId)
```

### 2. Set Up Pipeline

```bash
# Create service connection in Azure DevOps
# Project Settings → Service connections → New service connection → Azure Resource Manager

# Create pipeline
az pipelines create \
  --name agentik-ci-cd \
  --repository agentik-os \
  --repository-type github \
  --branch main \
  --yaml-path azure-pipelines.yml
```

---

## Cost Optimization

### 1. Container Apps Pricing Tiers

**Consumption Plan (Pay-as-you-go):**

| Resource | Price |
|----------|-------|
| vCPU-second | $0.000016 |
| GB-second | $0.000002 |
| Requests (first 2M/month) | Free |
| Requests (additional) | $0.40/million |

**Example costs:**

| Traffic | vCPU | Memory | Replicas | Monthly Cost |
|---------|------|--------|----------|--------------|
| Low | 0.5 | 1GB | 0-5 | $10-30 |
| Medium | 1.0 | 2GB | 1-15 | $60-120 |
| High | 1.0 | 2GB | 1-30 | $120-250 |

### 2. Optimize Resource Usage

```bash
# Right-size containers
az containerapp update \
  --name agentik-runtime \
  --resource-group $RESOURCE_GROUP \
  --cpu 0.5 \
  --memory 1.0Gi  # Start small, scale as needed
```

### 3. Use Reserved Capacity

```bash
# Purchase 1-year reserved capacity for predictable workloads
az reservations reservation-order calculate \
  --applied-scope-type Shared \
  --billing-scope /subscriptions/SUB_ID \
  --sku Standard_D2s_v3 \
  --quantity 2 \
  --term P1Y
```

---

## Troubleshooting

### Common Issues

#### 1. Container App Won't Start

**Symptoms:**
- App shows "Provisioning" status indefinitely
- No logs appear

**Solutions:**

```bash
# Check provisioning state
az containerapp show \
  --name agentik-runtime \
  --resource-group $RESOURCE_GROUP \
  --query properties.provisioningState

# View system logs
az containerapp logs show \
  --name agentik-runtime \
  --resource-group $RESOURCE_GROUP \
  --type system

# Check replica status
az containerapp replica list \
  --name agentik-runtime \
  --resource-group $RESOURCE_GROUP
```

#### 2. Cannot Pull Image from ACR

**Solutions:**

```bash
# Verify ACR credentials
az acr credential show --name $ACR_NAME

# Test login
az acr login --name $ACR_NAME

# Update container app credentials
az containerapp registry set \
  --name agentik-runtime \
  --resource-group $RESOURCE_GROUP \
  --server $ACR_NAME.azurecr.io \
  --username $ACR_USERNAME \
  --password $ACR_PASSWORD
```

#### 3. Key Vault Access Denied

**Solutions:**

```bash
# Verify managed identity
az containerapp identity show \
  --name agentik-runtime \
  --resource-group $RESOURCE_GROUP

# Re-grant Key Vault access
az keyvault set-policy \
  --name agentik-vault \
  --object-id $PRINCIPAL_ID \
  --secret-permissions get list
```

---

## Next Steps

- [AWS Deployment](./cloud-deployment-aws.md) - Deploy on AWS
- [GCP Deployment](./cloud-deployment-gcp.md) - Deploy on GCP
- [Multi-Cloud Strategy](./multi-cloud-deployment.md) - Deploy across clouds
- [Disaster Recovery](./disaster-recovery.md) - Backup strategies

---

**Questions?** Join our [Discord](https://discord.gg/agentik-os) or open an issue on [GitHub](https://github.com/agentik-os/agentik-os).

---

*Last updated: February 14, 2026 • Azure Deployment Guide v1.0*
