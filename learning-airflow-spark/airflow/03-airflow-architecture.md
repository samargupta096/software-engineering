# Airflow Architecture

> **"You can't debug a system you don't understand. You can't scale a system you can't see."**

This is one of the most important chapters in your Airflow journey. Understanding the architecture isn't just academic — it's the difference between confidently debugging a stuck pipeline at 3 AM and blindly restarting services hoping something works.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Real-World Analogy: The Restaurant Kitchen](#real-world-analogy-the-restaurant-kitchen)
- [Component Deep Dive](#component-deep-dive)
  - [Web Server](#1-web-server)
  - [Scheduler](#2-scheduler)
  - [Executor](#3-executor)
  - [Workers](#4-workers)
  - [Metadata Database](#5-metadata-database)
  - [DAG Processor](#6-dag-processor)
  - [Triggerer](#7-triggerer)
- [How Components Communicate](#how-components-communicate)
- [Message Queues: Redis and RabbitMQ](#message-queues-redis-and-rabbitmq)
- [API Architecture](#api-architecture)
- [Filesystem Requirements](#filesystem-requirements)
- [Deployment Models](#deployment-models)
- [Production Architecture Examples](#production-architecture-examples)
- [Troubleshooting Architecture Issues](#troubleshooting-architecture-issues)
- [Performance Considerations](#performance-considerations)
- [Common Mistakes](#common-mistakes)
- [Interview Questions](#interview-questions)

---

## Architecture Overview

### The 30-Second Picture

At its core, Airflow has **seven** major components that work together:

```mermaid
graph TB
    USER["👤 User / Developer"] -->|"writes DAGs"| DAGFOLDER["📁 DAG Folder<br/>(Filesystem)"]
    USER -->|"views UI"| WEBSERVER["🌐 Web Server<br/>(Flask + Gunicorn)"]

    DAGFOLDER -->|"parsed by"| DAGPROC["⚙️ DAG Processor"]
    DAGPROC -->|"serializes to"| METADB["🗄️ Metadata DB<br/>(PostgreSQL)"]

    WEBSERVER -->|"reads from"| METADB

    SCHEDULER["🕐 Scheduler"] -->|"reads DAGs from"| METADB
    SCHEDULER -->|"creates DagRuns<br/>schedules TaskInstances"| METADB
    SCHEDULER -->|"sends tasks to"| EXECUTOR["⚡ Executor"]

    EXECUTOR -->|"distributes to"| WORKERS["👷 Workers"]
    EXECUTOR -->|"updates state"| METADB
    WORKERS -->|"update state"| METADB
    WORKERS -->|"read DAGs from"| DAGFOLDER

    TRIGGERER["🔔 Triggerer"] -->|"monitors deferred<br/>tasks"| METADB

    style WEBSERVER fill:#4ecdc4,color:#fff
    style SCHEDULER fill:#017cee,color:#fff
    style EXECUTOR fill:#ff6b6b,color:#fff
    style WORKERS fill:#ffd93d,color:#333
    style METADB fill:#6bcb77,color:#fff
    style DAGPROC fill:#45b7d1,color:#fff
    style TRIGGERER fill:#ff9a3c,color:#fff
    style DAGFOLDER fill:#dfe6e9,color:#333
```

### The Mental Model

Think of these components in three layers:

```mermaid
graph TB
    subgraph "Layer 1: User Interface"
        WEB["Web Server<br/>(what humans see)"]
        API["REST API<br/>(what programs call)"]
        CLI["CLI<br/>(what engineers use)"]
    end

    subgraph "Layer 2: Brain"
        SCHED["Scheduler<br/>(makes decisions)"]
        DAGP["DAG Processor<br/>(understands DAGs)"]
        TRIG["Triggerer<br/>(watches for events)"]
    end

    subgraph "Layer 3: Muscles"
        EXEC["Executor<br/>(distributes work)"]
        WORK["Workers<br/>(do the work)"]
    end

    subgraph "Layer 0: Memory"
        DB["Metadata Database<br/>(source of truth)"]
    end

    WEB --> DB
    API --> DB
    SCHED --> DB
    DAGP --> DB
    EXEC --> DB
    WORK --> DB

    SCHED --> EXEC --> WORK

    style DB fill:#6bcb77,color:#fff
    style SCHED fill:#017cee,color:#fff
    style EXEC fill:#ff6b6b,color:#fff
```

---

## Real-World Analogy: The Restaurant Kitchen

```mermaid
graph TB
    subgraph "🍽️ Restaurant = Airflow System"
        CUSTOMER["👤 Customer<br/>(User)"]
        WAITER["🧑‍🍳 Waiter<br/>(Web Server)"]
        HEADCHEF["👨‍🍳 Head Chef<br/>(Scheduler)"]
        RECIPE["📋 Recipe Book<br/>(DAG Files)"]
        KITCHEN["🏪 Kitchen Manager<br/>(Executor)"]
        COOKS["👷 Line Cooks<br/>(Workers)"]
        ORDERBOARD["📊 Order Board<br/>(Metadata DB)"]
        SUPPLIER["📞 Supplier Caller<br/>(Triggerer)"]
    end

    CUSTOMER -->|"places order"| WAITER
    WAITER -->|"writes order"| ORDERBOARD
    HEADCHEF -->|"reads recipes"| RECIPE
    HEADCHEF -->|"checks orders"| ORDERBOARD
    HEADCHEF -->|"assigns tasks"| KITCHEN
    KITCHEN -->|"dispatches to"| COOKS
    COOKS -->|"updates status"| ORDERBOARD
    SUPPLIER -->|"notifies when<br/>ingredients arrive"| ORDERBOARD

    style HEADCHEF fill:#017cee,color:#fff
    style KITCHEN fill:#ff6b6b,color:#fff
    style COOKS fill:#ffd93d,color:#333
    style ORDERBOARD fill:#6bcb77,color:#fff
```

| Restaurant | Airflow | Purpose |
|-----------|---------|---------|
| Customer | User/Developer | Requests work |
| Waiter | Web Server | Interface between customer and kitchen |
| Recipe Book | DAG Files | Instructions for what to make |
| Head Chef | Scheduler | Decides what gets cooked when |
| Kitchen Manager | Executor | Dispatches work to available cooks |
| Line Cooks | Workers | Actually prepare the food |
| Order Board | Metadata DB | Tracks status of every order |
| Supplier Caller | Triggerer | Waits for ingredients (external events) |

---

## Component Deep Dive

### 1. Web Server

> **What it is:** A Flask application served by Gunicorn that provides the Airflow UI and REST API.

```mermaid
graph TB
    subgraph "Web Server Architecture"
        GUNICORN["Gunicorn<br/>(WSGI Server)"]
        FLASK["Flask App<br/>(Application Logic)"]
        JINJA["Jinja Templates<br/>(UI Rendering)"]
        RBAC["Flask-AppBuilder<br/>(Auth & RBAC)"]
        API_MOD["REST API Module<br/>(Programmatic Access)"]

        GUNICORN --> FLASK
        FLASK --> JINJA
        FLASK --> RBAC
        FLASK --> API_MOD
    end

    BROWSER["🌐 Browser"] --> GUNICORN
    SCRIPTS["📜 Scripts/CI"] --> API_MOD
    FLASK --> DB["🗄️ Metadata DB"]

    style GUNICORN fill:#4ecdc4,color:#fff
    style FLASK fill:#45b7d1,color:#fff
    style DB fill:#6bcb77,color:#fff
```

#### What It Does

- Renders the DAG list, graph view, tree view, calendar view
- Shows task logs (reads from log storage)
- Provides manual DAG triggers, task clearing, and marking
- Serves the REST API for programmatic access
- Handles authentication and role-based access control (RBAC)

#### What It Does NOT Do

- **Does not parse DAG files** (reads serialized DAGs from the database)
- **Does not schedule tasks** (that's the Scheduler's job)
- **Does not execute tasks** (that's the Worker's job)
- **Does not store data** (the Metadata DB does)

#### Configuration

```ini
# airflow.cfg - Web Server settings
[webserver]
base_url = http://localhost:8080
web_server_host = 0.0.0.0
web_server_port = 8080
web_server_worker_timeout = 120
worker_refresh_interval = 30

# Gunicorn settings
workers = 4                    # Number of Gunicorn workers
worker_class = sync            # sync or gevent
web_server_master_timeout = 120

# Authentication
authenticate = True
auth_backend = airflow.contrib.auth.backends.password_auth

# RBAC
rbac = True
```

#### Internals: How the Web Server Reads DAGs

```mermaid
sequenceDiagram
    participant B as Browser
    participant WS as Web Server
    participant DB as Metadata DB

    B->>WS: GET /dags/my_dag/graph
    WS->>DB: SELECT * FROM serialized_dag WHERE dag_id = 'my_dag'
    DB-->>WS: Serialized DAG JSON
    WS->>WS: Deserialize DAG structure
    WS->>DB: SELECT * FROM dag_run WHERE dag_id = 'my_dag' ORDER BY ...
    DB-->>WS: Recent DAG runs with task instance states
    WS->>WS: Render graph with task states
    WS-->>B: HTML page with DAG graph
```

> **💡 Key Insight (Airflow 2.x):** The Web Server never reads DAG files directly. It reads **serialized DAGs** from the database. This is why DAG serialization exists — it decouples the Web Server from the filesystem. Before serialization (Airflow 1.x), the Web Server had to parse every DAG file, which was slow and required access to the DAG folder.

### 2. Scheduler

> **What it is:** The brain of Airflow. A continuously running process that decides what tasks to run and when.

```mermaid
graph TB
    subgraph "Scheduler Internals"
        LOOP["Scheduler Loop<br/>(runs continuously)"]
        
        LOOP --> PARSE["1. Parse/Read DAGs"]
        PARSE --> CREATE["2. Create DagRuns<br/>(based on schedule)"]
        CREATE --> SCHEDULE["3. Schedule TaskInstances<br/>(check dependencies)"]
        SCHEDULE --> SEND["4. Send to Executor<br/>(queue for execution)"]
        SEND --> HEARTBEAT["5. Heartbeat<br/>(check health)"]
        HEARTBEAT --> LOOP
    end

    PARSE --> DB["🗄️ Metadata DB"]
    CREATE --> DB
    SCHEDULE --> DB
    SEND --> EXEC["⚡ Executor"]

    style LOOP fill:#017cee,color:#fff
    style DB fill:#6bcb77,color:#fff
    style EXEC fill:#ff6b6b,color:#fff
```

#### The Scheduler Loop (Detailed)

Every scheduler loop iteration performs these steps:

1. **Parse DAGs**: Read DAG files from the DAG folder (via DAG Processor), update serialized DAGs in the database
2. **Create DagRuns**: For each active DAG, check if a new DagRun should be created based on the schedule
3. **Examine TaskInstances**: For each DagRun, look at task instances and determine if their dependencies are met
4. **Schedule Tasks**: Move task instances from `None` → `scheduled` state when their dependencies are met
5. **Queue Tasks**: Move task instances from `scheduled` → `queued` and send them to the Executor
6. **Process Executor Events**: Check for task completions/failures from the Executor
7. **Handle Zombies**: Detect tasks that appear to be running but have no heartbeat

#### Key Configuration

```ini
[scheduler]
# How often (seconds) to scan the DAG directory for new files
dag_dir_list_interval = 300

# Minimum seconds between re-parsing a DAG file
min_file_process_interval = 30

# How many seconds between scheduler heartbeats
scheduler_heartbeat_sec = 5

# How many tasks the scheduler can create per loop
max_tis_per_query = 512

# Number of DAGs to process in parallel
parsing_processes = 2

# Zombie detection threshold
scheduler_zombie_task_threshold = 300
```

We'll explore the scheduler in extreme depth in [Chapter 5: The Scheduler Deep Dive](05-scheduler.md).

### 3. Executor

> **What it is:** The mechanism that defines *how* tasks are executed. The executor is an abstraction layer between the scheduler and the workers.

```mermaid
graph TB
    SCHED["Scheduler"] --> EXEC{"Executor Type?"}
    
    EXEC -->|"SequentialExecutor"| SEQ["Single Process<br/>(dev only)"]
    EXEC -->|"LocalExecutor"| LOCAL["Local Subprocesses<br/>(single machine)"]
    EXEC -->|"CeleryExecutor"| CELERY["Celery Workers<br/>(distributed)"]
    EXEC -->|"KubernetesExecutor"| K8S["Kubernetes Pods<br/>(cloud native)"]
    EXEC -->|"CeleryKubernetesExecutor"| HYBRID["Celery + K8s<br/>(hybrid)"]

    style SCHED fill:#017cee,color:#fff
    style SEQ fill:#dfe6e9,color:#333
    style LOCAL fill:#ffd93d,color:#333
    style CELERY fill:#ff6b6b,color:#fff
    style K8S fill:#4ecdc4,color:#fff
    style HYBRID fill:#45b7d1,color:#fff
```

#### Executor Comparison

| Executor | Workers | Scalability | Use Case | Message Queue |
|----------|---------|------------|----------|---------------|
| **SequentialExecutor** | Same process as scheduler | None | Development, testing | None |
| **LocalExecutor** | Subprocesses on scheduler machine | Limited to 1 machine | Small teams, < 50 DAGs | None |
| **CeleryExecutor** | Celery workers on separate machines | Horizontal | Large teams, 100+ DAGs | Redis or RabbitMQ |
| **KubernetesExecutor** | Kubernetes pods (ephemeral) | Massive | Cloud deployments | None (K8s API) |
| **CeleryKubernetesExecutor** | Mix of Celery + K8s | Maximum | Enterprise, mixed workloads | Redis/RabbitMQ + K8s |

#### SequentialExecutor (Development Only)

```mermaid
graph LR
    SCHED["Scheduler"] -->|"runs tasks<br/>one by one"| TASK1["Task 1"]
    TASK1 -->|"then"| TASK2["Task 2"]
    TASK2 -->|"then"| TASK3["Task 3"]
    
    style SCHED fill:#017cee,color:#fff
```

- Tasks run one at a time, in the same process as the scheduler
- **Only suitable for development/testing**
- Uses SQLite as the metadata database
- Cannot run tasks in parallel

#### LocalExecutor

```mermaid
graph TB
    SCHED["Scheduler"] --> EXEC["LocalExecutor"]
    EXEC -->|"subprocess"| P1["Process 1<br/>Task A"]
    EXEC -->|"subprocess"| P2["Process 2<br/>Task B"]
    EXEC -->|"subprocess"| P3["Process 3<br/>Task C"]
    EXEC -->|"subprocess"| P4["Process 4<br/>Task D"]
    
    style SCHED fill:#017cee,color:#fff
    style EXEC fill:#ff6b6b,color:#fff
```

- Tasks run as subprocesses on the same machine as the scheduler
- Limited by the resources of that single machine
- Good for small-to-medium workloads
- Requires PostgreSQL or MySQL (not SQLite)

#### CeleryExecutor

```mermaid
graph TB
    SCHED["Scheduler"] --> EXEC["CeleryExecutor"]
    EXEC -->|"enqueues task"| MQ["Message Queue<br/>(Redis / RabbitMQ)"]
    MQ -->|"dequeues"| W1["Worker 1<br/>(Machine A)"]
    MQ -->|"dequeues"| W2["Worker 2<br/>(Machine B)"]
    MQ -->|"dequeues"| W3["Worker 3<br/>(Machine C)"]
    
    W1 -->|"updates state"| DB["🗄️ Metadata DB"]
    W2 -->|"updates state"| DB
    W3 -->|"updates state"| DB

    style SCHED fill:#017cee,color:#fff
    style EXEC fill:#ff6b6b,color:#fff
    style MQ fill:#ffd93d,color:#333
    style DB fill:#6bcb77,color:#fff
```

- Distributed execution across multiple machines
- Requires a message broker (Redis or RabbitMQ)
- Workers are long-running processes that pick up tasks from the queue
- Can scale horizontally by adding more workers
- Most common production executor

#### KubernetesExecutor

```mermaid
graph TB
    SCHED["Scheduler"] --> EXEC["KubernetesExecutor"]
    EXEC -->|"creates Pod"| K8S_API["Kubernetes API"]
    K8S_API -->|"schedules"| POD1["Pod: Task A<br/>(ephemeral)"]
    K8S_API -->|"schedules"| POD2["Pod: Task B<br/>(ephemeral)"]
    K8S_API -->|"schedules"| POD3["Pod: Task C<br/>(ephemeral)"]
    
    POD1 -.->|"dies after<br/>completion"| GONE1["💨"]
    POD2 -.->|"dies after<br/>completion"| GONE2["💨"]
    
    POD1 -->|"updates state"| DB["🗄️ Metadata DB"]
    POD2 -->|"updates state"| DB
    POD3 -->|"updates state"| DB

    style SCHED fill:#017cee,color:#fff
    style EXEC fill:#4ecdc4,color:#fff
    style K8S_API fill:#326ce5,color:#fff
    style POD1 fill:#45b7d1,color:#fff
    style POD2 fill:#45b7d1,color:#fff
    style POD3 fill:#45b7d1,color:#fff
```

- Each task gets its own Kubernetes Pod
- Pods are ephemeral — created for the task, destroyed after completion
- **Perfect isolation** — each task has its own Python environment, dependencies, resources
- **Auto-scaling** — Kubernetes handles pod scheduling and resource allocation
- **Zero resource waste** — no idle workers; pods only exist during task execution
- Slightly higher task startup latency (pod creation takes 5-30 seconds)

### 4. Workers

> **What they are:** The processes that actually execute task code.

```mermaid
graph TB
    subgraph "Worker Process"
        PICK["Pick up task<br/>from queue"]
        SETUP["Set up execution<br/>context"]
        EXECUTE["Execute task<br/>code"]
        LOG["Write logs"]
        REPORT["Report result<br/>to metadata DB"]
        
        PICK --> SETUP --> EXECUTE --> LOG --> REPORT
    end
    
    EXECUTE -->|"runs"| TASK["Your Python Code<br/>or Operator"]
    TASK -->|"may call"| EXT["External System<br/>(Spark, BigQuery, API)"]
    
    REPORT --> DB["🗄️ Metadata DB"]
    LOG --> STORAGE["📝 Log Storage<br/>(Local/S3/GCS)"]

    style EXECUTE fill:#ffd93d,color:#333
    style DB fill:#6bcb77,color:#fff
    style STORAGE fill:#dfe6e9,color:#333
```

#### Worker Types by Executor

| Executor | Worker Type | Lifecycle | Resource Usage |
|----------|------------|-----------|----------------|
| SequentialExecutor | Same process | Permanent | Shared with scheduler |
| LocalExecutor | Subprocess | Per-task | Shared machine |
| CeleryExecutor | Celery worker | Long-running | Dedicated machine(s) |
| KubernetesExecutor | K8s Pod | Per-task (ephemeral) | Dedicated pod |

#### Celery Worker Configuration

```ini
# airflow.cfg
[celery]
broker_url = redis://redis:6379/0
result_backend = db+postgresql://user:pass@postgres:5432/airflow
worker_concurrency = 16       # Tasks per worker
worker_autoscale = 16,8       # Max, Min concurrency
worker_prefetch_multiplier = 1 # Don't prefetch (better for long tasks)

# Start a Celery worker
# airflow celery worker --concurrency 16 --queues default,high_priority
```

### 5. Metadata Database

> **What it is:** The single source of truth for the entire Airflow system. Every component reads from and writes to this database.

```mermaid
graph TB
    subgraph "Metadata Database Tables (Key Ones)"
        DAG_TABLE["dag<br/>DAG definitions"]
        DAGRUN["dag_run<br/>DAG execution instances"]
        TI["task_instance<br/>Task execution instances"]
        SERIAL["serialized_dag<br/>Serialized DAG JSON"]
        LOG_TABLE["log<br/>User action audit"]
        XCOM["xcom<br/>Task communication"]
        CONN["connection<br/>External connections"]
        VAR["variable<br/>Global variables"]
        POOL["slot_pool<br/>Resource pools"]
        TRIGGER["trigger<br/>Deferred task triggers"]
    end

    WEB["Web Server"] --> DAG_TABLE
    WEB --> DAGRUN
    WEB --> TI
    SCHED["Scheduler"] --> DAGRUN
    SCHED --> TI
    WORKERS["Workers"] --> TI
    WORKERS --> XCOM

    style DAG_TABLE fill:#6bcb77,color:#fff
    style DAGRUN fill:#6bcb77,color:#fff
    style TI fill:#6bcb77,color:#fff
```

#### Key Tables Explained

| Table | What It Stores | Size Consideration |
|-------|---------------|-------------------|
| `dag` | One row per DAG (metadata, pause status, etc.) | Small |
| `dag_run` | One row per DAG execution | Grows daily (needs cleanup) |
| `task_instance` | One row per task execution within a DAG run | Grows fast (largest table) |
| `serialized_dag` | Full DAG structure as JSON | Medium |
| `xcom` | Data passed between tasks | Can grow large if abused |
| `log` | Audit log of user actions (UI clicks, API calls) | Grows fast |
| `connection` | Connection details (encrypted) | Small |
| `variable` | Key-value configuration | Small |
| `slot_pool` | Pool definitions and slot counts | Small |

#### Production Database Setup

```python
# airflow.cfg for production PostgreSQL
# NEVER use SQLite in production!

[database]
sql_alchemy_conn = postgresql+psycopg2://airflow:password@postgres-host:5432/airflow
sql_alchemy_pool_size = 10
sql_alchemy_max_overflow = 20
sql_alchemy_pool_recycle = 3600
sql_alchemy_pool_pre_ping = True
```

> **⚠️ Critical Warning:** SQLite is the default, but it **cannot handle concurrent writes**. Any production deployment MUST use PostgreSQL or MySQL. The metadata database is the most critical component — if it goes down, the entire Airflow system stops.

#### Database Maintenance

```sql
-- The task_instance table grows fastest. Clean up old records periodically.
-- Airflow provides a CLI command for this:
-- airflow db clean --clean-before-timestamp "2024-01-01" --yes

-- Or manually:
DELETE FROM task_instance WHERE execution_date < NOW() - INTERVAL '90 days';
DELETE FROM dag_run WHERE execution_date < NOW() - INTERVAL '90 days';
DELETE FROM log WHERE dttm < NOW() - INTERVAL '30 days';

-- XCom can grow unexpectedly large
SELECT dag_id, task_id, pg_size_pretty(sum(length(value::text)))
FROM xcom GROUP BY dag_id, task_id ORDER BY sum(length(value::text)) DESC;
```

### 6. DAG Processor

> **What it is:** The component responsible for parsing Python DAG files and serializing them to the metadata database.

```mermaid
sequenceDiagram
    participant FS as DAG Folder
    participant DP as DAG Processor
    participant DB as Metadata DB

    loop Every min_file_process_interval
        DP->>FS: Scan for .py files
        FS-->>DP: List of DAG files

        loop For each DAG file
            DP->>DP: Import Python module
            DP->>DP: Find DAG objects
            DP->>DP: Validate DAG structure
            DP->>DB: Serialize DAG to database
        end
    end

    Note over DP: Runs as subprocess(es) of the scheduler
```

#### How DAG Parsing Works

```python
# When the DAG Processor encounters your_dag.py:

# Step 1: Python import
import your_dag  # This executes ALL top-level code!

# Step 2: Find DAG objects
dags = [obj for obj in dir(your_dag) 
        if isinstance(getattr(your_dag, obj), DAG)]

# Step 3: For each DAG, serialize to JSON
for dag in dags:
    serialized = dag.to_json()
    db.update_serialized_dag(dag.dag_id, serialized)
```

> **⚠️ Performance Warning:** Every line of code at the top level of your DAG file runs **every time the file is parsed** (every `min_file_process_interval` seconds). This is why heavy imports, API calls, or database queries in DAG files kill scheduler performance.

### 7. Triggerer

> **What it is:** A new component (Airflow 2.2+) that handles deferred tasks — tasks that are waiting for an external event without holding a worker slot.

```mermaid
sequenceDiagram
    participant W as Worker
    participant T as Task
    participant DB as Metadata DB
    participant TR as Triggerer
    participant EXT as External System

    W->>T: Execute task
    T->>T: Need to wait for S3 file...
    T->>DB: Defer self (save Trigger)
    T->>W: Release worker slot ✅
    Note over W: Worker is FREE for other tasks

    TR->>DB: Pick up deferred trigger
    loop Poll external system
        TR->>EXT: Check: does file exist?
        EXT-->>TR: Not yet
        TR->>TR: Wait (async, lightweight)
    end
    TR->>EXT: Check: does file exist?
    EXT-->>TR: Yes! File found
    TR->>DB: Mark trigger as fired
    
    Note over W: Scheduler re-queues the task
    W->>T: Resume task execution
    T->>T: Process the file
```

#### Why the Triggerer Exists

Before the Triggerer, sensors (tasks that wait for events) occupied a worker slot while waiting:

```python
# OLD WAY: Sensor holds a worker slot for hours
wait_for_file = S3KeySensor(
    task_id='wait_for_file',
    bucket_name='data',
    bucket_key='incoming/data.csv',
    timeout=3600 * 6,  # 6 hours of holding a worker slot!
    mode='poke',
)
# This means you need 1 worker slot just for waiting. Wasteful!

# With mode='reschedule', it's better but still has overhead:
wait_for_file = S3KeySensor(
    mode='reschedule',  # Releases slot between pokes, but re-scheduling overhead
)

# NEW WAY: Deferrable operator uses the Triggerer
from airflow.providers.amazon.aws.sensors.s3 import S3KeySensor

wait_for_file = S3KeySensor(
    task_id='wait_for_file',
    bucket_name='data',
    bucket_key='incoming/data.csv',
    deferrable=True,  # Uses the Triggerer - zero worker slot usage while waiting!
)
```

The Triggerer uses **asyncio** to monitor thousands of deferred triggers with minimal resources — a single Triggerer process can handle thousands of waiting tasks.

#### Triggerer Configuration

```ini
[triggerer]
default_capacity = 1000  # Max triggers per triggerer instance
```

---

## How Components Communicate

### Communication Patterns

```mermaid
graph TB
    subgraph "Communication Methods"
        DB_COMM["Database (Primary)<br/>All components read/write"]
        QUEUE_COMM["Message Queue<br/>(CeleryExecutor only)"]
        K8S_COMM["K8s API<br/>(KubernetesExecutor only)"]
        FS_COMM["Filesystem<br/>(DAG files, logs)"]
    end

    WEB["Web Server"] -->|"SQL queries"| DB_COMM
    SCHED["Scheduler"] -->|"SQL queries"| DB_COMM
    WORKERS["Workers"] -->|"SQL queries"| DB_COMM
    
    SCHED -->|"task messages"| QUEUE_COMM
    WORKERS -->|"task pickup"| QUEUE_COMM
    
    SCHED -->|"pod creation"| K8S_COMM

    SCHED -->|"reads DAGs"| FS_COMM
    WORKERS -->|"reads DAGs"| FS_COMM

    style DB_COMM fill:#6bcb77,color:#fff
    style QUEUE_COMM fill:#ffd93d,color:#333
    style K8S_COMM fill:#4ecdc4,color:#fff
    style FS_COMM fill:#dfe6e9,color:#333
```

### The Critical Role of the Database

Every component communicates through the metadata database. This is both a strength and a potential bottleneck:

**Strengths:**
- Single source of truth — no inconsistency between components
- Components can be restarted independently
- State survives component failures

**Weaknesses:**
- Database becomes the bottleneck at scale
- All components need database connectivity
- Database failure = total system failure

```mermaid
sequenceDiagram
    participant S as Scheduler
    participant DB as Metadata DB
    participant W as Worker

    Note over S,W: Task Lifecycle via Database

    S->>DB: UPDATE task_instance SET state='scheduled'
    S->>DB: UPDATE task_instance SET state='queued'
    Note over S: Sends to executor/queue

    W->>DB: UPDATE task_instance SET state='running'
    W->>W: Execute task code
    W->>DB: UPDATE task_instance SET state='success'
    
    S->>DB: SELECT * FROM task_instance WHERE state='success'
    Note over S: Scheduler sees completion, checks dependents
```

---

## Message Queues: Redis and RabbitMQ

When using the CeleryExecutor, a message queue sits between the scheduler and workers.

### Redis as Message Broker

```mermaid
graph LR
    SCHED["Scheduler"] -->|"LPUSH task"| REDIS["Redis<br/>(Message Broker)"]
    REDIS -->|"BRPOP task"| W1["Worker 1"]
    REDIS -->|"BRPOP task"| W2["Worker 2"]
    REDIS -->|"BRPOP task"| W3["Worker 3"]

    style REDIS fill:#dc382d,color:#fff
```

```ini
# airflow.cfg for Redis
[celery]
broker_url = redis://redis-host:6379/0
result_backend = db+postgresql://user:pass@postgres-host:5432/airflow
```

**Pros:** Simple, fast, low latency, easy to set up
**Cons:** Less durable (can lose messages on crash), single-threaded

### RabbitMQ as Message Broker

```mermaid
graph LR
    SCHED["Scheduler"] -->|"publish"| RABBIT["RabbitMQ<br/>(Message Broker)"]
    RABBIT -->|"consume"| W1["Worker 1"]
    RABBIT -->|"consume"| W2["Worker 2"]
    RABBIT -->|"consume"| W3["Worker 3"]

    style RABBIT fill:#ff6600,color:#fff
```

```ini
# airflow.cfg for RabbitMQ
[celery]
broker_url = amqp://user:pass@rabbitmq-host:5672/airflow
result_backend = db+postgresql://user:pass@postgres-host:5432/airflow
```

**Pros:** More durable, supports complex routing, management UI
**Cons:** More complex to set up and maintain, higher resource usage

### Choosing Between Redis and RabbitMQ

| Factor | Redis | RabbitMQ |
|--------|-------|----------|
| **Setup Complexity** | Simple | Moderate |
| **Message Durability** | Configurable | Strong by default |
| **Performance** | Very fast | Fast |
| **Resource Usage** | Low | Moderate |
| **Multi-Queue Routing** | Basic | Advanced |
| **Monitoring** | Basic | Rich management UI |
| **Recommendation** | Default choice, good enough for most | When you need guaranteed delivery |

> **💡 Practical Advice:** Start with Redis. Switch to RabbitMQ only if you need advanced routing (multiple queues with priority) or stronger durability guarantees. 90% of Airflow deployments use Redis.

---

## API Architecture

Airflow provides a REST API for programmatic interaction.

### API Structure

```mermaid
graph TB
    subgraph "Airflow REST API"
        DAGS_EP["/api/v1/dags<br/>List, trigger DAGs"]
        RUNS_EP["/api/v1/dagRuns<br/>Manage DAG runs"]
        TASKS_EP["/api/v1/dags/{dag_id}/tasks<br/>Task details"]
        TI_EP["/api/v1/dags/{dag_id}/dagRuns/{run_id}/taskInstances<br/>Task instances"]
        CONNS_EP["/api/v1/connections<br/>Manage connections"]
        VARS_EP["/api/v1/variables<br/>Manage variables"]
        POOLS_EP["/api/v1/pools<br/>Manage pools"]
        HEALTH_EP["/api/v1/health<br/>Health check"]
    end

    CLIENT["API Client"] --> DAGS_EP
    CLIENT --> RUNS_EP
    CLIENT --> HEALTH_EP

    style CLIENT fill:#017cee,color:#fff
```

### API Usage Examples

```python
import requests

AIRFLOW_API = "http://airflow:8080/api/v1"
AUTH = ("admin", "admin")

# Trigger a DAG run
response = requests.post(
    f"{AIRFLOW_API}/dags/my_dag/dagRuns",
    json={
        "conf": {"key": "value"},
        "logical_date": "2024-01-15T00:00:00Z",
    },
    auth=AUTH,
)

# List all DAG runs
response = requests.get(
    f"{AIRFLOW_API}/dags/my_dag/dagRuns",
    auth=AUTH,
)

# Check system health
response = requests.get(f"{AIRFLOW_API}/health", auth=AUTH)
health = response.json()
# {
#   "metadatabase": {"status": "healthy"},
#   "scheduler": {"status": "healthy", "latest_scheduler_heartbeat": "..."}
# }

# Get task instance logs
response = requests.get(
    f"{AIRFLOW_API}/dags/my_dag/dagRuns/run_123/taskInstances/my_task/logs/1",
    auth=AUTH,
)
```

---

## Filesystem Requirements

### The DAG Folder Problem

All components that parse or execute DAGs need access to the DAG files. This creates a filesystem challenge in distributed deployments:

```mermaid
graph TB
    subgraph "Single Node - Easy"
        S1["Scheduler"] --> FOLDER1["📁 /opt/airflow/dags"]
        W1_1["Worker"] --> FOLDER1
        WEB1["Web Server"] --> FOLDER1
    end
    
    subgraph "Multi Node - Hard"
        S2["Scheduler<br/>(Node 1)"] --> FOLDER2["📁 dags on Node 1"]
        W2_1["Worker<br/>(Node 2)"] --> FOLDER3["📁 dags on Node 2"]
        W2_2["Worker<br/>(Node 3)"] --> FOLDER4["📁 dags on Node 3"]
    end
    
    FOLDER2 -.->|"must be in sync!"| FOLDER3
    FOLDER3 -.->|"must be in sync!"| FOLDER4

    style FOLDER1 fill:#6bcb77,color:#fff
    style FOLDER2 fill:#ff6b6b,color:#fff
    style FOLDER3 fill:#ff6b6b,color:#fff
    style FOLDER4 fill:#ff6b6b,color:#fff
```

### Solutions for DAG File Distribution

| Approach | How It Works | Pros | Cons |
|----------|-------------|------|------|
| **Shared NFS** | Network filesystem mounted on all nodes | Simple, real-time sync | NFS can be slow, single point of failure |
| **Git-Sync** | Sidecar container pulls from Git periodically | Version controlled, no NFS | Slight delay in sync |
| **PersistentVolume (K8s)** | Shared volume in Kubernetes | Native K8s integration | Depends on storage class |
| **S3/GCS Sync** | DAGs stored in object storage, synced to nodes | Durable, scalable | Requires sync mechanism |
| **Baked into Docker Image** | DAGs included in the Airflow container image | Immutable, reproducible | Requires rebuild for every DAG change |

#### Git-Sync Pattern (Most Common in K8s)

```mermaid
graph TB
    GIT["Git Repository<br/>(DAG source of truth)"] --> SYNC1["Git-Sync<br/>Sidecar"]
    GIT --> SYNC2["Git-Sync<br/>Sidecar"]
    GIT --> SYNC3["Git-Sync<br/>Sidecar"]
    
    SYNC1 --> FOLDER1["📁 DAGs on Scheduler"]
    SYNC2 --> FOLDER2["📁 DAGs on Worker 1"]
    SYNC3 --> FOLDER3["📁 DAGs on Worker 2"]

    style GIT fill:#333,color:#fff
    style SYNC1 fill:#ffd93d,color:#333
    style SYNC2 fill:#ffd93d,color:#333
    style SYNC3 fill:#ffd93d,color:#333
```

```yaml
# Kubernetes git-sync sidecar configuration
containers:
  - name: git-sync
    image: registry.k8s.io/git-sync/git-sync:v4.0.0
    args:
      - --repo=https://github.com/company/airflow-dags.git
      - --branch=main
      - --root=/dags
      - --period=60s  # Sync every 60 seconds
    volumeMounts:
      - name: dags
        mountPath: /dags
```

---

## Deployment Models

### Single-Node Deployment

```mermaid
graph TB
    subgraph "Single Machine"
        WEB["Web Server<br/>:8080"]
        SCHED["Scheduler"]
        EXEC["LocalExecutor"]
        W1["Worker Process 1"]
        W2["Worker Process 2"]
        W3["Worker Process 3"]
        DB["PostgreSQL<br/>:5432"]
        DAGS["📁 /opt/airflow/dags"]

        WEB --> DB
        SCHED --> DB
        SCHED --> EXEC
        EXEC --> W1
        EXEC --> W2
        EXEC --> W3
        W1 --> DB
        SCHED --> DAGS
        W1 --> DAGS
    end

    style WEB fill:#4ecdc4,color:#fff
    style SCHED fill:#017cee,color:#fff
    style DB fill:#6bcb77,color:#fff
```

**Best for:** Small teams (< 5 engineers), < 50 DAGs, development/staging environments.

### Multi-Node Celery Deployment

```mermaid
graph TB
    subgraph "Node 1: Core Services"
        WEB["Web Server"]
        SCHED["Scheduler"]
        TRIG["Triggerer"]
    end

    subgraph "Node 2: Database"
        DB["PostgreSQL<br/>(HA with replica)"]
    end

    subgraph "Node 3: Message Broker"
        REDIS["Redis<br/>(with persistence)"]
    end

    subgraph "Node 4-N: Workers"
        W1["Celery Worker 1<br/>(16 slots)"]
        W2["Celery Worker 2<br/>(16 slots)"]
        W3["Celery Worker 3<br/>(16 slots)"]
    end

    subgraph "Shared Storage"
        NFS["NFS / GCS / S3<br/>(DAG files)"]
    end

    WEB --> DB
    SCHED --> DB
    SCHED --> REDIS
    W1 --> REDIS
    W2 --> REDIS
    W3 --> REDIS
    W1 --> DB
    W2 --> DB
    W3 --> DB
    SCHED --> NFS
    W1 --> NFS
    W2 --> NFS
    W3 --> NFS

    style WEB fill:#4ecdc4,color:#fff
    style SCHED fill:#017cee,color:#fff
    style DB fill:#6bcb77,color:#fff
    style REDIS fill:#dc382d,color:#fff
```

**Best for:** Medium-to-large teams, 50-500 DAGs, production workloads.

### Kubernetes Deployment

```mermaid
graph TB
    subgraph "Kubernetes Cluster"
        subgraph "Deployments (always running)"
            WEB_DEP["Web Server<br/>Deployment (2 replicas)"]
            SCHED_DEP["Scheduler<br/>Deployment (2 replicas HA)"]
            TRIG_DEP["Triggerer<br/>Deployment (1 replica)"]
        end

        subgraph "StatefulSets / External"
            DB["PostgreSQL<br/>(Cloud SQL / RDS)"]
        end

        subgraph "Task Pods (ephemeral)"
            POD1["Pod: extract_users<br/>(2 CPU, 4GB RAM)"]
            POD2["Pod: train_model<br/>(8 CPU, 32GB RAM)"]
            POD3["Pod: generate_report<br/>(1 CPU, 2GB RAM)"]
        end

        subgraph "Storage"
            GIT["Git-Sync<br/>(DAG distribution)"]
            GCS["GCS Bucket<br/>(Log storage)"]
        end
    end

    SCHED_DEP -->|"K8s API"| POD1
    SCHED_DEP -->|"K8s API"| POD2
    SCHED_DEP -->|"K8s API"| POD3

    style WEB_DEP fill:#4ecdc4,color:#fff
    style SCHED_DEP fill:#017cee,color:#fff
    style DB fill:#6bcb77,color:#fff
    style POD1 fill:#45b7d1,color:#fff
    style POD2 fill:#45b7d1,color:#fff
    style POD3 fill:#45b7d1,color:#fff
```

**Best for:** Cloud-native teams, 100+ DAGs, heterogeneous resource requirements, cost optimization.

**Key advantage:** Each task can have different resource requirements. A small Python script gets 1 CPU, while an ML training task gets 32 CPUs and a GPU — and you only pay for resources while tasks are running.

---

## Production Architecture Examples

### Example 1: Mid-Size Company (100 DAGs)

```mermaid
graph TB
    subgraph "AWS Architecture"
        ALB["Application Load Balancer"]
        
        subgraph "ECS / EC2"
            WEB1["Web Server 1"]
            WEB2["Web Server 2"]
            SCHED1["Scheduler 1"]
            SCHED2["Scheduler 2 (HA)"]
            TRIG["Triggerer"]
        end

        subgraph "Worker Fleet"
            ASG["Auto Scaling Group"]
            W1["Worker (c5.2xlarge)"]
            W2["Worker (c5.2xlarge)"]
            W3["Worker (c5.2xlarge)"]
        end

        RDS["Amazon RDS PostgreSQL<br/>(Multi-AZ)"]
        REDIS["Amazon ElastiCache<br/>(Redis)"]
        EFS["Amazon EFS<br/>(DAG files)"]
        S3["Amazon S3<br/>(Logs)"]
    end

    ALB --> WEB1
    ALB --> WEB2
    SCHED1 --> RDS
    SCHED1 --> REDIS
    ASG --> W1
    ASG --> W2
    ASG --> W3
    W1 --> REDIS
    W1 --> RDS
    W1 --> EFS

    style ALB fill:#ff9900,color:#fff
    style RDS fill:#3b48cc,color:#fff
    style REDIS fill:#dc382d,color:#fff
```

### Example 2: Large Enterprise (1000+ DAGs)

```mermaid
graph TB
    subgraph "GKE Cluster"
        subgraph "Namespace: airflow-prod"
            WEB["Web Server<br/>(3 replicas)"]
            SCHED["Scheduler<br/>(3 replicas HA)"]
            TRIG["Triggerer<br/>(2 replicas)"]
        end

        subgraph "Node Pool: default"
            direction LR
            N1["n1-standard-4"]
            N2["n1-standard-4"]
        end

        subgraph "Node Pool: heavy-compute"
            direction LR
            N3["n1-highmem-16"]
            N4["n1-highmem-16"]
        end

        subgraph "Node Pool: gpu"
            direction LR
            N5["n1-standard-8 + GPU"]
        end
    end

    CLOUD_SQL["Cloud SQL PostgreSQL<br/>(HA, 8 vCPU)"]
    GCS["GCS Bucket<br/>(Logs + DAGs)"]

    SCHED -->|"K8s API"| N1
    SCHED -->|"K8s API"| N3
    SCHED -->|"K8s API"| N5

    style SCHED fill:#017cee,color:#fff
    style CLOUD_SQL fill:#4285f4,color:#fff
    style GCS fill:#4285f4,color:#fff
```

---

## Troubleshooting Architecture Issues

### Component Health Check Flowchart

```mermaid
graph TD
    START["Airflow isn't working"] --> WEB_CHECK{"Can you access<br/>the Web UI?"}
    
    WEB_CHECK -->|"No"| WEB_FIX["Check: Gunicorn process,<br/>port binding, load balancer"]
    WEB_CHECK -->|"Yes"| SCHED_CHECK{"Is scheduler<br/>heartbeat recent?"}
    
    SCHED_CHECK -->|"No heartbeat"| SCHED_FIX["Check: scheduler process,<br/>DB connectivity, DAG parse errors"]
    SCHED_CHECK -->|"Heartbeat OK"| TASK_CHECK{"Are tasks stuck<br/>in queued?"}
    
    TASK_CHECK -->|"Yes"| WORKER_FIX["Check: workers running,<br/>queue connectivity,<br/>pool slots available"]
    TASK_CHECK -->|"No"| TASK_FAIL{"Are tasks<br/>failing?"}
    
    TASK_FAIL -->|"Yes"| LOG_CHECK["Check task logs<br/>for error traceback"]
    TASK_FAIL -->|"No"| DAG_CHECK{"DAGs not<br/>appearing?"}
    
    DAG_CHECK -->|"Yes"| PARSE_FIX["Check: DAG file syntax,<br/>import errors,<br/>DAG processor logs"]

    style START fill:#ff6b6b,color:#fff
    style WEB_FIX fill:#ffd93d,color:#333
    style SCHED_FIX fill:#ffd93d,color:#333
    style WORKER_FIX fill:#ffd93d,color:#333
```

### Common Architecture Issues

| Issue | Symptom | Root Cause | Fix |
|-------|---------|-----------|-----|
| DB connection exhaustion | Random "connection refused" errors | Too many components, not enough DB connections | Increase `sql_alchemy_pool_size`, use PgBouncer |
| NFS latency | DAG parsing is slow | Network filesystem overhead | Switch to git-sync or bake DAGs into image |
| Redis OOM | Celery tasks not being picked up | Too many queued messages | Increase Redis memory, reduce task queue size |
| Worker OOM | Tasks being killed mid-execution | Heavy computation in Airflow worker | Move computation to external system, increase worker memory |
| Scheduler bottleneck | Tasks slow to be scheduled | Too many DAGs for single scheduler | Enable HA schedulers, optimize DAG parsing |
| Log storage full | Can't view old task logs | Log retention not configured | Implement log rotation, store in S3/GCS |

### Essential Debugging Commands

```bash
# Check scheduler health
airflow jobs check --job-type SchedulerJob --hostname "$(hostname)"

# Check if DAGs are parseable
airflow dags list-import-errors

# Check active DAG runs
airflow dags list-runs -d my_dag

# Check task instance states
airflow tasks states-for-dag-run my_dag 2024-01-15

# Check metadata DB connectivity
airflow db check

# Check Celery worker status (if using CeleryExecutor)
airflow celery flower  # Opens Flower monitoring UI

# Check configuration
airflow config list
```

---

## Performance Considerations

### Architecture-Level Performance Tuning

```mermaid
graph TB
    subgraph "Performance Bottlenecks"
        DB_PERF["Database<br/>• Connection pool<br/>• Query optimization<br/>• Index tuning"]
        SCHED_PERF["Scheduler<br/>• Parsing speed<br/>• Loop frequency<br/>• HA instances"]
        EXEC_PERF["Executor<br/>• Worker count<br/>• Queue depth<br/>• Concurrency"]
        FS_PERF["Filesystem<br/>• DAG file count<br/>• File size<br/>• I/O speed"]
    end
    
    DB_PERF --> TUNE["Tuning<br/>Strategies"]
    SCHED_PERF --> TUNE
    EXEC_PERF --> TUNE
    FS_PERF --> TUNE
    
    style DB_PERF fill:#ff6b6b,color:#fff
    style SCHED_PERF fill:#ffd93d,color:#333
    style EXEC_PERF fill:#4ecdc4,color:#fff
    style FS_PERF fill:#45b7d1,color:#fff
```

### Key Performance Settings

```ini
# Scheduler Performance
[scheduler]
min_file_process_interval = 30    # Don't parse files more than every 30s
dag_dir_list_interval = 300       # Scan for new files every 5 minutes
parsing_processes = 4             # Parallel DAG parsing processes
max_tis_per_query = 512           # Tasks per scheduler loop

# Executor Performance
[core]
parallelism = 64                  # Max tasks running across all DAGs
max_active_tasks_per_dag = 16     # Max tasks per DAG
max_active_runs_per_dag = 4       # Max concurrent runs per DAG

# Database Performance
[database]
sql_alchemy_pool_size = 10        # Connection pool size
sql_alchemy_max_overflow = 20     # Extra connections when pool is full
sql_alchemy_pool_pre_ping = True  # Test connections before use
```

### Scaling Decision Matrix

| Scale | DAGs | Executor | Workers | DB | Scheduler |
|-------|------|----------|---------|-----|-----------|
| **Small** | < 50 | LocalExecutor | 4-8 processes | Shared PostgreSQL | 1 instance |
| **Medium** | 50-200 | CeleryExecutor | 3-5 machines (16 slots each) | Dedicated PostgreSQL | 2 instances (HA) |
| **Large** | 200-1000 | CeleryExecutor or K8s | 10+ machines or auto-scaling pods | Managed DB (RDS/Cloud SQL) | 3 instances (HA) |
| **Enterprise** | 1000+ | KubernetesExecutor | Auto-scaling | High-perf managed DB + PgBouncer | 3+ instances (HA) |

---

## Common Mistakes

### Mistake 1: Using SQLite in Production

```python
# ❌ Default SQLite - WILL break in production
sql_alchemy_conn = sqlite:///airflow.db
# SQLite cannot handle concurrent writes. You'll get "database is locked" errors.

# ✅ PostgreSQL for production
sql_alchemy_conn = postgresql+psycopg2://airflow:pass@postgres:5432/airflow
```

### Mistake 2: Not Setting Up Log Storage

```python
# ❌ Logs stored locally - lost when container restarts, no access from other nodes
[logging]
base_log_folder = /opt/airflow/logs

# ✅ Remote log storage
[logging]
remote_logging = True
remote_log_conn_id = aws_default
remote_base_log_folder = s3://airflow-logs/
```

### Mistake 3: Single Scheduler Without HA

```python
# ❌ Single scheduler - if it dies, no new tasks get scheduled
# Run only one scheduler process

# ✅ Multiple schedulers (Airflow 2.x)
# Simply run multiple scheduler processes - they coordinate via the database
# airflow scheduler (on machine 1)
# airflow scheduler (on machine 2)
```

### Mistake 4: Ignoring Database Maintenance

```bash
# ❌ Never cleaning up old data
# After 1 year: task_instance table has 10 million rows, everything is slow

# ✅ Regular cleanup
airflow db clean --clean-before-timestamp "$(date -d '90 days ago' -Iseconds)" --yes
```

### Mistake 5: Not Monitoring Airflow Itself

```python
# ❌ Only monitoring your DAGs, not Airflow's health

# ✅ Monitor Airflow components
# - Scheduler heartbeat (is it alive?)
# - DB connection pool (is it exhausted?)
# - Task queue depth (is it backing up?)
# - DAG parsing time (is it too slow?)
# - Worker memory (is it OOMing?)

# Set up a health check DAG
with DAG('airflow_health_check', schedule='*/5 * * * *', ...) as dag:
    check = PythonOperator(
        task_id='check_health',
        python_callable=check_airflow_health,  # Query /health API, check metrics
    )
```

---

## Interview Questions

### Beginner Level

**Q1: Name the core components of Airflow and their roles.**

> **A:** (1) **Web Server** — Provides the UI and REST API for monitoring and managing DAGs. (2) **Scheduler** — Determines when tasks should run based on schedules and dependencies. (3) **Executor** — Defines how tasks are distributed and run (LocalExecutor, CeleryExecutor, KubernetesExecutor). (4) **Workers** — The processes that actually execute task code. (5) **Metadata Database** — Stores all state (DAG definitions, run history, task states, connections). (6) **DAG Processor** — Parses Python DAG files and serializes them. (7) **Triggerer** — Handles deferred tasks that are waiting for external events.

**Q2: Why can't you use SQLite in production?**

> **A:** SQLite doesn't support concurrent writes. In production, the scheduler, web server, workers, and triggerer all need to write to the database simultaneously. SQLite locks the entire database for writes, causing "database is locked" errors and effectively serializing all operations. PostgreSQL and MySQL handle concurrent writes through MVCC (Multi-Version Concurrency Control).

**Q3: What is the metadata database and why is it critical?**

> **A:** The metadata database is the single source of truth for the entire Airflow system. It stores DAG definitions, DAG run history, task instance states, connection credentials, variables, XCom data, and user information. Every component reads from and writes to it. If the metadata database goes down, the entire Airflow system stops — tasks can't be scheduled, states can't be updated, and the UI can't display anything.

### Intermediate Level

**Q4: Compare CeleryExecutor and KubernetesExecutor. When would you use each?**

> **A:** **CeleryExecutor**: Uses long-running worker processes connected via a message broker (Redis/RabbitMQ). Workers are always running, consuming resources even when idle. Best for steady workloads where tasks are frequent and uniform. **KubernetesExecutor**: Creates a new Kubernetes Pod for each task, destroyed after completion. Zero idle resource usage, perfect isolation per task, but higher startup latency (pod creation). Best for cloud deployments with heterogeneous resource requirements, bursty workloads, or when cost optimization is important. Choose Celery for low-latency, high-throughput; choose K8s for isolation, cost efficiency, and heterogeneous workloads.

**Q5: Explain how the Triggerer component works and why it was introduced.**

> **A:** The Triggerer was introduced in Airflow 2.2 to solve the problem of sensors wasting worker slots. Before the Triggerer, a sensor waiting for a file in S3 would hold a worker slot for hours (in poke mode) or incur rescheduling overhead (in reschedule mode). The Triggerer uses Python's asyncio to monitor thousands of deferred triggers with minimal resources. When a task defers itself, it releases its worker slot and registers a trigger with the Triggerer. The Triggerer watches for the event asynchronously, and when the event occurs, it marks the trigger as fired, causing the scheduler to re-queue the task.

**Q6: What happens when you deploy a new DAG file? Walk through the process.**

> **A:** (1) DAG file is placed in the DAG folder (via git-sync, NFS, etc.). (2) The DAG Processor discovers the new file during its next scan (controlled by `dag_dir_list_interval`). (3) The DAG Processor imports the Python module, executing all top-level code. (4) It finds DAG objects and validates them. (5) The DAG is serialized (as JSON) and written to the `serialized_dag` table. (6) The `dag` table is updated with metadata. (7) The Web Server reads the serialized DAG from the database and displays it in the UI. (8) The Scheduler reads the DAG's schedule and starts creating DagRuns according to it.

### Advanced Level

**Q7: Your Airflow deployment has 500 DAGs and the scheduler is taking 2 minutes per loop. What do you investigate?**

> **A:** (1) **DAG parsing time**: Use `airflow dags list-import-errors` and check parsing times. Look for heavy top-level imports, API calls, or database queries in DAG files. (2) **Number of parsing processes**: Increase `parsing_processes` to use more CPUs. (3) **File system speed**: If using NFS, the I/O latency may be the bottleneck — switch to local git-sync. (4) **DAG complexity**: Some DAGs with thousands of tasks take long to parse — consider splitting them. (5) **min_file_process_interval**: Increase this to reduce how often unchanged files are re-parsed. (6) **Database performance**: Check if the metadata DB is the bottleneck — slow queries, connection pool exhaustion. (7) **Enable HA schedulers**: Run 2-3 scheduler instances to distribute the work. (8) **Use `.airflowignore`**: Exclude non-DAG files from parsing.

**Q8: Design a highly available Airflow deployment for a financial services company with strict uptime SLAs.**

> **A:** 
> - **Metadata DB**: Managed PostgreSQL with Multi-AZ failover (e.g., RDS Multi-AZ). Connection pooling via PgBouncer.
> - **Schedulers**: 3 instances across different availability zones. Airflow 2.x HA schedulers use row-level locking for coordination.
> - **Workers**: CeleryExecutor with auto-scaling worker fleet across 3 AZs. Minimum 3 workers always running.
> - **Web Servers**: 2+ instances behind a load balancer with health checks.
> - **Message Broker**: Redis with persistence (AOF) in a replicated setup, or RabbitMQ with mirrored queues.
> - **Triggerer**: 2 instances for redundancy.
> - **DAG Distribution**: Git-sync with 60-second sync interval. DAGs stored in a version-controlled repository with PR reviews.
> - **Logging**: Remote logging to S3/GCS (not local filesystem).
> - **Monitoring**: Prometheus/Grafana for Airflow metrics, PagerDuty for alerting.
> - **Disaster Recovery**: Daily database backups, cross-region backup for DB, infrastructure as code (Terraform/Helm) for rapid redeployment.

**Q9: Explain the data flow when a task instance transitions from "scheduled" to "success". Mention every component involved.**

> **A:** (1) **Scheduler** reads from metadata DB, finds a task instance with all dependencies met, sets state to `scheduled`. (2) Scheduler sets state to `queued` and sends the task to the **Executor**. (3) **Executor** (if Celery) enqueues a message in **Redis/RabbitMQ** with the task details. (4) A **Celery Worker** picks up the message from the queue. (5) Worker sets state to `running` in the **metadata DB**. (6) Worker reads the DAG file from the **filesystem** to get task code. (7) Worker executes the task code (which may call external systems). (8) Worker writes **logs** to log storage (local/S3/GCS). (9) If the task pushes XCom data, worker writes to the **xcom** table. (10) Worker sets state to `success` in the **metadata DB**. (11) **Scheduler** reads the updated state, checks if downstream tasks' dependencies are now met, and the cycle continues.

**Q10: Your team is debating between a single large Airflow deployment vs. multiple smaller deployments per team. Argue both sides.**

> **A: Single deployment pros**: Centralized management, shared resources, cross-team DAG dependencies are simple, one set of infrastructure to maintain. **Single deployment cons**: "Noisy neighbor" problem (one team's broken DAG can overwhelm the scheduler), RBAC complexity, harder to upgrade (everyone must coordinate), single blast radius.
> **Multiple deployments pros**: Team autonomy, isolated blast radius, independent upgrade cycles, customized configuration per team, simpler RBAC. **Multiple deployments cons**: Cross-team dependencies require ExternalTaskSensor or APIs, duplicated infrastructure costs, operational overhead of managing multiple instances, no shared connection/variable management.
> **Recommendation**: Start with a single deployment. Split when you hit one of: (1) scheduler bottleneck from too many DAGs, (2) teams needing different upgrade timelines, (3) regulatory requirements for isolation (e.g., PII-handling team), or (4) blast radius concerns in production.

---

## Key Takeaways

> **1.** Airflow has 7 core components: Web Server, Scheduler, Executor, Workers, Metadata DB, DAG Processor, and Triggerer.
>
> **2.** The Metadata Database is the single source of truth — all components communicate through it.
>
> **3.** Choose your executor wisely: LocalExecutor for small teams, CeleryExecutor for distributed workloads, KubernetesExecutor for cloud-native deployments.
>
> **4.** DAG serialization decouples the Web Server from the filesystem — a key Airflow 2.x improvement.
>
> **5.** The Triggerer solves the sensor resource waste problem using asyncio.
>
> **6.** In production: always use PostgreSQL, always set up log storage, always run HA schedulers.

---

**[← Previous: Workflow Orchestration](02-workflow-orchestration.md) | [Home](../README.md) | [Next →: DAGs](04-dags.md)**
