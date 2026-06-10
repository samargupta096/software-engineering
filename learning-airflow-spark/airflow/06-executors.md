# 06 — Executors: How Airflow Gets Work Done

> **"The scheduler decides WHAT to run and WHEN. The executor decides WHERE and HOW."**

---

## Table of Contents

- [1. Intuition — Why Executors Exist](#1-intuition--why-executors-exist)
- [2. Real-World Analogy — Construction Crews](#2-real-world-analogy--construction-crews)
- [3. Executor Architecture Overview](#3-executor-architecture-overview)
- [4. SequentialExecutor — The Solo Worker](#4-sequentialexecutor--the-solo-worker)
- [5. LocalExecutor — The In-House Team](#5-localexecutor--the-in-house-team)
- [6. CeleryExecutor — The Distributed Workforce](#6-celeryexecutor--the-distributed-workforce)
- [7. KubernetesExecutor — The On-Demand Contractors](#7-kubernetesexecutor--the-on-demand-contractors)
- [8. CeleryKubernetesExecutor — The Hybrid Approach](#8-celerykubernetesexecutor--the-hybrid-approach)
- [9. Executor Comparison Table](#9-executor-comparison-table)
- [10. Decision Flowchart — Choosing Your Executor](#10-decision-flowchart--choosing-your-executor)
- [11. Configuration Deep Dive](#11-configuration-deep-dive)
- [12. Production Scenarios](#12-production-scenarios)
- [13. Troubleshooting](#13-troubleshooting)
- [14. Performance Considerations](#14-performance-considerations)
- [15. Common Mistakes](#15-common-mistakes)
- [16. Interview Questions](#16-interview-questions)

---

## 1. Intuition — Why Executors Exist

Imagine the scheduler as a **project manager** holding a list of tasks that need to get done today. The project manager knows *what* needs to happen and in *what order*. But the project manager doesn't build anything — they need **workers**.

The **executor** is the mechanism that provides those workers. It answers three critical questions:

1. **Where** does the task code physically run? (Same machine? Another machine? A container?)
2. **How many** tasks can run in parallel?
3. **How** is work distributed to the workers?

Without executors, the scheduler would be a project manager screaming into an empty room.

> **💡 Key Insight:** The executor is the *only* component that changes between a dev laptop and a 1000-node production cluster. Your DAGs stay the same — only the executor configuration changes.

### Why Different Executors?

Different organizations have wildly different needs:

| Need | Best Executor |
|------|---------------|
| "I'm just learning Airflow on my laptop" | SequentialExecutor |
| "Small team, 20 DAGs, single server" | LocalExecutor |
| "Enterprise, 500+ DAGs, need horizontal scaling" | CeleryExecutor |
| "Cloud-native, dynamic resource allocation, isolation" | KubernetesExecutor |
| "Most tasks are fast, but some need heavy GPU resources" | CeleryKubernetesExecutor |

---

## 2. Real-World Analogy — Construction Crews

Think of building a house. You're the **general contractor** (scheduler), and you have different ways to get work done:

```mermaid
graph TD
    subgraph "🏗️ Construction Crew Analogies"
        A["🔨 SequentialExecutor<br/>One worker, one task at a time<br/><i>Like doing all renovation yourself</i>"]
        B["👷 LocalExecutor<br/>Hire local workers from your town<br/><i>Same building, multiple workers</i>"]
        C["🏭 CeleryExecutor<br/>Hire a staffing agency<br/><i>Workers from multiple cities</i>"]
        D["📦 KubernetesExecutor<br/>Hire specialized contractors on-demand<br/><i>Each arrives with their own tools</i>"]
        E["🔀 CeleryKubernetesExecutor<br/>Staffing agency + specialized contractors<br/><i>Regular crew + specialists when needed</i>"]
    end

    style A fill:#e74c3c,color:#fff
    style B fill:#f39c12,color:#fff
    style C fill:#3498db,color:#fff
    style D fill:#2ecc71,color:#fff
    style E fill:#9b59b6,color:#fff
```

| Analogy | Executor | Explanation |
|---------|----------|-------------|
| **DIY renovator** | SequentialExecutor | You do every task yourself, one at a time. Slow but zero coordination overhead. |
| **Local crew** | LocalExecutor | You hire 8 workers from your town. They all show up at *your* site. Limited by how many can fit. |
| **Staffing agency** | CeleryExecutor | A staffing agency (message broker) dispatches workers across multiple job sites (machines). You can scale by opening more sites. |
| **On-demand contractors** | KubernetesExecutor | Each task gets a specialized contractor who shows up with their own truck, tools, and supplies. When the job's done, they leave. No idle workers. |
| **Hybrid crew** | CeleryKubernetesExecutor | Your regular crew handles daily tasks. For specialized work (electrical, plumbing), you bring in contractors. |

---

## 3. Executor Architecture Overview

### How Executors Fit in the Airflow Architecture

```mermaid
graph TB
    subgraph "Airflow Architecture"
        UI["🖥️ Web Server<br/>(Flask App)"]
        SCH["🧠 Scheduler<br/>(Picks tasks to run)"]
        EXE["⚙️ Executor<br/>(Runs tasks)"]
        META["🗄️ Metadata DB<br/>(PostgreSQL/MySQL)"]
        WORKERS["👷 Workers<br/>(Actual execution)"]
    end

    UI --> META
    SCH --> META
    SCH -->|"Sends TaskInstances"| EXE
    EXE -->|"Distributes work"| WORKERS
    WORKERS -->|"Update state"| META
    EXE -->|"Reports results"| SCH

    style SCH fill:#e74c3c,color:#fff
    style EXE fill:#3498db,color:#fff
    style WORKERS fill:#2ecc71,color:#fff
    style META fill:#f39c12,color:#fff
```

### The Executor Interface — What Every Executor Must Do

Every executor in Airflow inherits from `BaseExecutor` and must implement these core methods:

```python
class BaseExecutor:
    def start(self):
        """Called when the executor is initialized."""
        pass

    def execute_async(self, key, command, queue=None, executor_config=None):
        """Execute a command asynchronously. This is where the task gets dispatched."""
        raise NotImplementedError()

    def sync(self):
        """Called periodically to sync the state of running tasks."""
        pass

    def heartbeat(self):
        """Called periodically by the scheduler."""
        self.sync()
        self._process_tasks()

    def end(self):
        """Called when the executor is shutting down."""
        pass

    def terminate(self):
        """Called for immediate shutdown."""
        pass
```

> **🔑 Key Concept:** Every executor maintains two queues internally:
> - `queued_tasks`: Tasks waiting to be dispatched
> - `running`: Tasks currently being executed
>
> The `heartbeat()` method moves tasks from `queued_tasks` → `running` and checks `running` for completed tasks.

### The Task Execution Flow

```mermaid
sequenceDiagram
    participant S as Scheduler
    participant E as Executor
    participant W as Worker(s)
    participant DB as Metadata DB

    S->>DB: Find tasks ready to run
    DB-->>S: Return TaskInstances
    S->>E: queue_command(task_instance)
    E->>E: Add to queued_tasks
    
    loop heartbeat() every scheduler_heartbeat_sec
        E->>E: sync() - check running tasks
        E->>W: execute_async() - dispatch queued tasks
        W->>W: Run: airflow tasks run <dag_id> <task_id> <exec_date>
        W->>DB: Update task state (running → success/failed)
        E->>DB: Check task state changes
        E->>S: Report completed/failed tasks
    end
```

---

## 4. SequentialExecutor — The Solo Worker

### What It Is

The SequentialExecutor runs **one task at a time**, in the **same process** as the scheduler. It's the simplest possible executor.

### Architecture

```mermaid
graph LR
    subgraph "Single Process"
        SCH["Scheduler"]
        EXE["SequentialExecutor"]
        TASK["Task Execution"]
    end
    DB["SQLite DB"]

    SCH --> EXE --> TASK
    TASK --> DB

    style SCH fill:#e74c3c,color:#fff
    style EXE fill:#3498db,color:#fff
    style TASK fill:#2ecc71,color:#fff
```

### How It Works Internally

```python
# Simplified version of SequentialExecutor
class SequentialExecutor(BaseExecutor):
    def execute_async(self, key, command, queue=None, executor_config=None):
        # Literally runs the command in a subprocess and WAITS
        subprocess.check_call(command, close_fds=True)
        # Only after the task finishes does it mark as success
        self.change_state(key, State.SUCCESS)

    def sync(self):
        pass  # Nothing to sync — everything is synchronous

    def end(self):
        pass  # Nothing to clean up
```

Notice: `execute_async` is not actually async at all. It blocks until the task finishes, then picks up the next one.

### When to Use

- ✅ Local development and learning
- ✅ Running Airflow's own test suites
- ✅ Environments where you absolutely need SQLite

### When NOT to Use

- ❌ Any production environment
- ❌ Any environment where you need parallelism
- ❌ Any environment with more than a handful of DAGs

### Configuration

```ini
# airflow.cfg
[core]
executor = SequentialExecutor

[database]
# SequentialExecutor is the ONLY executor that works with SQLite
sql_alchemy_conn = sqlite:////home/airflow/airflow.db
```

### Scaling Characteristics

| Metric | Value |
|--------|-------|
| Max parallelism | 1 |
| Horizontal scaling | Not possible |
| Resource overhead | Minimal (~200MB RAM) |
| Setup complexity | Zero |

---

## 5. LocalExecutor — The In-House Team

### What It Is

The LocalExecutor spawns **multiple parallel processes** on the **same machine** as the scheduler. It's the first "real" executor most teams use.

### Architecture

```mermaid
graph TB
    subgraph "Single Machine"
        SCH["🧠 Scheduler"]
        EXE["⚙️ LocalExecutor"]
        
        subgraph "Process Pool"
            W1["Worker Process 1<br/>Task A"]
            W2["Worker Process 2<br/>Task B"]
            W3["Worker Process 3<br/>Task C"]
            WN["Worker Process N<br/>Task D"]
        end
    end
    
    DB["🗄️ PostgreSQL/MySQL"]

    SCH --> EXE
    EXE --> W1
    EXE --> W2
    EXE --> W3
    EXE --> WN
    W1 --> DB
    W2 --> DB
    W3 --> DB
    WN --> DB

    style SCH fill:#e74c3c,color:#fff
    style EXE fill:#3498db,color:#fff
    style W1 fill:#2ecc71,color:#fff
    style W2 fill:#2ecc71,color:#fff
    style W3 fill:#2ecc71,color:#fff
    style WN fill:#2ecc71,color:#fff
```

### How It Works Internally

The LocalExecutor has two implementation strategies:

#### Strategy 1: Unlimited Parallelism (`parallelism = 0`)

Uses `LocalWorkerBase` — spawns a new process for every task.

```python
# Simplified: Unlimited parallelism mode
class UnlimitedParallelism:
    def start(self):
        """No pool to create — each task gets its own process."""
        pass
    
    def execute_async(self, key, command):
        """Spawn a new process for each task."""
        local_worker = LocalWorkerBase(result_queue)
        local_worker.key = key
        local_worker.command = command
        local_worker.start()  # Forks a new OS process
        
    def sync(self):
        """Check result_queue for completed tasks."""
        while not self.result_queue.empty():
            key, state = self.result_queue.get()
            self.change_state(key, state)
```

#### Strategy 2: Limited Parallelism (`parallelism > 0`)

Uses a **bounded process pool** with a task queue.

```python
# Simplified: Limited parallelism mode
class LimitedParallelism:
    def start(self):
        """Create a fixed pool of worker processes."""
        self.queue = Queue()  # multiprocessing.Queue
        self.workers = []
        for _ in range(self.parallelism):
            worker = LocalWorkerBase(self.result_queue, self.queue)
            worker.start()
            self.workers.append(worker)
    
    def execute_async(self, key, command):
        """Put task on the shared queue — a worker will pick it up."""
        self.queue.put((key, command))
    
    def sync(self):
        """Check result_queue for completed tasks."""
        while not self.result_queue.empty():
            key, state = self.result_queue.get()
            self.change_state(key, state)
```

> **🔑 Key Insight:** In limited mode, the LocalExecutor creates worker processes at startup that **stay alive** and pull tasks from a shared queue. In unlimited mode, it creates a **new process per task** (higher fork overhead but no artificial limit).

### When to Use

- ✅ Small to medium workloads (up to ~100 concurrent tasks)
- ✅ Single-server deployments
- ✅ Teams that want parallelism without managing distributed infrastructure
- ✅ Development environments that need to test parallel behavior

### When NOT to Use

- ❌ When you need to scale beyond a single machine
- ❌ When tasks have highly variable resource requirements
- ❌ When you need fault tolerance (machine goes down = everything stops)

### Configuration

```ini
# airflow.cfg
[core]
executor = LocalExecutor
parallelism = 32              # Max total tasks across ALL DAGs

[database]
# MUST use PostgreSQL or MySQL — SQLite won't work
sql_alchemy_conn = postgresql+psycopg2://airflow:airflow@localhost:5432/airflow
```

```python
# Key settings that affect LocalExecutor
# In airflow.cfg [core] section:

parallelism = 32           # Max tasks the executor will run simultaneously
dag_concurrency = 16       # Max tasks per DAG running at once
max_active_runs_per_dag = 16  # Max active DAG runs per DAG
```

### Scaling Characteristics

| Metric | Value |
|--------|-------|
| Max parallelism | Limited by CPU/RAM of single machine |
| Horizontal scaling | Not possible (single machine) |
| Resource overhead | ~50MB per worker process |
| Setup complexity | Low (just need PostgreSQL) |
| Typical limit | 32-64 concurrent tasks on a good server |

### Production Example

```python
# docker-compose.yml for LocalExecutor setup
"""
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: airflow
      POSTGRES_PASSWORD: airflow
      POSTGRES_DB: airflow
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "airflow"]
      interval: 5s
      retries: 5

  airflow:
    image: apache/airflow:2.8.1
    environment:
      AIRFLOW__CORE__EXECUTOR: LocalExecutor
      AIRFLOW__DATABASE__SQL_ALCHEMY_CONN: postgresql+psycopg2://airflow:airflow@postgres/airflow
      AIRFLOW__CORE__PARALLELISM: 32
      AIRFLOW__CORE__DAG_CONCURRENCY: 16
    volumes:
      - ./dags:/opt/airflow/dags
      - ./logs:/opt/airflow/logs
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres-data:
"""
```

---

## 6. CeleryExecutor — The Distributed Workforce

### What It Is

The CeleryExecutor uses **Celery** — a distributed task queue — to farm out task execution across **multiple worker machines**. This is the traditional choice for production Airflow at scale.

### Architecture

```mermaid
graph TB
    subgraph "Control Plane"
        SCH["🧠 Scheduler"]
        WEB["🖥️ Web Server"]
    end
    
    BROKER["📬 Message Broker<br/>(Redis / RabbitMQ)"]
    RESULT["📊 Result Backend<br/>(Redis / DB)"]
    
    subgraph "Worker Machine 1"
        CW1["🔧 Celery Worker"]
        T1A["Task A"]
        T1B["Task B"]
    end
    
    subgraph "Worker Machine 2"
        CW2["🔧 Celery Worker"]
        T2A["Task C"]
        T2B["Task D"]
    end
    
    subgraph "Worker Machine 3"
        CW3["🔧 Celery Worker"]
        T3A["Task E"]
        T3B["Task F"]
    end
    
    DB["🗄️ Metadata DB<br/>(PostgreSQL)"]

    SCH -->|"Publishes tasks"| BROKER
    BROKER -->|"Distributes tasks"| CW1
    BROKER -->|"Distributes tasks"| CW2
    BROKER -->|"Distributes tasks"| CW3
    CW1 --> T1A & T1B
    CW2 --> T2A & T2B
    CW3 --> T3A & T3B
    CW1 -->|"Reports results"| RESULT
    CW2 -->|"Reports results"| RESULT
    CW3 -->|"Reports results"| RESULT
    SCH --> DB
    WEB --> DB

    style SCH fill:#e74c3c,color:#fff
    style BROKER fill:#9b59b6,color:#fff
    style CW1 fill:#2ecc71,color:#fff
    style CW2 fill:#2ecc71,color:#fff
    style CW3 fill:#2ecc71,color:#fff
```

### How It Works Internally

```mermaid
sequenceDiagram
    participant S as Scheduler
    participant CE as CeleryExecutor
    participant B as Message Broker<br/>(Redis/RabbitMQ)
    participant W as Celery Worker
    participant DB as Metadata DB

    S->>CE: queue_command(task_instance)
    CE->>B: publish task message to queue
    Note over B: Task sits in queue until<br/>a worker picks it up
    W->>B: fetch next task from queue
    B-->>W: return task command
    W->>W: Execute: airflow tasks run ...
    W->>DB: Update task state → running
    W->>W: ... task executes ...
    W->>DB: Update task state → success/failed
    W->>B: Publish result to result backend
    CE->>B: Poll for results (during sync())
    CE->>S: Report task completion
```

### The Celery Queue System

One of Celery's most powerful features is **queue routing** — you can direct different tasks to different worker pools:

```python
# DAG using queue routing
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime

with DAG("queue_routing_example", start_date=datetime(2024, 1, 1)) as dag:
    
    # This task goes to the default queue
    light_task = PythonOperator(
        task_id="light_processing",
        python_callable=lambda: print("I'm a light task"),
        queue="default",       # Handled by default workers
    )
    
    # This task goes to a high-memory worker queue
    heavy_task = PythonOperator(
        task_id="heavy_processing",
        python_callable=lambda: print("I need lots of RAM"),
        queue="high_memory",   # Handled by high-memory workers
    )
    
    # This task goes to a GPU worker queue
    ml_task = PythonOperator(
        task_id="ml_training",
        python_callable=lambda: print("I need a GPU"),
        queue="gpu",           # Handled by GPU-enabled workers
    )
    
    light_task >> heavy_task >> ml_task
```

```bash
# Start workers for different queues
# Default workers (general purpose, 4 processes each)
airflow celery worker --queues default --concurrency 4

# High-memory workers (fewer processes, more RAM per process)
airflow celery worker --queues high_memory --concurrency 2

# GPU workers (one task at a time to avoid GPU contention)
airflow celery worker --queues gpu --concurrency 1
```

### When to Use

- ✅ Production workloads requiring horizontal scaling
- ✅ When you need to scale beyond a single machine
- ✅ When you want dedicated worker pools for different task types
- ✅ Teams already familiar with Celery/Redis/RabbitMQ
- ✅ When you need a proven, battle-tested approach

### When NOT to Use

- ❌ When you need per-task resource isolation (dependency conflicts between tasks)
- ❌ When you want to pay only for compute you use (workers are always running)
- ❌ Small teams that can't manage broker + worker infrastructure
- ❌ When tasks have wildly different Python dependency requirements

### Configuration

```ini
# airflow.cfg
[core]
executor = CeleryExecutor

[celery]
# Message broker — where tasks are queued
broker_url = redis://redis:6379/0
# Alternative: broker_url = amqp://user:password@rabbitmq:5672/

# Result backend — where task results are stored
result_backend = db+postgresql://airflow:airflow@postgres:5432/airflow
# Alternative: result_backend = redis://redis:6379/1

# Worker concurrency (per worker machine)
worker_concurrency = 16

# How long to wait for workers to finish during shutdown
worker_shutdown_timeout = 120

# Task acknowledgment — ack late means task is re-queued if worker crashes mid-execution
worker_ack_late = True

# Prefetch multiplier — how many tasks each worker fetches at once
worker_prefetch_multiplier = 1  # Set to 1 for long-running tasks
```

### Celery Flower — Monitoring Workers

```bash
# Start the Celery Flower monitoring dashboard
airflow celery flower --port=5555
```

```mermaid
graph LR
    subgraph "Monitoring Stack"
        FL["🌸 Flower Dashboard<br/>:5555"]
        FL --> W1["Worker 1 Status"]
        FL --> W2["Worker 2 Status"]
        FL --> W3["Worker 3 Status"]
        FL --> Q["Queue Depths"]
        FL --> R["Success/Failure Rates"]
    end
```

### Scaling Characteristics

| Metric | Value |
|--------|-------|
| Max parallelism | Unlimited (add more workers) |
| Horizontal scaling | Yes — add worker machines |
| Resource overhead | Broker (Redis: ~100MB, RMQ: ~200MB) + workers |
| Setup complexity | Medium-High (broker + workers + monitoring) |
| Cold start time | Near-zero (workers are always running) |
| Resource efficiency | Low-Medium (workers idle when no tasks) |

---

## 7. KubernetesExecutor — The On-Demand Contractors

### What It Is

The KubernetesExecutor creates a **new Kubernetes Pod** for every single task. When the task finishes, the pod is destroyed. Zero idle resources.

### Architecture

```mermaid
graph TB
    subgraph "Control Plane"
        SCH["🧠 Scheduler"]
        WEB["🖥️ Web Server"]
        K8E["⚙️ KubernetesExecutor"]
    end
    
    K8S["☸️ Kubernetes API Server"]
    DB["🗄️ Metadata DB"]
    
    subgraph "Kubernetes Cluster"
        subgraph "Pod: task-a-xyz"
            TA["Airflow Worker<br/>Task A"]
        end
        subgraph "Pod: task-b-abc"
            TB["Airflow Worker<br/>Task B"]
        end
        subgraph "Pod: task-c-def"
            TC["Airflow Worker<br/>Task C"]
        end
        P["🔄 Pending Pods..."]
    end

    SCH --> K8E
    K8E -->|"Create Pod"| K8S
    K8S --> TA & TB & TC
    TA & TB & TC -->|"Update state"| DB
    K8E -->|"Watch Pod status"| K8S

    style SCH fill:#e74c3c,color:#fff
    style K8E fill:#3498db,color:#fff
    style K8S fill:#326CE5,color:#fff
    style TA fill:#2ecc71,color:#fff
    style TB fill:#2ecc71,color:#fff
    style TC fill:#2ecc71,color:#fff
```

### How It Works Internally

```mermaid
sequenceDiagram
    participant S as Scheduler
    participant KE as KubernetesExecutor
    participant K8S as K8s API Server
    participant POD as Worker Pod
    participant DB as Metadata DB

    S->>KE: queue_command(task_instance)
    KE->>KE: Build pod spec from template + executor_config
    KE->>K8S: Create Pod (POST /api/v1/namespaces/.../pods)
    K8S-->>KE: Pod created (status: Pending)
    K8S->>K8S: Schedule pod to a node
    K8S->>POD: Start container
    POD->>POD: Run: airflow tasks run <dag_id> <task_id> <exec_date>
    POD->>DB: Update task state → running
    POD->>POD: ... task executes ...
    POD->>DB: Update task state → success/failed
    
    loop KubernetesExecutor.sync()
        KE->>K8S: Watch pod status changes
        K8S-->>KE: Pod completed
        KE->>K8S: Delete Pod (cleanup)
        KE->>S: Report task completion
    end
```

### Pod Template — Defining How Tasks Run

The pod template is the heart of the KubernetesExecutor. It defines the "blueprint" for every worker pod:

```yaml
# pod_template.yaml
apiVersion: v1
kind: Pod
metadata:
  name: airflow-worker
  labels:
    app: airflow-worker
spec:
  restartPolicy: Never     # Critical: tasks should NOT restart automatically
  serviceAccountName: airflow-worker
  containers:
    - name: base
      image: my-company/airflow:2.8.1-custom
      imagePullPolicy: Always
      env:
        - name: AIRFLOW__DATABASE__SQL_ALCHEMY_CONN
          valueFrom:
            secretKeyRef:
              name: airflow-secrets
              key: sql-alchemy-conn
      resources:
        requests:
          memory: "512Mi"
          cpu: "250m"
        limits:
          memory: "2Gi"
          cpu: "1000m"
      volumeMounts:
        - name: dags
          mountPath: /opt/airflow/dags
          readOnly: true
        - name: logs
          mountPath: /opt/airflow/logs
  volumes:
    - name: dags
      persistentVolumeClaim:
        claimName: airflow-dags-pvc
    - name: logs
      persistentVolumeClaim:
        claimName: airflow-logs-pvc
  # Optional: tolerations, nodeSelector, affinity for scheduling control
  tolerations:
    - key: "workload"
      operator: "Equal"
      value: "airflow"
      effect: "NoSchedule"
```

### Per-Task Pod Overrides

The killer feature: **every task can customize its pod spec**:

```python
from airflow import DAG
from airflow.operators.python import PythonOperator
from kubernetes.client import models as k8s
from datetime import datetime

# Custom pod configuration for a specific task
gpu_resources = k8s.V1ResourceRequirements(
    requests={"memory": "8Gi", "cpu": "4", "nvidia.com/gpu": "1"},
    limits={"memory": "16Gi", "cpu": "8", "nvidia.com/gpu": "1"},
)

gpu_tolerations = [
    k8s.V1Toleration(
        key="nvidia.com/gpu",
        operator="Exists",
        effect="NoSchedule",
    )
]

with DAG("k8s_executor_example", start_date=datetime(2024, 1, 1)) as dag:
    
    # Light task — uses default pod template
    extract = PythonOperator(
        task_id="extract_data",
        python_callable=lambda: print("Extracting data"),
    )
    
    # Heavy task — overrides pod resources
    transform = PythonOperator(
        task_id="train_ml_model",
        python_callable=lambda: print("Training model"),
        executor_config={
            "pod_override": k8s.V1Pod(
                spec=k8s.V1PodSpec(
                    containers=[
                        k8s.V1Container(
                            name="base",
                            image="my-company/ml-airflow:latest",
                            resources=gpu_resources,
                        )
                    ],
                    tolerations=gpu_tolerations,
                    node_selector={"gpu-type": "a100"},
                )
            ),
        },
    )
    
    extract >> transform
```

### When to Use

- ✅ Cloud-native environments already running Kubernetes
- ✅ Tasks with heterogeneous resource needs (some need 256MB, others need 32GB)
- ✅ Need per-task dependency isolation (each task can use a different Docker image)
- ✅ Want to pay only for compute you use (no idle workers)
- ✅ Need strong multi-tenancy and security isolation

### When NOT to Use

- ❌ When you don't have Kubernetes expertise on the team
- ❌ Tasks that need sub-second start times (pod startup adds 30-120s overhead)
- ❌ Very high frequency, short-lived tasks (pod overhead dominates)
- ❌ When you can't tolerate the cold-start latency

### Configuration

```ini
# airflow.cfg
[core]
executor = KubernetesExecutor

[kubernetes_executor]
# Path to pod template file
pod_template_file = /opt/airflow/pod_template.yaml

# Namespace to run worker pods in
namespace = airflow

# How often to check for pod status changes
worker_pods_pending_timeout = 300    # 5 min before marking pending pod as failed
worker_pods_pending_timeout_check_interval = 30

# Delete completed pods (saves resources, loses logs)
delete_worker_pods = True
delete_worker_pods_on_failure = False    # Keep failed pods for debugging

# Multi-namespace support
multi_namespace_mode = False

# How many pods to create in parallel
worker_pods_creation_batch_size = 1
```

### Scaling Characteristics

| Metric | Value |
|--------|-------|
| Max parallelism | Limited by cluster capacity |
| Horizontal scaling | Yes — Kubernetes auto-scales nodes |
| Resource overhead | Per-pod overhead (~10-30s startup) |
| Setup complexity | High (requires Kubernetes cluster) |
| Cold start time | 30-120 seconds per task |
| Resource efficiency | High (pay only for what you use) |

---

## 8. CeleryKubernetesExecutor — The Hybrid Approach

### What It Is

Introduced in Airflow 2.0, this executor **combines CeleryExecutor and KubernetesExecutor**. Tasks routed to the `kubernetes` queue run as Kubernetes pods; everything else runs on Celery workers.

### Architecture

```mermaid
graph TB
    subgraph "Control Plane"
        SCH["🧠 Scheduler"]
        CKE["⚙️ CeleryKubernetesExecutor"]
    end
    
    subgraph "Celery Path (default queue)"
        BROKER["📬 Redis Broker"]
        CW1["👷 Celery Worker 1"]
        CW2["👷 Celery Worker 2"]
    end
    
    subgraph "Kubernetes Path (kubernetes queue)"
        K8S["☸️ K8s API"]
        POD1["📦 Pod: heavy-task"]
        POD2["📦 Pod: gpu-task"]
    end
    
    DB["🗄️ Metadata DB"]

    SCH --> CKE
    CKE -->|"queue='default'"| BROKER
    BROKER --> CW1 & CW2
    CKE -->|"queue='kubernetes'"| K8S
    K8S --> POD1 & POD2
    CW1 & CW2 --> DB
    POD1 & POD2 --> DB

    style CKE fill:#9b59b6,color:#fff
    style BROKER fill:#e74c3c,color:#fff
    style K8S fill:#326CE5,color:#fff
```

### How It Works Internally

```python
# Simplified internal logic
class CeleryKubernetesExecutor(BaseExecutor):
    """Routes tasks to either Celery or Kubernetes based on queue name."""
    
    KUBERNETES_QUEUE = "kubernetes"  # configurable
    
    def __init__(self):
        self.celery_executor = CeleryExecutor()
        self.kubernetes_executor = KubernetesExecutor()
    
    def queue_command(self, task_instance, command, priority, queue):
        if queue == self.KUBERNETES_QUEUE:
            self.kubernetes_executor.queue_command(
                task_instance, command, priority, queue
            )
        else:
            self.celery_executor.queue_command(
                task_instance, command, priority, queue
            )
    
    def heartbeat(self):
        self.celery_executor.heartbeat()
        self.kubernetes_executor.heartbeat()
```

### Production Usage Pattern

```python
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime

with DAG("hybrid_pipeline", start_date=datetime(2024, 1, 1)) as dag:
    
    # Fast, frequent tasks → Celery (instant start, always-on workers)
    check_api = PythonOperator(
        task_id="check_api_health",
        python_callable=check_api_status,
        queue="default",  # → CeleryExecutor
    )
    
    extract_data = PythonOperator(
        task_id="extract_data",
        python_callable=extract_from_api,
        queue="default",  # → CeleryExecutor
    )
    
    # Heavy, infrequent task → Kubernetes (isolated, custom resources)
    train_model = PythonOperator(
        task_id="train_model",
        python_callable=train_ml_model,
        queue="kubernetes",  # → KubernetesExecutor
        executor_config={
            "pod_override": k8s.V1Pod(
                spec=k8s.V1PodSpec(
                    containers=[k8s.V1Container(
                        name="base",
                        image="ml-training:latest",
                        resources=k8s.V1ResourceRequirements(
                            requests={"memory": "32Gi", "nvidia.com/gpu": "2"},
                        ),
                    )],
                )
            ),
        },
    )
    
    # Results back to Celery
    publish_results = PythonOperator(
        task_id="publish_results",
        python_callable=publish_to_dashboard,
        queue="default",  # → CeleryExecutor
    )
    
    check_api >> extract_data >> train_model >> publish_results
```

### When to Use

- ✅ Majority of tasks are lightweight but some need heavy/isolated resources
- ✅ You want near-instant task start for most tasks (Celery) but flexibility for special tasks (K8s)
- ✅ ML pipelines where training needs GPU pods but pre/post processing doesn't
- ✅ Gradual migration from CeleryExecutor to KubernetesExecutor

### Configuration

```ini
# airflow.cfg
[core]
executor = CeleryKubernetesExecutor

[celery_kubernetes_executor]
# The queue name that routes to KubernetesExecutor
kubernetes_queue = kubernetes

[celery]
broker_url = redis://redis:6379/0
result_backend = db+postgresql://airflow:airflow@postgres/airflow
worker_concurrency = 16

[kubernetes_executor]
pod_template_file = /opt/airflow/pod_template.yaml
namespace = airflow
delete_worker_pods = True
```

---

## 9. Executor Comparison Table

| Feature | Sequential | Local | Celery | Kubernetes | CeleryK8s |
|---------|-----------|-------|--------|------------|-----------|
| **Parallelism** | 1 | Multi-process | Multi-machine | Pod per task | Both |
| **Scaling** | None | Vertical only | Horizontal | Auto-scale | Both |
| **Resource Isolation** | None | Process-level | Process-level | Container-level | Both |
| **Cold Start** | None | None | None | 30-120s | Varies |
| **Idle Resources** | Minimal | Moderate | High (workers) | None | Moderate |
| **Setup Complexity** | Zero | Low | Medium-High | High | High |
| **Database** | SQLite OK | PostgreSQL/MySQL | PostgreSQL/MySQL | PostgreSQL/MySQL | PostgreSQL/MySQL |
| **External Dependencies** | None | None | Redis/RabbitMQ | Kubernetes | Redis + K8s |
| **Fault Tolerance** | None | None | Task re-queue | Pod restart | Both |
| **Custom Dependencies** | Shared env | Shared env | Shared env | Per-task image | Both |
| **Cost Efficiency** | N/A | Low | Medium | High | Medium-High |
| **Best For** | Dev/testing | Small teams | Enterprise | Cloud-native | Mixed workloads |

---

## 10. Decision Flowchart — Choosing Your Executor

```mermaid
flowchart TD
    START["🤔 Which executor<br/>should I use?"] --> Q1{"Are you just<br/>learning/testing?"}
    
    Q1 -->|Yes| SEQ["✅ SequentialExecutor<br/>Zero setup, just learn"]
    Q1 -->|No| Q2{"Do you need to<br/>scale beyond 1 machine?"}
    
    Q2 -->|No| Q3{"More than ~50<br/>concurrent tasks?"}
    Q3 -->|No| LOCAL["✅ LocalExecutor<br/>Simple, effective"]
    Q3 -->|Yes| Q2A{"Can you get a<br/>bigger machine?"}
    Q2A -->|Yes| LOCAL
    Q2A -->|No| Q2
    
    Q2 -->|Yes| Q4{"Do you have<br/>Kubernetes?"}
    
    Q4 -->|No| CELERY["✅ CeleryExecutor<br/>Proven, scalable"]
    Q4 -->|Yes| Q5{"Do tasks need<br/>different dependencies/<br/>resources?"}
    
    Q5 -->|Not really| Q6{"Is cold-start latency<br/>acceptable? (30-120s)"}
    Q6 -->|Yes| K8S["✅ KubernetesExecutor<br/>Clean, efficient"]
    Q6 -->|No| CELERY
    
    Q5 -->|Yes| Q7{"Are MOST tasks<br/>lightweight?"}
    Q7 -->|Yes| CK8S["✅ CeleryKubernetesExecutor<br/>Best of both worlds"]
    Q7 -->|No| K8S

    style SEQ fill:#95a5a6,color:#fff
    style LOCAL fill:#f39c12,color:#fff
    style CELERY fill:#3498db,color:#fff
    style K8S fill:#2ecc71,color:#fff
    style CK8S fill:#9b59b6,color:#fff
```

---

## 11. Configuration Deep Dive

### Global Parallelism Settings (Apply to All Executors)

```ini
# airflow.cfg [core] section

# Maximum number of task instances running simultaneously across ALL DAGs
# This is the global ceiling — no executor can exceed this
parallelism = 32

# Maximum task instances allowed to run per DAG
dag_concurrency = 16

# Maximum number of active DAG runs per DAG
max_active_runs_per_dag = 16

# Maximum number of tasks that can be in the 'queued' state
max_queued_runs_per_dag = 16
```

### How These Settings Interact

```mermaid
graph TD
    subgraph "Parallelism Hierarchy"
        P["parallelism = 32<br/>(Global max across ALL DAGs)"]
        DC1["dag_concurrency = 16<br/>(Max tasks per DAG)"]
        DC2["dag_concurrency = 16<br/>(Max tasks per DAG)"]
        TP["task pool slots<br/>(Limits specific task groups)"]
    end

    P --> DC1
    P --> DC2
    DC1 --> TP
    DC2 --> TP

    style P fill:#e74c3c,color:#fff
    style DC1 fill:#3498db,color:#fff
    style DC2 fill:#3498db,color:#fff
```

> **⚠️ Warning:** If `parallelism = 32` and you have 10 DAGs each with `dag_concurrency = 16`, you won't get 160 parallel tasks. The global `parallelism` always wins.

### Environment Variables Override

All Airflow config can be set via environment variables:

```bash
# Pattern: AIRFLOW__<SECTION>__<KEY>
export AIRFLOW__CORE__EXECUTOR=CeleryExecutor
export AIRFLOW__CORE__PARALLELISM=64
export AIRFLOW__CELERY__BROKER_URL=redis://redis:6379/0
export AIRFLOW__CELERY__WORKER_CONCURRENCY=16
```

---

## 12. Production Scenarios

### Scenario 1: E-Commerce Company — CeleryExecutor

**Company Profile:** Mid-size e-commerce, 200 DAGs, 3000 tasks/day

```mermaid
graph TB
    subgraph "Airflow Cluster"
        SCH["2x Scheduler<br/>(HA mode)"]
        WEB["2x Web Server<br/>(behind LB)"]
    end
    
    subgraph "Message Layer"
        REDIS["Redis Cluster<br/>(3 nodes, Sentinel)"]
    end
    
    subgraph "Worker Pool"
        DEFAULT["4x Default Workers<br/>(4 vCPU, 8GB each)"]
        ETL["2x ETL Workers<br/>(8 vCPU, 32GB each)"]
        REPORT["1x Report Worker<br/>(4 vCPU, 16GB)"]
    end
    
    DB["RDS PostgreSQL<br/>(Multi-AZ)"]

    SCH --> REDIS
    REDIS --> DEFAULT & ETL & REPORT
    DEFAULT & ETL & REPORT --> DB
    SCH --> DB
    WEB --> DB
```

### Scenario 2: FinTech Company — KubernetesExecutor

**Company Profile:** FinTech startup, 50 DAGs, strict resource isolation, variable workloads

```mermaid
graph TB
    subgraph "EKS Cluster"
        subgraph "System Namespace"
            SCH["Scheduler Pod"]
            WEB["Web Server Pod"]
        end
        
        subgraph "Worker Namespace (dynamic)"
            W1["Extract Pod<br/>256MB, 0.25 CPU"]
            W2["Transform Pod<br/>4GB, 2 CPU"]
            W3["ML Pod<br/>32GB, 8 CPU, 1 GPU"]
        end
        
        subgraph "Cluster Autoscaler"
            CA["Karpenter<br/>Auto-provisions nodes"]
        end
    end
    
    RDS["RDS PostgreSQL"]

    SCH -->|"Creates pods"| W1 & W2 & W3
    CA -->|"Scales nodes for pods"| W1 & W2 & W3
    W1 & W2 & W3 --> RDS

    style W1 fill:#2ecc71,color:#fff
    style W2 fill:#f39c12,color:#fff
    style W3 fill:#e74c3c,color:#fff
```

### Scenario 3: Large Enterprise — CeleryKubernetesExecutor

**Company Profile:** Fortune 500, 1000+ DAGs, mixed workloads, ML + ETL

```python
"""
Architecture Decision Record:
- 90% of tasks are lightweight ETL (< 5 min, < 1GB RAM) → Celery
- 10% of tasks are ML training (30 min+, 32GB+ RAM, GPU) → Kubernetes
- Celery gives us instant start for the 90%
- Kubernetes gives us isolation and GPU access for the 10%
"""
```

---

## 13. Troubleshooting

### Problem 1: Tasks Stuck in "Queued" State

| Aspect | Detail |
|--------|--------|
| **Symptom** | Tasks show as "queued" in the UI but never transition to "running" |
| **Root Cause** | Usually a parallelism limit or worker connectivity issue |
| **Diagnosis** | Check `parallelism`, `dag_concurrency`, pool slots, and worker status |

```bash
# Check if workers are connected (CeleryExecutor)
airflow celery worker --help
celery -A airflow.executors.celery_executor.app inspect active

# Check Kubernetes pods (KubernetesExecutor)
kubectl get pods -n airflow -l app=airflow-worker
kubectl describe pod <pod-name> -n airflow

# Check parallelism limits
airflow config get-value core parallelism
airflow config get-value core dag_concurrency
```

### Problem 2: CeleryExecutor — Workers Not Picking Up Tasks

| Aspect | Detail |
|--------|--------|
| **Symptom** | Tasks are queued in Redis/RabbitMQ but workers don't execute them |
| **Root Cause** | Queue name mismatch, worker not listening on right queue, or broker connectivity |
| **Fix** | Verify queue names match between DAG and worker startup |

```bash
# Check what queues workers are listening on
celery -A airflow.executors.celery_executor.app inspect active_queues

# Check queue depth in Redis
redis-cli LLEN default  # Should show number of pending tasks

# Start worker on the correct queue
airflow celery worker --queues default,high_memory
```

### Problem 3: KubernetesExecutor — Pods in "Pending" State

| Aspect | Detail |
|--------|--------|
| **Symptom** | Worker pods stay in Pending state, tasks never start |
| **Root Cause** | Insufficient cluster resources, node pool at capacity, or scheduling constraints |
| **Fix** | Check node resources, pod resource requests, and autoscaler configuration |

```bash
# Diagnose pending pods
kubectl describe pod <worker-pod> -n airflow
# Look for "Events" section — it will tell you why scheduling failed

# Common reasons:
# - "Insufficient cpu" → nodes are full
# - "Insufficient memory" → nodes are full  
# - "node(s) had taint" → tolerations don't match
# - "no nodes available" → cluster autoscaler too slow

# Quick fix: check node capacity
kubectl top nodes
kubectl get nodes -o custom-columns=NAME:.metadata.name,CPU:.status.capacity.cpu,MEM:.status.capacity.memory
```

### Problem 4: LocalExecutor — "Too Many Open Files"

| Aspect | Detail |
|--------|--------|
| **Symptom** | `OSError: [Errno 24] Too many open files` |
| **Root Cause** | Each worker process opens file descriptors for DB, logs, etc. |
| **Fix** | Increase OS file descriptor limit |

```bash
# Check current limit
ulimit -n

# Increase (temporary)
ulimit -n 65535

# Increase (permanent) - add to /etc/security/limits.conf
# airflow soft nofile 65535
# airflow hard nofile 65535
```

---

## 14. Performance Considerations

### Executor Startup Overhead

```mermaid
graph LR
    subgraph "Time from Queued to Running"
        SEQ["Sequential<br/>~0ms"]
        LOC["Local<br/>~10-50ms"]
        CEL["Celery<br/>~50-200ms"]
        K8S["Kubernetes<br/>~30-120s"]
    end

    SEQ --> LOC --> CEL --> K8S

    style SEQ fill:#2ecc71,color:#fff
    style LOC fill:#27ae60,color:#fff
    style CEL fill:#f39c12,color:#fff
    style K8S fill:#e74c3c,color:#fff
```

### KubernetesExecutor Optimization Tips

```yaml
# 1. Use image pull policy "IfNotPresent" to cache images on nodes
imagePullPolicy: IfNotPresent

# 2. Set resource requests close to actual usage (better bin-packing)
resources:
  requests:
    memory: "512Mi"    # What you actually need
    cpu: "250m"
  limits:
    memory: "1Gi"      # Upper bound
    cpu: "500m"

# 3. Use Karpenter or Cluster Autoscaler with proper config
# Scale-up time: ~90s for new nodes
# Pre-warm nodes if you know peak times
```

### CeleryExecutor Optimization Tips

```ini
# 1. Use Redis over RabbitMQ for simpler setups (lower latency)
broker_url = redis://redis:6379/0

# 2. Set prefetch_multiplier to 1 for long-running tasks
# (prevents one worker from hoarding tasks)
worker_prefetch_multiplier = 1

# 3. Set ack_late = True for task redelivery on worker crash
worker_ack_late = True

# 4. Tune concurrency based on task profile
# CPU-bound tasks: concurrency = number of CPUs
# I/O-bound tasks: concurrency = 2-4x number of CPUs
worker_concurrency = 16
```

### Database Connection Pool Sizing

Every executor's workers connect to the metadata DB. Size your connection pool accordingly:

```
# Formula for max connections needed:
# LocalExecutor:  parallelism + scheduler + webserver ≈ 40-60
# CeleryExecutor: (workers × concurrency) + scheduler + webserver ≈ 100-200
# K8sExecutor:    peak_concurrent_pods + scheduler + webserver ≈ varies

# PostgreSQL: set max_connections accordingly
# Add PgBouncer for connection pooling in production
```

---

## 15. Common Mistakes

### Mistake 1: Using SequentialExecutor in Production

```python
# ❌ DON'T — This is the default and many teams forget to change it
# airflow.cfg
# executor = SequentialExecutor  # DEFAULT — only 1 task at a time!

# ✅ DO — Explicitly set a production executor
# executor = LocalExecutor       # Minimum for production
```

### Mistake 2: Setting parallelism Too High with LocalExecutor

```python
# ❌ DON'T — Your 4-core machine can't handle 128 parallel processes
# parallelism = 128

# ✅ DO — Set it based on your actual CPU/RAM
# parallelism = 32  # ~8x CPU cores for I/O-bound tasks
```

### Mistake 3: Not Setting worker_ack_late with CeleryExecutor

```ini
# ❌ Default: task is acked (acknowledged) when RECEIVED by worker
# If worker crashes mid-execution, the task is LOST
# worker_ack_late = False

# ✅ Better: task is acked when COMPLETED
# If worker crashes, task is re-queued to another worker
worker_ack_late = True
```

### Mistake 4: Ignoring Pod Startup Time with KubernetesExecutor

```python
# ❌ DON'T — Set a 60s execution_timeout for a task that needs
# 30-60s just for pod startup
# execution_timeout=timedelta(seconds=60)

# ✅ DO — Account for pod startup time
# execution_timeout=timedelta(minutes=10)  # Actual task is 5 min + 2 min startup buffer
```

### Mistake 5: Not Configuring Log Persistence with KubernetesExecutor

```yaml
# ❌ Pods are deleted after completion → logs are gone!
# delete_worker_pods = True  (default)

# ✅ DO — Use remote logging (S3, GCS, etc.)
# airflow.cfg
# [logging]
# remote_logging = True
# remote_base_log_folder = s3://my-bucket/airflow-logs
```

---

## 16. Interview Questions

### Beginner Level

**Q1: What is an executor in Airflow? Why do we need different executors?**

> **A:** An executor is the mechanism that actually runs task instances. The scheduler decides *what* to run; the executor decides *how* and *where*. Different executors exist because organizations have different scale, isolation, and infrastructure requirements. A startup on one server uses LocalExecutor, while a Fortune 500 on Kubernetes uses KubernetesExecutor.

**Q2: Can you use SQLite with CeleryExecutor?**

> **A:** No. SQLite does not support concurrent writes, which is required when multiple workers update task states simultaneously. CeleryExecutor requires PostgreSQL or MySQL. Only SequentialExecutor supports SQLite (because it runs one task at a time).

**Q3: What happens if a Celery worker crashes while running a task?**

> **A:** It depends on the `worker_ack_late` setting. If `True`, the task message is still in the broker and will be redelivered to another worker. If `False` (default), the task message was already acknowledged when the worker received it, so it's lost and the task will show as "failed" after a timeout.

### Intermediate Level

**Q4: Explain the difference between `parallelism` and `dag_concurrency` and `worker_concurrency`.**

> **A:**
> - `parallelism` (core): Global maximum number of task instances that can run simultaneously across the *entire* Airflow installation. This is the ultimate ceiling.
> - `dag_concurrency` / `max_active_tasks_per_dag` (core): Maximum number of task instances that can run for a *single* DAG at the same time. This prevents one DAG from consuming all slots.
> - `worker_concurrency` (celery): Number of tasks a *single Celery worker process* can run concurrently. This is per-worker.
>
> They form a hierarchy: `parallelism` ≥ sum of all running tasks ≥ any single DAG's `dag_concurrency`.

**Q5: Why does KubernetesExecutor have a cold-start problem, and how do you mitigate it?**

> **A:** Each task creates a new Kubernetes pod, which involves: pulling the Docker image (if not cached), scheduling to a node, starting the container, and initializing Airflow. This adds 30-120 seconds of overhead. Mitigation strategies:
> 1. Use `imagePullPolicy: IfNotPresent` to cache images on nodes
> 2. Pre-pull images using DaemonSets
> 3. Use lightweight base images
> 4. Ensure cluster autoscaler is tuned for fast node provisioning
> 5. For latency-sensitive tasks, use CeleryKubernetesExecutor and route them to Celery

**Q6: How does CeleryExecutor's queue routing work?**

> **A:** Tasks can be assigned to named queues (e.g., `default`, `high_memory`, `gpu`) using the `queue` parameter in operators. Workers are started with `--queues` flag specifying which queues they listen to. The message broker (Redis/RabbitMQ) routes task messages to the correct queue, and only workers listening on that queue will pick them up. This enables heterogeneous worker pools — e.g., GPU-enabled workers only get GPU tasks.

### Advanced Level

**Q7: You're running CeleryExecutor with 10 workers, each with concurrency 16, but you're seeing only 32 tasks running at a time. What's wrong?**

> **A:** The bottleneck is likely the global `parallelism` setting in `airflow.cfg`. Even though you have capacity for 160 concurrent tasks (10 × 16), if `parallelism = 32`, only 32 tasks can run at a time across the entire installation. Other possibilities:
> - `dag_concurrency` is limiting tasks per DAG
> - Pool slot limits are reached
> - The scheduler's `max_active_tasks_per_dag` is too low
> - The scheduler itself is overwhelmed (check `scheduler_heartbeat_sec`)

**Q8: Design an executor strategy for a company with: 2000 lightweight ETL tasks/hour, 50 ML training tasks/day (each needing 32GB RAM and GPU), and a requirement for 99.9% uptime.**

> **A:** I'd recommend CeleryKubernetesExecutor:
> - **Celery path** for the 2000 lightweight ETL tasks: 5 worker machines, each with 16 concurrency = 80 parallel slots. With tasks averaging 2 minutes, throughput = 80 × 30 = 2400 tasks/hour. Use Redis Sentinel for HA broker.
> - **Kubernetes path** for ML tasks: Route to `kubernetes` queue. Pod template with GPU tolerations, 32GB memory request, and node selector for GPU nodes. Use Karpenter for on-demand GPU node provisioning.
> - **HA**: Run 2 schedulers (Airflow 2.0+ HA), 2 web servers behind a load balancer, PostgreSQL Multi-AZ RDS.
> - **Monitoring**: Celery Flower + Prometheus + Grafana for worker health, queue depth, task duration percentiles.

**Q9: What happens internally when you change executors from LocalExecutor to CeleryExecutor? What breaks?**

> **A:** The DAGs themselves don't change, but the infrastructure around them does significantly:
> 1. **DAG files must be synchronized** across all Celery workers (git-sync, shared NFS, etc.). With LocalExecutor, they're only on one machine.
> 2. **Python dependencies** must be identical on all workers. Version mismatches cause subtle bugs.
> 3. **Logs** are now on different machines — you need remote logging (S3/GCS) or a shared filesystem.
> 4. **Connections and Variables** are in the DB (already shared), so they work.
> 5. **File paths** referenced in tasks must be accessible from all workers (or use remote storage).
> 6. You need to deploy and manage a **message broker** (Redis/RabbitMQ).
> 7. **XCom** values stored in the metadata DB work fine, but any task that writes to local disk and expects the next task to read it will break.

**Q10: Compare the operational cost of running 500 tasks/hour on CeleryExecutor vs KubernetesExecutor on AWS.**

> **A:** This is a nuanced comparison:
> - **CeleryExecutor**: Need always-on workers. If tasks average 3 minutes, you need ~25 concurrent slots. With 4 workers at 8 concurrency each = 32 slots. Cost: 4 × m5.xlarge ($0.192/hr) + 1 Redis (cache.m5.large, $0.156/hr) = ~$0.93/hr = ~$670/month. Workers run 24/7 even during low-traffic hours.
> - **KubernetesExecutor**: Pay per pod. 500 tasks/hr × 3 min avg = ~25 concurrent pods. Using Fargate at ~$0.04/pod/hr = $1.00/hr during peak. But during off-hours (say 8 hours of low traffic at 100 tasks/hr), cost drops proportionally. Monthly estimate: ~$500-600. Plus cluster control plane ($72/month).
> - **Verdict**: KubernetesExecutor is cheaper *if* workloads are bursty with clear off-peak hours. CeleryExecutor is cheaper *if* workloads are steady 24/7 due to lower per-task overhead.

---

**[← Previous: 05-scheduler.md](05-scheduler.md) | [Home](../README.md) | [Next →: 07-operators.md](07-operators.md)**
