# ☸️ Airflow on Kubernetes — The Cloud-Native Orchestrator

> **"Kubernetes doesn't just run Airflow — it transforms how Airflow scales, isolates, and recovers. But it also introduces a new class of problems you've never seen before."**

---

## Table of Contents

- [Intuition — Why Kubernetes for Airflow](#intuition--why-kubernetes-for-airflow)
- [Real-World Analogy](#real-world-analogy)
- [Deployment Options](#deployment-options)
- [Architecture on Kubernetes](#architecture-on-kubernetes)
- [KubernetesExecutor Deep Dive](#kubernetesexecutor-deep-dive)
- [Pod Templates](#pod-templates)
- [Resource Requests and Limits](#resource-requests-and-limits)
- [Node Affinity and Tolerations](#node-affinity-and-tolerations)
- [KubernetesPodOperator](#kubernetespodoperator)
- [Git-Sync for DAGs](#git-sync-for-dags)
- [Persistent Volumes](#persistent-volumes)
- [Autoscaling](#autoscaling)
- [Monitoring on Kubernetes](#monitoring-on-kubernetes)
- [Log Management](#log-management)
- [Secrets Management on K8s](#secrets-management-on-k8s)
- [RBAC and Network Policies](#rbac-and-network-policies)
- [Multi-Tenancy](#multi-tenancy)
- [Production Helm Values Walkthrough](#production-helm-values-walkthrough)
- [Troubleshooting K8s-Specific Issues](#troubleshooting-k8s-specific-issues)
- [Performance Considerations](#performance-considerations)
- [Common Mistakes](#common-mistakes)
- [Real-World Production Scenarios](#real-world-production-scenarios)
- [Interview Questions](#interview-questions)

---

## Intuition — Why Kubernetes for Airflow

### The Problems with Traditional Deployments

| Problem | Traditional (VMs/Bare Metal) | Kubernetes |
|---------|-----|------------|
| **Scaling workers** | Manually provision VMs, install Airflow | Auto-scale pods in seconds |
| **Resource isolation** | All tasks share worker resources | Each task gets its own pod |
| **Dependency conflicts** | Python package conflicts between tasks | Each pod has its own container image |
| **Failure recovery** | Manual restart of crashed workers | Kubernetes auto-restarts pods |
| **Resource efficiency** | Workers sit idle between tasks | Pods created on demand, destroyed after |
| **Multi-tenancy** | Difficult to isolate teams | Namespaces, RBAC, resource quotas |

### When to Use Kubernetes for Airflow

```mermaid
graph TD
    Q1{"How many DAGs?"}
    Q1 -->|"< 50"| A1["VM-based is fine<br/>CeleryExecutor"]
    Q1 -->|"50-500"| Q2{"Need dependency isolation?"}
    Q1 -->|"500+"| A3["Kubernetes strongly recommended"]

    Q2 -->|No| A1
    Q2 -->|Yes| Q3{"Team size?"}

    Q3 -->|"1-3 engineers"| A2["KubernetesPodOperator<br/>+ CeleryExecutor"]
    Q3 -->|"3+ teams"| A3

    style A1 fill:#f39c12,color:#fff
    style A2 fill:#3498db,color:#fff
    style A3 fill:#27ae60,color:#fff
```

---

## Real-World Analogy

Think of traditional Airflow like a **restaurant with a fixed kitchen staff**:
- You hire 10 cooks (workers) who are always there, even during slow hours
- All cooks share the same kitchen (dependencies, resources)
- If 3 cooks call in sick, you're understaffed until you hire more
- Every cook must use the same set of knives and pans (Python environment)

Now imagine Airflow on Kubernetes as a **ghost kitchen platform**:
- When an order comes in, a kitchen station is **created on demand**
- Each station has **its own equipment** (container image with specific dependencies)
- Stations are **destroyed after the order is complete** (pod lifecycle)
- The platform can run **100 stations or 2**, scaling instantly
- If a station catches fire (OOM), it's **automatically rebuilt**
- Different restaurants can share the same building with **private kitchens** (namespaces)

---

## Deployment Options

### Option 1: Official Apache Airflow Helm Chart

The recommended way to deploy Airflow on Kubernetes.

```bash
# Add the official Helm repository
helm repo add apache-airflow https://airflow.apache.org
helm repo update

# Install Airflow
helm install airflow apache-airflow/airflow \
  --namespace airflow \
  --create-namespace \
  --values production-values.yaml
```

### Option 2: Community Helm Charts

```bash
# Bitnami chart (simpler, more opinionated)
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install airflow bitnami/airflow
```

### Option 3: Custom Deployment with Manifests

For maximum control (not recommended unless you have deep K8s expertise).

### Comparison

| Feature | Official Helm | Bitnami | Custom Manifests |
|---------|--------------|---------|-----------------|
| **Maintenance** | Apache community | Bitnami team | You |
| **Customization** | High | Medium | Unlimited |
| **Documentation** | Excellent | Good | None |
| **Executor support** | All executors | Celery/K8s | What you build |
| **Git-sync** | Built-in | Built-in | Manual |
| **Recommended for** | Production | Quick start | Edge cases |

---

## Architecture on Kubernetes

### Full Architecture Diagram

```mermaid
graph TD
    subgraph "Kubernetes Cluster"
        subgraph "Airflow Namespace"
            WS["Webserver<br/>(Deployment)"]
            SC["Scheduler<br/>(Deployment)"]
            TR["Triggerer<br/>(Deployment)"]
            
            subgraph "Worker Pods (KubernetesExecutor)"
                WP1["Worker Pod 1<br/>(task_a)"]
                WP2["Worker Pod 2<br/>(task_b)"]
                WP3["Worker Pod N<br/>(task_n)"]
            end
        end

        subgraph "Data Namespace"
            DB["PostgreSQL<br/>(StatefulSet)"]
        end

        subgraph "Monitoring Namespace"
            PROM["Prometheus"]
            GRAF["Grafana"]
        end

        subgraph "Shared Services"
            GS["Git-Sync<br/>(Sidecar)"]
            PV["PersistentVolume<br/>(DAGs / Logs)"]
        end
    end

    subgraph "External"
        GIT["Git Repository<br/>(DAG Files)"]
        S3["S3/GCS<br/>(Logs)"]
        VAULT["Vault<br/>(Secrets)"]
        LB["Load Balancer"]
    end

    LB --> WS
    SC --> DB
    WS --> DB
    TR --> DB
    WP1 --> DB
    WP2 --> DB
    WP3 --> DB
    GS --> GIT
    GS --> PV
    WP1 --> S3
    WP2 --> S3
    SC --> VAULT
    PROM --> SC
    PROM --> WS
    PROM --> WP1

    style WS fill:#017CEE,color:#fff
    style SC fill:#e74c3c,color:#fff
    style DB fill:#3498db,color:#fff
    style PROM fill:#e6522c,color:#fff
```

### Component Breakdown

| Component | K8s Resource | Replicas | Purpose |
|-----------|-------------|----------|---------|
| Webserver | Deployment + Service | 2+ | Serve UI, REST API |
| Scheduler | Deployment | 1-2 (HA) | Parse DAGs, schedule tasks |
| Triggerer | Deployment | 1-2 | Handle deferrable operators |
| Workers | Pods (dynamic) | 0-N | Execute tasks |
| Metadata DB | StatefulSet | 1 (or external) | Store state |
| Redis | StatefulSet | 1 (Celery only) | Message broker |
| Git-sync | Sidecar | 1 per pod | Sync DAG files |

---

## KubernetesExecutor Deep Dive

### How It Works

The KubernetesExecutor is unique: **it creates a new Kubernetes pod for every task instance**. No persistent workers.

```mermaid
sequenceDiagram
    participant S as Scheduler
    participant K8s as Kubernetes API
    participant P as Worker Pod
    participant DB as Metadata DB
    participant S3 as Log Storage

    S->>DB: Find tasks to schedule
    S->>S: Build pod spec from template
    S->>K8s: Create Pod (task_id, dag_id, execution_date)
    K8s->>K8s: Schedule pod to node
    K8s->>P: Start pod
    
    P->>P: Pull container image
    P->>P: Run git-sync (get DAGs)
    P->>DB: Update task state → "running"
    P->>P: Execute task
    P->>DB: Store XCom results
    P->>S3: Upload logs
    P->>DB: Update task state → "success"
    P->>K8s: Pod completes
    
    K8s->>S: Pod completed event
    S->>DB: Verify task state
    
    Note over K8s,P: Pod is deleted after completion
```

### KubernetesExecutor Configuration

```ini
# airflow.cfg
[core]
executor = KubernetesExecutor

[kubernetes_executor]
# Namespace for worker pods
namespace = airflow

# Delete pods after completion (True = clean up, False = keep for debugging)
delete_worker_pods = True

# Keep failed pods for debugging? (overrides delete_worker_pods for failed pods)
delete_worker_pods_on_failure = False

# Pod template file (see next section)
pod_template_file = /opt/airflow/pod_templates/pod_template.yaml

# How long to wait for pod to start (seconds)
worker_pods_creation_batch_size = 16

# Multi-namespace support
multi_namespace_mode = False
```

### KubernetesExecutor vs CeleryExecutor on K8s

```mermaid
graph LR
    subgraph "CeleryExecutor on K8s"
        C1["Persistent worker pods<br/>(always running)"]
        C2["Redis broker<br/>(message queue)"]
        C3["Fixed resource consumption"]
        C4["Faster task start<br/>(~1s)"]
    end

    subgraph "KubernetesExecutor"
        K1["Ephemeral worker pods<br/>(created per task)"]
        K2["No broker needed"]
        K3["Pay only for what you use"]
        K4["Slower task start<br/>(~10-30s)"]
    end

    style C4 fill:#27ae60,color:#fff
    style K3 fill:#27ae60,color:#fff
    style C3 fill:#e74c3c,color:#fff
    style K4 fill:#e74c3c,color:#fff
```

| Feature | CeleryExecutor on K8s | KubernetesExecutor |
|---------|----------------------|-------------------|
| **Startup latency** | ~1s (worker already running) | ~10-30s (pod creation + image pull) |
| **Resource efficiency** | Low (idle workers) | High (no idle resources) |
| **Dependency isolation** | Shared Python env | Per-task container image |
| **Scaling** | Manual worker scaling | Automatic per-task scaling |
| **Complexity** | Need Redis + workers | Only scheduler + pods |
| **Best for** | Many short tasks (<1 min) | Long tasks, diverse dependencies |

---

## Pod Templates

### What Are Pod Templates?

Pod templates define the Kubernetes pod spec for worker pods. This is where you configure:
- Container image
- Resource requests/limits
- Volume mounts
- Environment variables
- Init containers
- Sidecars
- Tolerations and affinities

### Basic Pod Template

```yaml
# pod_templates/pod_template.yaml
apiVersion: v1
kind: Pod
metadata:
  name: airflow-worker
  labels:
    component: worker
    tier: airflow
spec:
  serviceAccountName: airflow-worker
  
  initContainers:
    - name: git-sync-init
      image: registry.k8s.io/git-sync/git-sync:v4.1.0
      args:
        - "--repo=https://github.com/company/airflow-dags.git"
        - "--branch=main"
        - "--root=/dags"
        - "--one-time"
      volumeMounts:
        - name: dags
          mountPath: /dags
      env:
        - name: GITSYNC_USERNAME
          valueFrom:
            secretKeyRef:
              name: git-credentials
              key: username
        - name: GITSYNC_PASSWORD
          valueFrom:
            secretKeyRef:
              name: git-credentials
              key: password

  containers:
    - name: base
      image: company-registry.com/airflow:2.8.0-python3.11
      imagePullPolicy: IfNotPresent
      
      env:
        - name: AIRFLOW__CORE__EXECUTOR
          value: "LocalExecutor"  # Worker runs a single task
        - name: AIRFLOW__DATABASE__SQL_ALCHEMY_CONN
          valueFrom:
            secretKeyRef:
              name: airflow-secrets
              key: sql-alchemy-conn
      
      resources:
        requests:
          cpu: "500m"
          memory: "1Gi"
        limits:
          cpu: "2"
          memory: "4Gi"
      
      volumeMounts:
        - name: dags
          mountPath: /opt/airflow/dags
          readOnly: true
        - name: logs
          mountPath: /opt/airflow/logs

  volumes:
    - name: dags
      emptyDir: {}
    - name: logs
      emptyDir: {}

  restartPolicy: Never  # Don't restart failed workers — Airflow handles retries
```

### Per-Task Pod Overrides

Override the pod template for specific tasks:

```python
from airflow.decorators import dag, task
from kubernetes.client import models as k8s

@dag(schedule="@daily", start_date=datetime(2024, 1, 1))
def pod_override_example():

    @task(
        executor_config={
            "pod_override": k8s.V1Pod(
                spec=k8s.V1PodSpec(
                    containers=[
                        k8s.V1Container(
                            name="base",
                            image="company/ml-image:latest",  # Different image!
                            resources=k8s.V1ResourceRequirements(
                                requests={"cpu": "4", "memory": "16Gi"},
                                limits={"cpu": "8", "memory": "32Gi", "nvidia.com/gpu": "1"},
                            ),
                        )
                    ],
                    node_selector={"node-type": "gpu"},
                    tolerations=[
                        k8s.V1Toleration(
                            key="gpu-node",
                            operator="Equal",
                            value="true",
                            effect="NoSchedule",
                        )
                    ],
                )
            )
        }
    )
    def train_ml_model():
        """This task runs on a GPU node with a special ML image"""
        import torch
        # ML training code...

    train_ml_model()
```

---

## Resource Requests and Limits

### Why They Matter

```mermaid
graph TD
    subgraph "Without Resource Limits"
        A["Task A uses 8GB RAM"]
        B["Node has 16GB total"]
        C["Task B starts, needs 10GB"]
        D["Node runs out of memory"]
        E["OOMKiller kills random pods! 💀"]

        A --> C
        B --> C
        C --> D
        D --> E
    end

    subgraph "With Resource Limits"
        F["Task A requests 4GB, limit 8GB"]
        G["Scheduler places on node with 8GB free"]
        H["Task B requests 4GB, limit 8GB"]
        I["Scheduler places on different node"]
        J["Both tasks succeed ✅"]

        F --> G
        H --> I
        G --> J
        I --> J
    end

    style E fill:#e74c3c,color:#fff
    style J fill:#27ae60,color:#fff
```

### Setting Resources

```yaml
# In pod template or executor_config
resources:
  requests:          # Guaranteed minimum
    cpu: "500m"      # 0.5 CPU core
    memory: "1Gi"    # 1 GB RAM
  limits:            # Maximum allowed
    cpu: "2"         # 2 CPU cores
    memory: "4Gi"    # 4 GB RAM
```

### Resource Strategy by Task Type

| Task Type | CPU Request | CPU Limit | Memory Request | Memory Limit |
|-----------|------------|-----------|----------------|-------------|
| Light (SQL query, API call) | 250m | 1 | 512Mi | 2Gi |
| Medium (Pandas processing) | 500m | 2 | 1Gi | 4Gi |
| Heavy (Spark driver, ML) | 2 | 4 | 4Gi | 16Gi |
| GPU (ML training) | 2 | 4 | 8Gi | 32Gi (+GPU) |

> **💡 Tip:** Set requests = expected average usage. Set limits = maximum burst usage. A large gap between requests and limits means you're overcommitting — fine for bursty workloads, risky for sustained ones.

---

## Node Affinity and Tolerations

### Why Node Affinity?

Different tasks need different hardware. GPU tasks should go to GPU nodes. Memory-intensive tasks should go to high-memory nodes.

```yaml
# Pod template with node affinity
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: workload-type
                operator: In
                values: ["data-processing"]
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 80
          preference:
            matchExpressions:
              - key: instance-type
                operator: In
                values: ["m5.4xlarge", "m5.8xlarge"]
  
  tolerations:
    - key: "dedicated"
      operator: "Equal"
      value: "airflow-workers"
      effect: "NoSchedule"
```

### Practical Node Strategy

```mermaid
graph TD
    subgraph "Node Pool: General (m5.xlarge)"
        N1["Scheduler Pod"]
        N2["Webserver Pod"]
        N3["Triggerer Pod"]
    end

    subgraph "Node Pool: Workers (m5.4xlarge)"
        N4["Light Worker Pods"]
        N5["Medium Worker Pods"]
    end

    subgraph "Node Pool: GPU (p3.2xlarge)"
        N6["ML Training Pods"]
    end

    subgraph "Node Pool: High-Memory (r5.8xlarge)"
        N7["Heavy Processing Pods"]
    end

    style N1 fill:#017CEE,color:#fff
    style N2 fill:#017CEE,color:#fff
    style N6 fill:#e74c3c,color:#fff
    style N7 fill:#f39c12,color:#fff
```

---

## KubernetesPodOperator

### What is KubernetesPodOperator?

KubernetesPodOperator launches a **standalone Kubernetes pod** from any Airflow executor. Unlike KubernetesExecutor (which runs all tasks as pods), KubernetesPodOperator lets you run specific tasks as pods while using CeleryExecutor for the rest.

```python
from airflow.providers.cncf.kubernetes.operators.pod import KubernetesPodOperator
from kubernetes.client import models as k8s

run_spark = KubernetesPodOperator(
    task_id="run_spark_job",
    name="spark-job",
    namespace="data-processing",
    image="company/spark:3.5.0",
    cmds=["spark-submit"],
    arguments=[
        "--master", "k8s://https://kubernetes.default.svc",
        "--deploy-mode", "cluster",
        "--conf", "spark.executor.instances=10",
        "/app/jobs/etl_job.py",
    ],
    resources=k8s.V1ResourceRequirements(
        requests={"cpu": "2", "memory": "4Gi"},
        limits={"cpu": "4", "memory": "8Gi"},
    ),
    env_vars=[
        k8s.V1EnvVar(name="SPARK_HOME", value="/opt/spark"),
    ],
    secrets=[
        k8s.V1EnvVar(
            name="DB_PASSWORD",
            value_from=k8s.V1EnvVarSource(
                secret_key_ref=k8s.V1SecretKeySelector(
                    name="db-credentials",
                    key="password",
                )
            ),
        ),
    ],
    is_delete_operator_pod=True,      # Clean up after completion
    get_logs=True,                     # Stream logs to Airflow
    startup_timeout_seconds=300,       # Wait up to 5 min for pod start
    execution_timeout=timedelta(hours=2),
)
```

### When to Use KubernetesPodOperator vs KubernetesExecutor

| Scenario | Use KubernetesPodOperator | Use KubernetesExecutor |
|----------|--------------------------|----------------------|
| One-off task needs special image | ✅ | ✅ |
| All tasks need isolation | ❌ | ✅ |
| Running on CeleryExecutor | ✅ | ❌ |
| Need fine-grained pod control | ✅ | Partial (via overrides) |
| Run tasks in different namespaces | ✅ | With config |
| Don't want to modify executor | ✅ | ❌ |

---

## Git-Sync for DAGs

### How Git-Sync Works

```mermaid
sequenceDiagram
    participant GR as Git Repository
    participant GS as Git-Sync Sidecar
    participant AF as Airflow Container
    participant SV as Shared Volume

    loop Every 60 seconds
        GS->>GR: git fetch origin main
        GR-->>GS: Latest commits
        GS->>SV: Write DAG files to /dags/repo/
        AF->>SV: Read DAGs from /dags/repo/dags/
        AF->>AF: Parse and schedule DAGs
    end
```

### Git-Sync Configuration in Helm

```yaml
# production-values.yaml
dags:
  gitSync:
    enabled: true
    repo: git@github.com:company/airflow-dags.git
    branch: main
    subPath: "dags"           # Subdirectory containing DAGs
    period: 60s               # Sync interval
    
    # Authentication
    sshKeySecret: airflow-git-ssh-key  # K8s secret with SSH key
    
    # Or use HTTPS + token
    # credentialsSecret: git-credentials
    # extraEnv:
    #   - name: GITSYNC_USERNAME
    #     value: "git"
    #   - name: GITSYNC_PASSWORD
    #     valueFrom:
    #       secretKeyRef:
    #         name: git-credentials
    #         key: token

    containerName: git-sync
    resources:
      requests:
        cpu: 50m
        memory: 64Mi
      limits:
        cpu: 100m
        memory: 128Mi
```

### Git-Sync vs PersistentVolume vs S3

| Method | Pros | Cons | Best For |
|--------|------|------|----------|
| **Git-sync** | Version controlled, auditable | Slight delay for sync | Most deployments |
| **PersistentVolume** | Fast reads | Single point of failure | Legacy setups |
| **S3/GCS** | Scalable, no volume needed | Requires custom logic | Cloud-native |
| **Docker image** | Immutable, versioned | Requires rebuild for changes | CI/CD-heavy teams |

---

## Persistent Volumes

### When You Need Persistent Volumes

```yaml
# For logs (if not using remote logging)
logs:
  persistence:
    enabled: true
    size: 100Gi
    storageClassName: gp3        # AWS EBS gp3
    accessMode: ReadWriteOnce

# For DAGs (if not using git-sync)
dags:
  persistence:
    enabled: true
    size: 10Gi
    storageClassName: efs-sc     # AWS EFS for ReadWriteMany
    accessMode: ReadWriteMany    # Multiple pods need access
```

> **💡 Tip:** Prefer remote logging (S3/GCS) and git-sync over persistent volumes. PVs add complexity and are a single point of failure.

---

## Autoscaling

### Horizontal Pod Autoscaler (HPA) for Webserver

```yaml
# Auto-scale webserver based on CPU
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: airflow-webserver-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: airflow-webserver
  minReplicas: 2
  maxReplicas: 5
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

### KEDA for Workers (Event-Driven Scaling)

```yaml
# Scale workers based on Airflow task queue depth
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: airflow-worker-scaler
spec:
  scaleTargetRef:
    name: airflow-worker
  pollingInterval: 10
  cooldownPeriod: 60
  minReplicaCount: 1
  maxReplicaCount: 50
  triggers:
    - type: postgresql
      metadata:
        connectionFromEnv: AIRFLOW_DB_URI
        query: "SELECT COUNT(*) FROM task_instance WHERE state = 'queued'"
        targetQueryValue: "5"  # Scale up when >5 queued tasks
```

### Cluster Autoscaler

```mermaid
graph LR
    A["Tasks queued"] --> B["Scheduler creates pods"]
    B --> C{"Node capacity?"}
    C -->|"Sufficient"| D["Pod scheduled ✅"]
    C -->|"Insufficient"| E["Pod pending"]
    E --> F["Cluster Autoscaler detects pending pods"]
    F --> G["Provisions new node (2-5 min)"]
    G --> D

    style D fill:#27ae60,color:#fff
    style E fill:#e74c3c,color:#fff
```

---

## Monitoring on Kubernetes

### Prometheus Operator Setup

```yaml
# ServiceMonitor for Airflow metrics
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: airflow-monitor
  labels:
    release: prometheus
spec:
  selector:
    matchLabels:
      component: statsd-exporter
  endpoints:
    - port: metrics
      interval: 15s
      path: /metrics
```

### Key Kubernetes-Specific Metrics

```yaml
# Grafana dashboard queries for Airflow on K8s

# Worker pod creation latency
histogram_quantile(0.95,
  rate(kubelet_pod_worker_duration_seconds_bucket{pod=~"airflow-worker.*"}[5m])
)

# Failed pod count
sum(kube_pod_status_phase{namespace="airflow", phase="Failed"})

# Pod restart count (indicates OOM or crashes)
sum(kube_pod_container_status_restarts_total{namespace="airflow"}) by (pod)

# Resource utilization
sum(container_memory_usage_bytes{namespace="airflow"}) by (pod)
sum(rate(container_cpu_usage_seconds_total{namespace="airflow"}[5m])) by (pod)
```

### Health Check Endpoints

```yaml
# Helm values for liveness and readiness probes
scheduler:
  livenessProbe:
    initialDelaySeconds: 10
    timeoutSeconds: 20
    failureThreshold: 5
    periodSeconds: 60
    command:
      - airflow
      - jobs
      - check
      - --job-type
      - SchedulerJob
      - --hostname
      - $(hostname)

webserver:
  livenessProbe:
    httpGet:
      path: /health
      port: 8080
    initialDelaySeconds: 15
    periodSeconds: 30
  readinessProbe:
    httpGet:
      path: /health
      port: 8080
    initialDelaySeconds: 15
    periodSeconds: 10
```

---

## Log Management

### Remote Logging (Recommended)

```yaml
# Helm values for remote logging to S3
config:
  logging:
    remote_logging: "True"
    remote_base_log_folder: "s3://company-airflow-logs/production"
    remote_log_conn_id: "aws_logs"
    encrypt_s3_logs: "True"
```

### FluentBit Sidecar for Log Aggregation

```yaml
# FluentBit sidecar for real-time log shipping
extraContainers:
  - name: fluentbit
    image: fluent/fluent-bit:2.2
    volumeMounts:
      - name: logs
        mountPath: /opt/airflow/logs
        readOnly: true
    env:
      - name: ELASTICSEARCH_HOST
        value: "elasticsearch.logging.svc:9200"
    config:
      inputs: |
        [INPUT]
            Name tail
            Path /opt/airflow/logs/*/*/*/*.log
            Parser json
            Refresh_Interval 5
      outputs: |
        [OUTPUT]
            Name es
            Host ${ELASTICSEARCH_HOST}
            Index airflow-logs
            Type _doc
```

### Log Architecture

```mermaid
graph LR
    subgraph "Worker Pod"
        T["Task Execution"]
        L["Local Log File"]
        FB["FluentBit Sidecar"]
    end

    T -->|writes| L
    FB -->|reads| L

    S3["S3/GCS<br/>(Persistent)"]
    ES["Elasticsearch<br/>(Searchable)"]
    UI["Airflow UI<br/>(View)"]

    L -->|remote_logging| S3
    FB --> ES
    S3 -->|read back| UI

    style S3 fill:#f39c12,color:#fff
    style ES fill:#27ae60,color:#fff
```

---

## Secrets Management on K8s

### Kubernetes Secrets

```yaml
# Create secrets for Airflow
apiVersion: v1
kind: Secret
metadata:
  name: airflow-secrets
  namespace: airflow
type: Opaque
stringData:
  sql-alchemy-conn: "postgresql://airflow:password@postgres:5432/airflow"
  fernet-key: "your-fernet-key-here"
  webserver-secret-key: "your-webserver-secret"

---
# Reference in Helm values
data:
  metadataSecretName: airflow-secrets
  fernetKeySecretName: airflow-secrets
```

### External Secrets Operator + Vault

```yaml
# ExternalSecret syncs from Vault to K8s Secret
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: airflow-db-creds
  namespace: airflow
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: ClusterSecretStore
  target:
    name: airflow-db-credentials
  data:
    - secretKey: sql-alchemy-conn
      remoteRef:
        key: secret/data/airflow/database
        property: connection_string
```

### Secrets Best Practices on K8s

```mermaid
graph TD
    A["Application needs secret"]
    B{"Where to store?"}
    
    B -->|"Simple"| C["K8s Secret<br/>(base64 encoded)"]
    B -->|"Production"| D["External Secrets Operator<br/>+ Vault/AWS SM"]
    B -->|"Advanced"| E["Sealed Secrets<br/>(encrypted in Git)"]
    
    C --> F["⚠️ Not encrypted at rest by default"]
    D --> G["✅ Centralized, audited, rotatable"]
    E --> H["✅ GitOps-friendly"]
    
    style F fill:#f39c12,color:#fff
    style G fill:#27ae60,color:#fff
    style H fill:#27ae60,color:#fff
```

---

## RBAC and Network Policies

### Kubernetes RBAC for Airflow

```yaml
# ServiceAccount for worker pods
apiVersion: v1
kind: ServiceAccount
metadata:
  name: airflow-worker
  namespace: airflow
  annotations:
    # AWS IAM role for service accounts (IRSA)
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789:role/airflow-worker

---
# Role: Workers can manage pods (for KubernetesExecutor)
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: airflow-worker-role
  namespace: airflow
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["create", "get", "list", "watch", "delete"]
  - apiGroups: [""]
    resources: ["pods/log"]
    verbs: ["get", "list"]
  - apiGroups: [""]
    resources: ["pods/exec"]
    verbs: ["create", "get"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: airflow-worker-binding
  namespace: airflow
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: airflow-worker-role
subjects:
  - kind: ServiceAccount
    name: airflow-worker
    namespace: airflow
```

### Network Policies

```yaml
# Only allow Airflow pods to talk to metadata DB
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: airflow-to-postgres
  namespace: airflow
spec:
  podSelector:
    matchLabels:
      component: worker
  policyTypes:
    - Egress
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgresql
      ports:
        - port: 5432
    - to:  # Allow DNS resolution
        - namespaceSelector: {}
      ports:
        - port: 53
          protocol: UDP
        - port: 53
          protocol: TCP
```

---

## Multi-Tenancy

### Namespace-Per-Team Strategy

```mermaid
graph TD
    subgraph "Kubernetes Cluster"
        subgraph "airflow-platform (Shared)"
            SC["Scheduler"]
            WS["Webserver"]
            DB["Metadata DB"]
        end

        subgraph "airflow-team-a"
            WA1["Team A Worker 1"]
            WA2["Team A Worker 2"]
        end

        subgraph "airflow-team-b"
            WB1["Team B Worker 1"]
            WB2["Team B Worker 2"]
        end

        subgraph "airflow-team-c"
            WC1["Team C Worker 1"]
        end
    end

    SC --> WA1
    SC --> WA2
    SC --> WB1
    SC --> WB2
    SC --> WC1

    style SC fill:#e74c3c,color:#fff
```

### Resource Quotas per Team

```yaml
# Limit resources per team namespace
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-a-quota
  namespace: airflow-team-a
spec:
  hard:
    pods: "50"
    requests.cpu: "100"
    requests.memory: "200Gi"
    limits.cpu: "200"
    limits.memory: "400Gi"
```

---

## Production Helm Values Walkthrough

```yaml
# production-values.yaml — Annotated for production use

# ============================================================
# Executor Configuration
# ============================================================
executor: KubernetesExecutor

# ============================================================
# Images
# ============================================================
images:
  airflow:
    repository: company-ecr.com/airflow
    tag: "2.8.0-py3.11"
    pullPolicy: IfNotPresent
  
  # Use digest for immutable references in production
  # repository: company-ecr.com/airflow@sha256:abc123...

# ============================================================
# Airflow Configuration
# ============================================================
config:
  core:
    parallelism: 128
    max_active_runs_per_dag: 3
    max_active_tasks_per_dag: 32
    load_examples: "False"
    dags_are_paused_at_creation: "True"  # New DAGs start paused
  
  scheduler:
    min_file_process_interval: 30
    dag_dir_list_interval: 60
    parsing_processes: 4
  
  logging:
    remote_logging: "True"
    remote_base_log_folder: "s3://airflow-logs/production"
    remote_log_conn_id: "aws_logs"
  
  metrics:
    statsd_on: "True"
    statsd_host: "statsd-exporter"
    statsd_port: "9125"
    statsd_prefix: "airflow"

# ============================================================
# Scheduler
# ============================================================
scheduler:
  replicas: 2  # HA scheduler (Airflow 2.x+)
  resources:
    requests:
      cpu: "1"
      memory: "2Gi"
    limits:
      cpu: "2"
      memory: "4Gi"
  
  # Anti-affinity: don't schedule both schedulers on the same node
  affinity:
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        - labelSelector:
            matchExpressions:
              - key: component
                operator: In
                values: ["scheduler"]
          topologyKey: kubernetes.io/hostname

# ============================================================
# Webserver
# ============================================================
webserver:
  replicas: 2
  resources:
    requests:
      cpu: "500m"
      memory: "1Gi"
    limits:
      cpu: "1"
      memory: "2Gi"
  
  service:
    type: ClusterIP  # Use Ingress for external access
  
  # Ingress configuration
  ingress:
    enabled: true
    ingressClassName: nginx
    hosts:
      - name: airflow.company.com
        tls:
          enabled: true
          secretName: airflow-tls

# ============================================================
# Triggerer
# ============================================================
triggerer:
  replicas: 2
  resources:
    requests:
      cpu: "250m"
      memory: "512Mi"
    limits:
      cpu: "500m"
      memory: "1Gi"

# ============================================================
# DAGs — Git Sync
# ============================================================
dags:
  gitSync:
    enabled: true
    repo: git@github.com:company/airflow-dags.git
    branch: main
    subPath: dags
    period: 60s
    sshKeySecret: airflow-git-ssh

# ============================================================
# Database (External)
# ============================================================
postgresql:
  enabled: false  # Use external managed PostgreSQL (RDS, Cloud SQL)

data:
  metadataConnection:
    user: airflow
    pass: ""  # Use secret
    protocol: postgresql
    host: airflow-db.us-east-1.rds.amazonaws.com
    port: 5432
    db: airflow
  metadataSecretName: airflow-db-secret

# ============================================================
# Workers (KubernetesExecutor)
# ============================================================
workers:
  persistence:
    enabled: false  # Ephemeral pods — no persistence needed
  
  # Default resources for worker pods
  resources:
    requests:
      cpu: "500m"
      memory: "1Gi"
    limits:
      cpu: "2"
      memory: "4Gi"

# ============================================================
# Cleanup
# ============================================================
cleanup:
  enabled: true
  schedule: "0 3 * * *"  # Daily at 3 AM

# ============================================================
# StatsD Exporter
# ============================================================
statsd:
  enabled: true
  resources:
    requests:
      cpu: "50m"
      memory: "64Mi"
```

---

## Troubleshooting K8s-Specific Issues

### Problem: Worker Pods Stuck in "Pending"

**Symptom:** Tasks stay in "queued" state; worker pods show `Pending` in kubectl.

**Diagnosis:**
```bash
# Check pod events
kubectl describe pod airflow-worker-xxxxx -n airflow

# Common reasons:
# - Insufficient resources (CPU/memory)
# - No nodes match node selector/affinity
# - PVC not bound
# - Image pull failures
```

**Fix:**
```bash
# Check node resources
kubectl top nodes

# Check if resource requests are too high
kubectl get pods -n airflow -o jsonpath='{.items[*].spec.containers[*].resources}'

# Scale up the node pool or reduce resource requests
```

### Problem: Pods OOMKilled

**Symptom:** Pods restart with reason `OOMKilled`. Tasks show as failed.

**Diagnosis:**
```bash
kubectl get pods -n airflow --field-selector=status.phase=Failed
kubectl describe pod <pod-name> -n airflow | grep -A5 "Last State"

# Check actual memory usage
kubectl top pod -n airflow
```

**Fix:**
1. Increase memory limits in pod template or executor_config
2. Optimize task code to use less memory
3. Use `executor_config` per-task for memory-heavy tasks

### Problem: Git-Sync Not Updating DAGs

**Symptom:** DAG changes don't appear in Airflow after pushing to Git.

**Diagnosis:**
```bash
# Check git-sync sidecar logs
kubectl logs <scheduler-pod> -c git-sync -n airflow

# Common issues:
# - SSH key not configured
# - Wrong branch name
# - Repository permissions
```

**Fix:**
```bash
# Verify the secret exists
kubectl get secret airflow-git-ssh -n airflow

# Test git access from within the cluster
kubectl exec -it <scheduler-pod> -c git-sync -n airflow -- git ls-remote
```

### Problem: "Could not serialize DAG" Errors

**Symptom:** Scheduler logs show serialization errors; DAGs don't appear in UI.

**Root Cause:** Python dependencies missing from the scheduler/worker image.

**Fix:**
```dockerfile
# Build a custom image with all required dependencies
FROM apache/airflow:2.8.0-python3.11

# Install provider packages
RUN pip install \
    apache-airflow-providers-amazon \
    apache-airflow-providers-google \
    apache-airflow-providers-cncf-kubernetes \
    pandas==2.1.0 \
    requests==2.31.0
```

### Problem: Zombie Tasks After Node Drain

**Symptom:** Tasks stuck in "running" state after a node is drained/terminated.

**Fix:**
```ini
# airflow.cfg — Configure scheduler to detect zombies faster
[scheduler]
scheduler_zombie_task_threshold = 300  # 5 minutes (default)
zombie_detection_interval = 60         # Check every minute
```

---

## Performance Considerations

### Pod Startup Optimization

```mermaid
graph LR
    A["Pod Created"] --> B["Image Pull<br/>(5-30s)"]
    B --> C["Init Containers<br/>(git-sync: 5-10s)"]
    C --> D["Container Start<br/>(1-3s)"]
    D --> E["Task Execution"]

    F["Total: 10-45 seconds overhead"]

    style B fill:#e74c3c,color:#fff
    style F fill:#f39c12,color:#fff
```

**Optimization strategies:**
1. **Pre-pull images** to nodes using DaemonSets
2. **Use `IfNotPresent` pull policy** (not `Always`)
3. **Keep images small** — multi-stage Docker builds
4. **Use init container wisely** — git-sync-init for one-time pull
5. **Consider CeleryKubernetesExecutor** — Celery for fast tasks, K8s for heavy ones

### Metadata DB Connection Pooling

```ini
# With many pods connecting to the same DB
[database]
sql_alchemy_pool_size = 5
sql_alchemy_max_overflow = 10
sql_alchemy_pool_recycle = 1800
sql_alchemy_pool_pre_ping = True
```

With KubernetesExecutor, each pod opens its own connection. 100 concurrent pods = 100+ connections. Use PgBouncer:

```yaml
# Helm values — enable PgBouncer
pgbouncer:
  enabled: true
  maxClientConn: 200
  metadataPoolSize: 10
  resultBackendPoolSize: 5
```

---

## Common Mistakes

### Mistake 1: Not Setting Resource Limits

```yaml
# ❌ No limits — pod can consume entire node
containers:
  - name: worker
    image: airflow:latest

# ✅ Always set limits
containers:
  - name: worker
    image: airflow:latest
    resources:
      requests:
        cpu: "500m"
        memory: "1Gi"
      limits:
        cpu: "2"
        memory: "4Gi"
```

### Mistake 2: Using Latest Tag

```yaml
# ❌ "latest" is not reproducible
image: apache/airflow:latest

# ✅ Pin to specific version
image: apache/airflow:2.8.0-python3.11
# Or even better, use digest
image: apache/airflow@sha256:abc123def456...
```

### Mistake 3: Forgetting PgBouncer

Without PgBouncer, KubernetesExecutor creates a new DB connection per pod. At scale (100+ concurrent tasks), this exhausts PostgreSQL's `max_connections`.

### Mistake 4: Not Configuring Pod Disruption Budgets

```yaml
# Without PDB, Kubernetes can drain ALL scheduler pods during upgrades
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: airflow-scheduler-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels:
      component: scheduler
```

---

## Real-World Production Scenarios

### Scenario 1: E-Commerce Platform (100 DAGs, Mixed Workloads)

```yaml
# Architecture:
# - KubernetesExecutor for long-running/heavy tasks
# - 3 node pools: general, workers, gpu
# - External PostgreSQL (RDS Multi-AZ)
# - S3 for logs
# - Vault for secrets

executor: KubernetesExecutor

scheduler:
  replicas: 2
  resources:
    requests: { cpu: "2", memory: "4Gi" }

webserver:
  replicas: 2
  ingress:
    enabled: true
    hosts: [{ name: "airflow.internal.company.com" }]

dags:
  gitSync:
    enabled: true
    repo: "git@github.com:company/data-pipelines.git"
    branch: "main"
    period: "30s"
```

### Scenario 2: ML Platform (GPU Workloads)

```python
# DAG that trains models on GPU nodes
from airflow.decorators import dag, task
from kubernetes.client import models as k8s

GPU_CONFIG = {
    "pod_override": k8s.V1Pod(
        spec=k8s.V1PodSpec(
            containers=[
                k8s.V1Container(
                    name="base",
                    image="company/ml-trainer:latest",
                    resources=k8s.V1ResourceRequirements(
                        requests={"cpu": "4", "memory": "16Gi", "nvidia.com/gpu": "1"},
                        limits={"cpu": "8", "memory": "32Gi", "nvidia.com/gpu": "1"},
                    ),
                )
            ],
            tolerations=[
                k8s.V1Toleration(key="nvidia.com/gpu", operator="Exists", effect="NoSchedule")
            ],
            node_selector={"node-type": "gpu"},
        )
    )
}

@dag(schedule="0 2 * * *", start_date=datetime(2024, 1, 1))
def ml_training_pipeline():

    @task(executor_config=GPU_CONFIG)
    def train_model():
        import torch
        # Training code runs on GPU node
        pass
```

---

## Interview Questions

### Beginner

**Q1: Why would you run Airflow on Kubernetes?**

**A:** Kubernetes provides dynamic scaling (create pods on demand), resource isolation (each task gets its own container), dependency management (per-task Docker images), automatic recovery (pod restart on failure), and efficient resource utilization (no idle workers). It's ideal for large deployments with diverse workloads and multiple teams.

**Q2: What is the difference between KubernetesExecutor and KubernetesPodOperator?**

**A:** KubernetesExecutor is an **executor type** that runs ALL tasks as individual Kubernetes pods — it replaces CeleryExecutor entirely. KubernetesPodOperator is a **single operator** that launches a pod for a specific task — it can be used with ANY executor (Celery, Local, etc.). Use KubernetesExecutor when you want full isolation for all tasks. Use KubernetesPodOperator when only specific tasks need pod isolation.

---

### Intermediate

**Q3: How does the KubernetesExecutor handle task execution?**

**A:** When the scheduler identifies a task to run, it builds a pod specification from the pod template (optionally with per-task overrides from `executor_config`). It submits this pod spec to the Kubernetes API server, which schedules the pod onto a node. The pod starts, pulls the container image, runs init containers (like git-sync), then executes the task. Upon completion, the pod updates the task state in the metadata DB, uploads logs, and terminates. The scheduler monitors pod status via the Kubernetes API.

**Q4: What strategies reduce pod startup latency?**

**A:** Key strategies: (1) Pre-pull images on nodes using a DaemonSet or by using `imagePullPolicy: IfNotPresent`, (2) Use small Docker images (multi-stage builds), (3) Minimize init containers, (4) Use the CeleryKubernetesExecutor for fast tasks (Celery) and heavy tasks (K8s), (5) Use node-local SSD for image caching, (6) Consider using a container image cache like Dragonfly.

---

### Advanced

**Q5: You're running 500 DAGs with KubernetesExecutor and the metadata DB is hitting connection limits. How do you fix it?**

**A:** Enable PgBouncer as a connection pooler between Airflow pods and PostgreSQL. The official Helm chart has built-in PgBouncer support. Configure `pgbouncer.enabled=true` with appropriate pool sizes. Also reduce `sql_alchemy_pool_size` per pod since PgBouncer handles multiplexing. Consider increasing PostgreSQL `max_connections` and using a managed DB service (RDS, Cloud SQL) with higher connection limits. Monitor active connections with `pg_stat_activity`.

**Q6: Design a multi-tenant Airflow deployment on Kubernetes for 5 data teams.**

**A:** I'd use a single Airflow installation with the KubernetesExecutor and multi-namespace mode: (1) One shared namespace for scheduler, webserver, and triggerer. (2) Separate worker namespaces per team (`airflow-team-a`, `airflow-team-b`, etc.). (3) Kubernetes ResourceQuotas per namespace to limit each team's resource consumption. (4) NetworkPolicies to isolate worker namespaces. (5) Airflow RBAC with DAG-level access control so each team sees only their DAGs. (6) Per-team pod templates with different images and resource defaults. (7) Per-team pools in Airflow to limit concurrent tasks. (8) Separate git repos or subdirectories for each team's DAGs.

---

**[← Previous: Production Best Practices](12-production-best-practices.md) | [Home](../README.md) | [Next →: Interview Guide](14-airflow-interview-guide.md)**
