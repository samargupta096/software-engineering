# The Scheduler — Airflow's Brain

> **"The scheduler is to Airflow what the heart is to the body — if it stops, everything stops."**

The scheduler is the most critical component of Airflow. It decides what runs, when it runs, and ensures everything executes in the correct order. Understanding its internals is what separates Airflow operators from Airflow experts.

---

## Table of Contents

- [What the Scheduler Does](#what-the-scheduler-does)
- [Real-World Analogy: Air Traffic Controller](#real-world-analogy-air-traffic-controller)
- [The Scheduler Loop](#the-scheduler-loop)
- [Scheduler Loop Internals](#scheduler-loop-internals)
- [SchedulerJob and DagFileProcessor](#schedulerjob-and-dagfileprocessor)
- [How Scheduling Decisions Are Made](#how-scheduling-decisions-are-made)
- [The Mini-Scheduler](#the-mini-scheduler)
- [Scheduler High Availability](#scheduler-high-availability)
- [Configuration Deep Dive](#configuration-deep-dive)
- [Performance Tuning](#performance-tuning)
- [Zombie Task Detection](#zombie-task-detection)
- [Dead Letter Queue Pattern](#dead-letter-queue-pattern)
- [Production Scenarios](#production-scenarios)
- [Troubleshooting](#troubleshooting)
- [Common Mistakes](#common-mistakes)
- [Interview Questions](#interview-questions)

---

## What the Scheduler Does

The scheduler performs six critical functions continuously:

```mermaid
graph TB
    subgraph "The 6 Functions of the Scheduler"
        F1["1️⃣ Parse DAGs<br/>Read & understand DAG files"]
        F2["2️⃣ Create DagRuns<br/>Based on schedules"]
        F3["3️⃣ Schedule TaskInstances<br/>Check dependencies"]
        F4["4️⃣ Send to Executor<br/>Queue for execution"]
        F5["5️⃣ Process Events<br/>Handle completions/failures"]
        F6["6️⃣ Detect Zombies<br/>Find & kill stuck tasks"]
    end
    
    F1 --> F2 --> F3 --> F4 --> F5 --> F6
    F6 -.->|"loop"| F1

    style F1 fill:#4ecdc4,color:#fff
    style F2 fill:#45b7d1,color:#fff
    style F3 fill:#ffd93d,color:#333
    style F4 fill:#ff6b6b,color:#fff
    style F5 fill:#96ceb4,color:#333
    style F6 fill:#ff9a3c,color:#fff
```

| Function | What It Does | Why It Matters |
|----------|-------------|---------------|
| **Parse DAGs** | Import Python DAG files, extract DAG objects | Without this, Airflow doesn't know your workflows exist |
| **Create DagRuns** | Check schedules, create new DagRun records | This is what triggers your pipelines |
| **Schedule Tasks** | Check task dependencies, mark ready tasks | Ensures correct execution order |
| **Send to Executor** | Push ready tasks to the execution queue | Gets tasks actually running |
| **Process Events** | Handle task completions and failures | Updates state, triggers downstream tasks |
| **Detect Zombies** | Find tasks marked "running" with no heartbeat | Prevents stuck pipelines |

---

## Real-World Analogy: Air Traffic Controller

```mermaid
graph TB
    subgraph "Air Traffic Control Tower"
        ATC["👨‍✈️ Air Traffic Controller<br/>(= Scheduler)"]
        RADAR["📡 Radar Screen<br/>(= Metadata DB)"]
        RADIO["📻 Radio<br/>(= Executor/Queue)"]
    end

    subgraph "Airspace"
        P1["✈️ Flight AA101<br/>(= Task Instance)"]
        P2["✈️ Flight UA202<br/>(= Task Instance)"]
        P3["✈️ Flight DL303<br/>(= Task Instance)"]
    end

    subgraph "Flight Schedule"
        SCHED["📋 Today's Schedule<br/>(= DAG Definitions)"]
    end

    ATC -->|"monitors"| RADAR
    ATC -->|"communicates"| RADIO
    RADIO -->|"instructions"| P1
    RADIO -->|"instructions"| P2
    SCHED -->|"plans from"| ATC

    style ATC fill:#017cee,color:#fff
    style RADAR fill:#6bcb77,color:#fff
```

| ATC Concept | Scheduler Equivalent |
|------------|---------------------|
| Flight schedule for the day | DAG definitions with schedules |
| "Flight AA101 cleared for takeoff" | Task Instance moved to `queued` |
| Runway capacity (2 runways) | Executor slots / pool slots |
| Separation rules (spacing between planes) | Task dependencies |
| Emergency landing priority | Task priority_weight |
| "Flight UA202, hold at gate" | Task waiting for dependencies |
| Radar screen showing all flights | Metadata DB with all task states |
| Controller handoff (shift change) | HA scheduler takeover |
| Lost contact with aircraft | Zombie task detection |
| Flight plan filed before departure | DAG parsed before scheduling |

> **💡 Key Insight:** The ATC doesn't fly the planes. They don't know how to operate the engines. But they decide **when** each plane takes off, ensure planes don't collide, and handle emergencies. That's exactly what the scheduler does.

---

## The Scheduler Loop

### The Heartbeat Cycle

The scheduler runs in a continuous loop, with each iteration called a **heartbeat**.

```mermaid
sequenceDiagram
    participant SCHED as Scheduler
    participant DB as Metadata DB
    participant DP as DAG Processor
    participant EXEC as Executor

    loop Every scheduler_heartbeat_sec (default: 5s)
        SCHED->>DP: Check for newly parsed DAGs
        DP-->>SCHED: Updated DAG data
        
        SCHED->>DB: Find DAGs needing new DagRuns
        SCHED->>DB: Create DagRuns
        
        SCHED->>DB: Find TaskInstances with met dependencies
        SCHED->>DB: Set state: none → scheduled → queued
        
        SCHED->>EXEC: Send queued TaskInstances
        
        EXEC-->>SCHED: Report completed/failed tasks
        SCHED->>DB: Update TaskInstance states
        
        SCHED->>DB: Check for zombie tasks
        SCHED->>DB: Record scheduler heartbeat
    end
```

### Simplified Loop in Pseudocode

```python
# What the scheduler loop roughly looks like internally
class SchedulerJob:
    def run(self):
        while True:
            # Step 1: Process DAG files
            self.dag_processor.process_files()
            
            # Step 2: Create new DagRuns
            self._create_dag_runs()
            
            # Step 3: Schedule TaskInstances
            self._schedule_task_instances()
            
            # Step 4: Send tasks to executor
            self._send_tasks_to_executor()
            
            # Step 5: Process executor events
            self._process_executor_events()
            
            # Step 6: Handle zombies
            self._find_and_kill_zombies()
            
            # Step 7: Record heartbeat
            self._record_heartbeat()
            
            # Sleep until next heartbeat
            time.sleep(self.scheduler_heartbeat_sec)
```

---

## Scheduler Loop Internals

### Step 1: DAG Parsing

```mermaid
graph TB
    subgraph "DAG Parsing Process"
        SCAN["Scan DAG folder<br/>(every dag_dir_list_interval)"]
        SCAN --> FILTER["Filter .airflowignore"]
        FILTER --> QUEUE["Queue files for parsing"]
        QUEUE --> PROC["DagFileProcessor(es)<br/>(separate processes)"]
        PROC --> IMPORT["Python import each .py file"]
        IMPORT --> EXTRACT["Extract DAG objects"]
        EXTRACT --> SERIAL["Serialize to DB"]
    end

    style PROC fill:#4ecdc4,color:#fff
    style SERIAL fill:#6bcb77,color:#fff
```

**Key details:**
- DAG files are scanned every `dag_dir_list_interval` (default: 300 seconds)
- Each file is re-parsed at most every `min_file_process_interval` (default: 30 seconds)
- Parsing runs in separate processes (`parsing_processes` setting)
- Import errors are stored in the `import_error` table

### Step 2: Creating DagRuns

```python
# Pseudocode for DagRun creation
def _create_dag_runs(self):
    for dag in active_unpaused_dags:
        # Check if a new run is needed
        last_run = get_last_dagrun(dag.dag_id)
        next_run_time = dag.next_dagrun_after(last_run)
        
        if next_run_time <= now():
            # Check max_active_runs constraint
            active_runs = count_active_runs(dag.dag_id)
            if active_runs < dag.max_active_runs:
                create_dagrun(
                    dag_id=dag.dag_id,
                    logical_date=next_run_time,
                    run_type='scheduled',
                    state='running',
                )
```

```mermaid
graph TD
    CHECK["Check each active DAG"] --> SCHED_DUE{"Schedule<br/>due?"}
    SCHED_DUE -->|"No"| SKIP["Skip"]
    SCHED_DUE -->|"Yes"| MAX_CHECK{"max_active_runs<br/>reached?"}
    MAX_CHECK -->|"Yes"| WAIT["Wait for runs to complete"]
    MAX_CHECK -->|"No"| CREATE["Create DagRun"]
    CREATE --> TASKS["Create TaskInstance records<br/>(state = none)"]

    style CREATE fill:#6bcb77,color:#fff
    style WAIT fill:#ffd93d,color:#333
```

### Step 3: Scheduling TaskInstances

This is the most complex step. For each DagRun, the scheduler evaluates every task's dependencies.

```mermaid
graph TD
    TI["TaskInstance<br/>(state: none)"] --> DEP_CHECK{"All upstream<br/>tasks done?"}
    DEP_CHECK -->|"No"| WAIT["Stay in 'none' state"]
    DEP_CHECK -->|"Yes"| TRIGGER_CHECK{"Trigger rule<br/>satisfied?"}
    TRIGGER_CHECK -->|"No"| FAIL_OR_SKIP["Mark upstream_failed<br/>or skipped"]
    TRIGGER_CHECK -->|"Yes"| POOL_CHECK{"Pool slot<br/>available?"}
    POOL_CHECK -->|"No"| QUEUE_WAIT["Stay in 'scheduled'"]
    POOL_CHECK -->|"Yes"| CONCURRENCY{"Concurrency<br/>limit OK?"}
    CONCURRENCY -->|"No"| QUEUE_WAIT
    CONCURRENCY -->|"Yes"| QUEUED["Set state: 'queued'<br/>Send to executor"]

    style QUEUED fill:#6bcb77,color:#fff
    style WAIT fill:#ffd93d,color:#333
    style FAIL_OR_SKIP fill:#ff6b6b,color:#fff
```

```python
# Pseudocode for task scheduling
def _schedule_task_instances(self):
    for dagrun in active_dagruns:
        for ti in dagrun.get_task_instances(state='none'):
            # Check upstream dependencies
            upstream_states = get_upstream_states(ti)
            
            if ti.trigger_rule.is_met(upstream_states):
                # Check concurrency limits
                if (dag_concurrency_ok(ti.dag_id) and 
                    pool_slots_available(ti.pool) and
                    global_concurrency_ok()):
                    
                    ti.state = 'scheduled'
                    ti.state = 'queued'
                    self.executor.queue_task(ti)
```

### Step 4: Sending to Executor

```mermaid
sequenceDiagram
    participant S as Scheduler
    participant E as Executor
    participant Q as Queue (Redis/K8s API)
    participant W as Worker

    S->>E: queue_task(task_instance)
    
    alt CeleryExecutor
        E->>Q: LPUSH task to Redis queue
        W->>Q: BRPOP task from queue
    else KubernetesExecutor
        E->>Q: Create Pod via K8s API
        Q->>W: Pod scheduled on node
    else LocalExecutor
        E->>W: Fork subprocess
    end
    
    W->>W: Execute task code
```

### Step 5: Processing Executor Events

```python
# The scheduler checks for completed tasks
def _process_executor_events(self):
    events = self.executor.get_event_buffer()
    
    for task_key, state in events.items():
        ti = get_task_instance(task_key)
        
        if state == 'success':
            ti.state = 'success'
            # This might make downstream tasks schedulable
            
        elif state == 'failed':
            if ti.try_number < ti.max_tries:
                ti.state = 'up_for_retry'
                ti.next_retry_time = calculate_retry_time(ti)
            else:
                ti.state = 'failed'
                # Trigger failure callbacks
                ti.on_failure_callback(context)
```

### Step 6: Zombie Detection

```mermaid
graph TD
    subgraph "Zombie Detection"
        SCAN_RUNNING["Find all TaskInstances<br/>with state = 'running'"]
        SCAN_RUNNING --> CHECK_HEARTBEAT{"Last heartbeat<br/>> zombie_threshold?"}
        CHECK_HEARTBEAT -->|"No"| ALIVE["✅ Task is alive"]
        CHECK_HEARTBEAT -->|"Yes"| CHECK_HOST{"Worker process<br/>exists?"}
        CHECK_HOST -->|"Yes"| ALIVE
        CHECK_HOST -->|"No"| ZOMBIE["🧟 ZOMBIE DETECTED!"]
        ZOMBIE --> FAIL["Mark as 'failed'<br/>or schedule retry"]
    end

    style ZOMBIE fill:#ff6b6b,color:#fff
    style ALIVE fill:#6bcb77,color:#fff
```

---

## SchedulerJob and DagFileProcessor

### SchedulerJob

The `SchedulerJob` is the main entry point. When you run `airflow scheduler`, it creates a `SchedulerJob` instance.

```mermaid
graph TB
    CLI["airflow scheduler"] --> SJ["SchedulerJob"]
    SJ --> DFP_MGR["DagFileProcessorManager<br/>(manages parsing processes)"]
    SJ --> MAIN_LOOP["Main Scheduler Loop<br/>(creates runs, schedules tasks)"]
    SJ --> EXECUTOR["Executor<br/>(sends tasks to workers)"]

    DFP_MGR --> DFP1["DagFileProcessor 1"]
    DFP_MGR --> DFP2["DagFileProcessor 2"]
    DFP_MGR --> DFP3["DagFileProcessor N"]

    style SJ fill:#017cee,color:#fff
    style DFP_MGR fill:#4ecdc4,color:#fff
    style MAIN_LOOP fill:#ffd93d,color:#333
    style EXECUTOR fill:#ff6b6b,color:#fff
```

### DagFileProcessor

The `DagFileProcessor` runs in a **separate process** from the main scheduler loop. This is critical — if a DAG file has a bug that causes an infinite loop or crash, it doesn't bring down the scheduler.

```python
# Simplified DagFileProcessor behavior
class DagFileProcessor:
    def process_file(self, filepath):
        """Run in a separate process to isolate from scheduler."""
        try:
            # Import the Python module
            dagbag = DagBag(dag_folder=filepath)
            
            # For each DAG found
            for dag_id, dag in dagbag.dags.items():
                # Serialize and store
                SerializedDagModel.write_dag(dag)
                
                # Update the dag table
                DagModel.update_dag(dag)
                
            # Store any import errors
            for filepath, error in dagbag.import_errors.items():
                ImportError.store(filepath, error)
                
        except Exception as e:
            # Log error but don't crash the scheduler
            log.error(f"Error processing {filepath}: {e}")
```

### Process Architecture

```mermaid
graph TB
    subgraph "Scheduler Process Group"
        MAIN["Main Process<br/>(SchedulerJob)"]
        
        subgraph "Parsing Processes"
            P1["DagFileProcessor 1<br/>(process)"]
            P2["DagFileProcessor 2<br/>(process)"]
            P3["DagFileProcessor 3<br/>(process)"]
        end
    end
    
    MAIN -->|"manages"| P1
    MAIN -->|"manages"| P2
    MAIN -->|"manages"| P3
    
    P1 -->|"results via pipe"| MAIN
    P2 -->|"results via pipe"| MAIN
    P3 -->|"results via pipe"| MAIN

    style MAIN fill:#017cee,color:#fff
```

---

## How Scheduling Decisions Are Made

### The Decision Algorithm

When the scheduler evaluates a TaskInstance, it checks multiple conditions in order:

```mermaid
graph TD
    START["Evaluate TaskInstance"] --> DEP{"1. Upstream<br/>dependencies met?"}
    DEP -->|"No"| WAIT["⏸️ Wait"]
    DEP -->|"Yes"| TRIGGER{"2. Trigger rule<br/>satisfied?"}
    TRIGGER -->|"No"| SKIP["⏭️ Skip or<br/>upstream_failed"]
    TRIGGER -->|"Yes"| PAST{"3. depends_on_past<br/>= True?"}
    PAST -->|"Yes, prev failed"| WAIT2["⏸️ Wait for<br/>previous success"]
    PAST -->|"No or prev OK"| POOL{"4. Pool slot<br/>available?"}
    POOL -->|"No"| QUEUE["📋 Stay queued"]
    POOL -->|"Yes"| DAG_CONC{"5. DAG concurrency<br/>limit OK?"}
    DAG_CONC -->|"No"| QUEUE
    DAG_CONC -->|"Yes"| GLOBAL{"6. Global parallelism<br/>limit OK?"}
    GLOBAL -->|"No"| QUEUE
    GLOBAL -->|"Yes"| RUN["✅ Send to executor"]

    style RUN fill:#6bcb77,color:#fff
    style WAIT fill:#ffd93d,color:#333
    style SKIP fill:#ff6b6b,color:#fff
```

### Priority Weight

When multiple tasks are ready to run but executor slots are limited, **priority_weight** determines who goes first.

```python
# Priority weight calculation
task = PythonOperator(
    task_id='critical_task',
    python_callable=critical_fn,
    priority_weight=10,                    # Higher = more priority
    weight_rule='downstream',              # How to aggregate
)

# Weight rules:
# 'downstream' (default): priority = own weight + sum of all downstream weights
# 'upstream': priority = own weight + sum of all upstream weights
# 'absolute': priority = own weight only
```

```mermaid
graph LR
    subgraph "Priority Weight Example (downstream rule)"
        A["Task A<br/>weight=1<br/>effective=4"] --> B["Task B<br/>weight=1<br/>effective=3"]
        B --> C["Task C<br/>weight=1<br/>effective=2"]
        C --> D["Task D<br/>weight=1<br/>effective=1"]
    end
```

With the `downstream` rule, Task A has the highest effective priority because it has the most downstream tasks. This ensures that tasks on the **critical path** get scheduled first.

### Pools: Resource Management

Pools limit how many tasks can access a shared resource simultaneously.

```python
# Define a pool (via UI, CLI, or API)
# airflow pools set snowflake_pool 10 "Limit Snowflake concurrent queries"

task = SnowflakeOperator(
    task_id='heavy_query',
    pool='snowflake_pool',     # Only 10 tasks can use this pool simultaneously
    pool_slots=2,              # This task uses 2 of the 10 slots
    ...
)
```

```mermaid
graph TB
    subgraph "Pool: snowflake_pool (10 slots)"
        S1["Slot 1: Task A ✅"]
        S2["Slot 2: Task A ✅"]
        S3["Slot 3: Task B ✅"]
        S4["Slot 4: Task C ✅"]
        S5["Slot 5: Task D ✅"]
        S6["Slot 6: 🔓 Free"]
        S7["Slot 7: 🔓 Free"]
        S8["Slot 8: 🔓 Free"]
        S9["Slot 9: 🔓 Free"]
        S10["Slot 10: 🔓 Free"]
    end

    WAITING["Task E (needs 2 slots)<br/>✅ Can run - 5 slots free"]

    style S1 fill:#ff6b6b,color:#fff
    style S2 fill:#ff6b6b,color:#fff
    style S3 fill:#ffd93d,color:#333
    style S4 fill:#4ecdc4,color:#fff
    style S5 fill:#45b7d1,color:#fff
    style WAITING fill:#6bcb77,color:#fff
```

---

## The Mini-Scheduler

### What Is the Mini-Scheduler?

Introduced in Airflow 2.0, the mini-scheduler allows **workers** to schedule downstream tasks immediately after a task completes, without waiting for the main scheduler loop.

```mermaid
sequenceDiagram
    participant W as Worker
    participant DB as Metadata DB
    participant S as Scheduler (Main Loop)

    Note over W,S: WITHOUT Mini-Scheduler
    W->>DB: Task A complete (success)
    Note over S: Next scheduler heartbeat (5s)
    S->>DB: Check dependencies for Task B
    S->>DB: Schedule Task B
    Note over W: 5 second delay!

    Note over W,S: WITH Mini-Scheduler
    W->>DB: Task A complete (success)
    W->>DB: Check dependencies for Task B
    W->>DB: Schedule Task B immediately!
    Note over W: Near-zero delay!
```

### Why It Matters

In a large DAG with 100 sequential tasks, the mini-scheduler can save **hundreds of seconds** of cumulative wait time. Without it, each task completion waits for the next scheduler heartbeat (default 5 seconds) before the downstream task is evaluated.

```ini
# Enable/disable mini-scheduler
[scheduler]
schedule_after_task_execution = True  # Default: True in Airflow 2.x
```

---

## Scheduler High Availability

### The Problem

A single scheduler is a **single point of failure**. If it crashes, no new tasks get scheduled, and running pipelines can't progress.

### The Solution: Multiple Schedulers (Airflow 2.x)

```mermaid
graph TB
    subgraph "HA Scheduler Setup"
        S1["Scheduler 1<br/>(Active)"]
        S2["Scheduler 2<br/>(Active)"]
        S3["Scheduler 3<br/>(Active)"]
    end
    
    DB["Metadata DB<br/>(Coordination Point)"]
    
    S1 -->|"row-level locking"| DB
    S2 -->|"row-level locking"| DB
    S3 -->|"row-level locking"| DB

    style S1 fill:#017cee,color:#fff
    style S2 fill:#017cee,color:#fff
    style S3 fill:#017cee,color:#fff
    style DB fill:#6bcb77,color:#fff
```

### How Multiple Schedulers Coordinate

Unlike leader/follower models, Airflow uses **row-level locking** in the database:

```python
# Simplified: How schedulers avoid double-scheduling
def schedule_task_instances(self):
    # Use SELECT ... FOR UPDATE SKIP LOCKED
    # This is a PostgreSQL feature that:
    # 1. Locks the row so no other scheduler can process it
    # 2. SKIP LOCKED means if another scheduler already locked it, skip it
    
    task_instances = session.query(TaskInstance)\
        .filter(TaskInstance.state == 'scheduled')\
        .with_for_update(skip_locked=True)\
        .limit(self.max_tis_per_query)\
        .all()
    
    for ti in task_instances:
        ti.state = 'queued'
        self.executor.queue_task(ti)
```

```mermaid
sequenceDiagram
    participant S1 as Scheduler 1
    participant S2 as Scheduler 2
    participant DB as PostgreSQL

    Note over S1,DB: Both try to schedule Task X

    S1->>DB: SELECT task_x FOR UPDATE
    Note over DB: Row locked by S1
    S2->>DB: SELECT task_x FOR UPDATE SKIP LOCKED
    Note over S2: Skipped! Row already locked
    
    S1->>DB: UPDATE task_x SET state='queued'
    Note over DB: Row released
    
    Note over S1,S2: Task X scheduled exactly once!
```

### HA Configuration

```ini
[scheduler]
# No special configuration needed!
# Just run multiple scheduler instances.
# They coordinate automatically via the database.

# Ensure your database supports row-level locking:
# PostgreSQL: ✅ Supports SKIP LOCKED
# MySQL 8.0+: ✅ Supports SKIP LOCKED  
# SQLite: ❌ Does NOT support this
```

```bash
# Running multiple schedulers
# Machine 1:
airflow scheduler

# Machine 2:
airflow scheduler

# Machine 3 (optional):
airflow scheduler

# That's it! They coordinate automatically.
```

### HA Recommendations

| Aspect | Recommendation |
|--------|---------------|
| Number of schedulers | 2-3 (more adds overhead without benefit) |
| Database | Must be PostgreSQL 9.6+ or MySQL 8.0+ |
| `parsing_processes` | Divide across schedulers (e.g., 2 per scheduler instead of 6 on one) |
| Deployment | Different machines or Kubernetes pods |
| Monitoring | Alert if fewer than 2 scheduler heartbeats are recent |

---

## Configuration Deep Dive

### Critical Scheduler Settings

```ini
[scheduler]
# ===== PARSING =====
# How often to scan for new DAG files in the folder
dag_dir_list_interval = 300  # seconds (default: 300 = 5 minutes)

# Minimum time between re-parsing a specific DAG file
min_file_process_interval = 30  # seconds (default: 30)

# Number of processes to use for parsing DAG files
parsing_processes = 2  # default: 2

# ===== SCHEDULING =====
# How often the scheduler loop runs
scheduler_heartbeat_sec = 5  # seconds (default: 5)

# Max TaskInstances to process per scheduler loop
max_tis_per_query = 512  # default: 512

# ===== ZOMBIE DETECTION =====
# How long before a task without heartbeat is considered zombie
scheduler_zombie_task_threshold = 300  # seconds (default: 300 = 5 minutes)

# How often to check for zombies
zombie_detection_interval = 10.0  # seconds

# ===== PERFORMANCE =====
# Allow workers to schedule downstream tasks immediately
schedule_after_task_execution = True  # default: True

# How many DagRuns to create per loop iteration
max_dagruns_to_create_per_loop = 10  # default: 10

# Number of DagRuns to examine per loop
max_dagruns_per_loop_to_schedule = 20  # default: 20

[core]
# ===== CONCURRENCY =====
# Maximum total number of task instances running across all DAGs
parallelism = 32  # default: 32

# Maximum active tasks per DAG
max_active_tasks_per_dag = 16  # default: 16

# Maximum active runs per DAG
max_active_runs_per_dag = 16  # default: 16
```

### Configuration Impact Visualization

```mermaid
graph TB
    subgraph "Configuration Hierarchy"
        GLOBAL["parallelism = 32<br/>(system-wide max)"]
        GLOBAL --> DAG_RUNS["max_active_runs_per_dag = 16<br/>(per DAG)"]
        GLOBAL --> DAG_TASKS["max_active_tasks_per_dag = 16<br/>(per DAG)"]
        DAG_TASKS --> POOL["Pool slots<br/>(per resource)"]
        POOL --> TASK["Individual task<br/>(pool_slots)"]
    end

    style GLOBAL fill:#ff6b6b,color:#fff
    style DAG_RUNS fill:#ffd93d,color:#333
    style DAG_TASKS fill:#ffd93d,color:#333
    style POOL fill:#4ecdc4,color:#fff
    style TASK fill:#6bcb77,color:#fff
```

> **💡 Key Insight:** Concurrency limits are evaluated **in this order**: global `parallelism` → per-DAG `max_active_tasks` → pool slot availability. A task must pass ALL checks to be queued.

---

## Performance Tuning

### Identifying Bottlenecks

```mermaid
graph TD
    SLOW["Scheduler seems slow"] --> SYMPTOM{"Primary<br/>symptom?"}
    
    SYMPTOM -->|"Tasks stay 'none'<br/>too long"| PARSE["Parsing bottleneck<br/>Increase parsing_processes<br/>Reduce top-level code"]
    
    SYMPTOM -->|"Tasks stay 'scheduled'<br/>too long"| SCHED_LOOP["Scheduler loop bottleneck<br/>Increase max_tis_per_query<br/>Run HA schedulers"]
    
    SYMPTOM -->|"Tasks stay 'queued'<br/>too long"| EXEC["Executor bottleneck<br/>Add more workers<br/>Increase concurrency"]
    
    SYMPTOM -->|"Long gap between<br/>task completions"| MINI["Enable mini-scheduler<br/>Reduce heartbeat interval"]

    style SLOW fill:#ff6b6b,color:#fff
    style PARSE fill:#ffd93d,color:#333
    style SCHED_LOOP fill:#ffd93d,color:#333
    style EXEC fill:#ffd93d,color:#333
    style MINI fill:#ffd93d,color:#333
```

### Tuning for Scale

| Scale | DAGs | Key Settings |
|-------|------|-------------|
| **Small** (< 50 DAGs) | < 50 | Defaults work fine |
| **Medium** (50-200) | 50-200 | `parsing_processes=4`, `parallelism=64`, HA schedulers (2) |
| **Large** (200-1000) | 200-1000 | `parsing_processes=8`, `parallelism=128`, HA (3), `min_file_process_interval=60` |
| **Enterprise** (1000+) | 1000+ | Max parsing processes, `dag_dir_list_interval=600`, consider multiple Airflow deployments |

### DAG-Level Optimization

```python
# For a high-priority, latency-sensitive DAG:
with DAG(
    'time_critical_pipeline',
    max_active_runs=1,         # Prevent overlap
    max_active_tasks=32,       # Allow high parallelism
    dagrun_timeout=timedelta(hours=1),  # Fail fast
) as dag:
    ...

# For a low-priority, resource-heavy DAG:
with DAG(
    'batch_ml_training',
    max_active_runs=1,         # Only one training at a time
    max_active_tasks=4,        # Don't hog resources
) as dag:
    ...
```

### Database Performance

The metadata database is the scheduler's most critical dependency:

```ini
# Connection pool tuning
[database]
sql_alchemy_pool_size = 10        # Base connections
sql_alchemy_max_overflow = 20     # Extra connections under load
sql_alchemy_pool_recycle = 3600   # Recycle connections every hour
sql_alchemy_pool_pre_ping = True  # Test connections before use
```

```sql
-- Essential indexes (Airflow creates these, but verify)
CREATE INDEX idx_ti_state ON task_instance(state);
CREATE INDEX idx_ti_dag_state ON task_instance(dag_id, state);
CREATE INDEX idx_dr_dag_date ON dag_run(dag_id, execution_date);

-- Monitor query performance
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
WHERE query LIKE '%task_instance%'
ORDER BY total_time DESC
LIMIT 10;
```

---

## Zombie Task Detection

### What Is a Zombie Task?

A zombie task is a TaskInstance that the database says is `running`, but no worker process is actually executing it.

```mermaid
graph TB
    subgraph "How Zombies Are Created"
        NORMAL["Task running normally"] --> CRASH["Worker crashes<br/>(OOM, hardware failure)"]
        CRASH --> ZOMBIE["DB still says 'running'<br/>but nobody is running it<br/>🧟 ZOMBIE"]
    end
    
    subgraph "Other Causes"
        NETWORK["Network partition<br/>(worker can't reach DB)"]
        KILLED["Process killed by OS<br/>(OOM Killer)"]
        DEPLOY["Worker redeployed<br/>(Kubernetes pod eviction)"]
    end
    
    NETWORK --> ZOMBIE
    KILLED --> ZOMBIE
    DEPLOY --> ZOMBIE

    style ZOMBIE fill:#ff6b6b,color:#fff
```

### How Detection Works

```python
# Simplified zombie detection
def _find_zombies(self):
    # Find tasks marked 'running' with stale heartbeat
    threshold = now() - timedelta(seconds=self.zombie_threshold)
    
    zombies = session.query(TaskInstance)\
        .filter(TaskInstance.state == 'running')\
        .filter(TaskInstance.latest_heartbeat < threshold)\
        .all()
    
    for zombie in zombies:
        log.warning(f"Zombie detected: {zombie.dag_id}.{zombie.task_id}")
        
        if zombie.try_number < zombie.max_tries:
            zombie.state = 'up_for_retry'
        else:
            zombie.state = 'failed'
            # Trigger failure callback
            zombie.handle_failure(error="Zombie task detected", session=session)
```

### Configuration

```ini
[scheduler]
# Time (seconds) before considering a task as zombie
scheduler_zombie_task_threshold = 300  # 5 minutes default

# How often to run zombie detection
zombie_detection_interval = 10.0  # seconds
```

> **⚠️ Warning:** Setting `scheduler_zombie_task_threshold` too low can cause false positives — tasks might be marked as zombies during normal execution (e.g., a task that legitimately doesn't send a heartbeat for a few minutes because it's doing heavy computation). Too high means actual zombies aren't detected quickly.

---

## Dead Letter Queue Pattern

For tasks that repeatedly fail despite retries, implement a dead letter queue pattern:

```python
from airflow.decorators import dag, task
from datetime import datetime, timedelta

@dag(schedule='@daily', start_date=datetime(2024, 1, 1), catchup=False)
def pipeline_with_dlq():
    
    @task(retries=3, retry_delay=timedelta(minutes=2))
    def process_item(item: str):
        """Process a single item. May fail."""
        result = call_external_api(item)
        if not result.success:
            raise ValueError(f"Failed to process {item}")
        return {'item': item, 'status': 'success'}
    
    @task
    def handle_results(results: list):
        """Separate successes from failures."""
        successes = [r for r in results if r and r.get('status') == 'success']
        # Tasks that failed after all retries won't be in results
        print(f"Successfully processed {len(successes)} items")
    
    @task(trigger_rule='all_done')  # Runs even if upstream tasks failed
    def dead_letter_handler():
        """Process items that failed all retries."""
        from airflow.models import TaskInstance
        # Query for failed task instances in this DAG run
        failed_items = get_failed_items_from_current_run()
        if failed_items:
            # Write to a dead letter table/queue for manual review
            write_to_dead_letter_table(failed_items)
            send_alert(f"🔴 {len(failed_items)} items sent to dead letter queue")
    
    items = ['item_1', 'item_2', 'item_3', 'item_4']
    results = process_item.expand(item=items)
    handle_results(results)
    dead_letter_handler()

pipeline_with_dlq()
```

---

## Production Scenarios

### Scenario 1: Debugging a Slow Scheduler

```bash
# Step 1: Check scheduler heartbeat
airflow jobs check --job-type SchedulerJob

# Step 2: Check DAG parsing times
airflow dags report
# Look for DAGs taking > 5 seconds to parse

# Step 3: Check for import errors
airflow dags list-import-errors

# Step 4: Monitor scheduler metrics
# Check scheduler_heartbeat metric — if interval > 30s, scheduler is overloaded

# Step 5: Check database performance
# Connect to PostgreSQL and check slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Scenario 2: Scheduler Failover

```mermaid
sequenceDiagram
    participant S1 as Scheduler 1 (Primary)
    participant S2 as Scheduler 2 (Backup)
    participant DB as Metadata DB

    Note over S1,DB: Normal operation
    S1->>DB: Heartbeat (every 5s)
    S1->>DB: Schedule tasks
    S2->>DB: Heartbeat (every 5s)
    S2->>DB: Schedule tasks (might find nothing if S1 got there first)

    Note over S1: Scheduler 1 crashes! 💥
    S2->>DB: Heartbeat (every 5s)
    S2->>DB: Schedule tasks (now finds work to do)
    Note over S2: Scheduler 2 seamlessly picks up all work
    
    Note over S1,DB: Zero downtime!
```

### Scenario 3: Scaling from 100 to 1000 DAGs

```python
# Phase 1: Current state (100 DAGs, single scheduler)
# Problem: Scheduler loop takes 30 seconds

# Phase 2: Quick wins
# 1. Add HA scheduler (instant improvement)
# 2. Increase parsing_processes from 2 to 4
# 3. Review all DAGs for heavy top-level code

# Phase 3: Configuration tuning
"""
[scheduler]
parsing_processes = 8
min_file_process_interval = 60
dag_dir_list_interval = 600
max_tis_per_query = 1024
scheduler_heartbeat_sec = 5

[core]
parallelism = 128
max_active_tasks_per_dag = 16
"""

# Phase 4: Infrastructure
# Upgrade metadata DB to high-performance managed instance
# Add PgBouncer for connection pooling
# Consider splitting into 2-3 Airflow deployments by domain
```

---

## Troubleshooting

### Scheduler Health Checks

```bash
# Is the scheduler running?
airflow jobs check --job-type SchedulerJob --hostname "$(hostname)"

# How recently was the last heartbeat?
airflow jobs check --job-type SchedulerJob --allow-hierarchical

# Check scheduler logs
tail -f $AIRFLOW_HOME/logs/scheduler/latest/scheduler.log

# Check for stuck tasks
airflow tasks states-for-dag-run my_dag 2024-01-15
```

### Common Issues and Solutions

| Issue | Symptom | Root Cause | Fix |
|-------|---------|-----------|-----|
| **Scheduler not starting** | Process exits immediately | DB connection error, DAG import error | Check DB connectivity, check `airflow dags list-import-errors` |
| **Tasks stuck in 'none'** | Tasks never get scheduled | Scheduler loop too slow, dependencies not met | Increase `parsing_processes`, check upstream task states |
| **Tasks stuck in 'scheduled'** | Tasks never get queued | Concurrency limits reached, pool exhaustion | Increase `parallelism`, add pool slots |
| **Tasks stuck in 'queued'** | Tasks never start running | No available workers, executor misconfiguration | Start more workers, check executor config |
| **Scheduler loop > 30s** | Everything is slow | Too many DAGs, heavy parsing | Optimize DAGs, HA schedulers, increase `min_file_process_interval` |
| **Zombie tasks accumulating** | Tasks marked running but not executing | Worker crashes, network issues | Check worker health, review `zombie_threshold` |
| **DAG runs piling up** | More runs created than completed | Tasks slower than schedule interval | Reduce schedule frequency or optimize task duration |

### Scheduler Metrics to Monitor

```python
# Key Prometheus/StatsD metrics to monitor
scheduler_metrics = {
    'scheduler_heartbeat': {
        'description': 'Time since last heartbeat',
        'alert_if': '> 30 seconds',
    },
    'dag_processing.total_parse_time': {
        'description': 'Time to parse all DAG files',
        'alert_if': '> 60 seconds',
    },
    'scheduler.tasks.starving': {
        'description': 'Tasks that have been scheduled but not queued',
        'alert_if': '> 100',
    },
    'scheduler.tasks.running': {
        'description': 'Number of currently running tasks',
        'alert_if': '> 90% of parallelism',
    },
    'scheduler.orphaned_tasks.cleared': {
        'description': 'Zombie tasks detected and cleared',
        'alert_if': '> 0 consistently',
    },
    'dag_processing.import_errors': {
        'description': 'Number of DAG files with import errors',
        'alert_if': '> 0',
    },
}
```

---

## Common Mistakes

### Mistake 1: Not Running HA Schedulers in Production

```bash
# ❌ Single scheduler — single point of failure
airflow scheduler  # Only one instance

# ✅ HA schedulers — automatic failover
# Machine 1: airflow scheduler
# Machine 2: airflow scheduler
# They coordinate via database row-level locking
```

### Mistake 2: Setting Heartbeat Too Low

```ini
# ❌ Too aggressive — scheduler burns CPU
scheduler_heartbeat_sec = 1

# ✅ Balanced — responsive without waste
scheduler_heartbeat_sec = 5
```

### Mistake 3: Ignoring Parsing Performance

```python
# ❌ This DAG file takes 30 seconds to parse
import pandas as pd
import tensorflow as tf
config = requests.get('https://api.company.com/config')

# ✅ This DAG file takes 0.1 seconds to parse
from airflow import DAG
from airflow.operators.python import PythonOperator
```

### Mistake 4: Not Setting `max_active_runs`

```python
# ❌ No limit — backfill creates 365 concurrent runs
with DAG('my_dag', catchup=True, start_date=datetime(2023, 1, 1)) as dag: ...

# ✅ Controlled — only 3 runs at a time
with DAG('my_dag', catchup=True, max_active_runs=3, ...) as dag: ...
```

### Mistake 5: Using SQLite with HA Schedulers

```ini
# ❌ SQLite doesn't support row-level locking — HA won't work
sql_alchemy_conn = sqlite:///airflow.db

# ✅ PostgreSQL supports SKIP LOCKED
sql_alchemy_conn = postgresql+psycopg2://user:pass@host:5432/airflow
```

---

## Interview Questions

### Beginner Level

**Q1: What does the Airflow scheduler do?**

> **A:** The scheduler continuously (1) parses DAG files to discover workflows, (2) creates DagRuns based on schedules, (3) evaluates task dependencies and marks ready tasks as scheduled, (4) sends scheduled tasks to the executor for execution, (5) processes task completion/failure events, and (6) detects zombie tasks.

**Q2: What is a zombie task?**

> **A:** A zombie task is a TaskInstance that the metadata database says is `running`, but no worker process is actually executing it. This happens when a worker crashes (OOM, hardware failure), the process is killed by the OS, or a Kubernetes pod is evicted. The scheduler periodically checks for tasks with stale heartbeats and marks them as failed or up-for-retry.

**Q3: Why can't you use SQLite with multiple schedulers?**

> **A:** Multiple schedulers coordinate via `SELECT ... FOR UPDATE SKIP LOCKED`, which is a PostgreSQL/MySQL feature for row-level locking. SQLite doesn't support this — it only supports file-level locking, which would cause contention and potential data corruption with multiple schedulers.

### Intermediate Level

**Q4: Explain how multiple Airflow schedulers avoid scheduling the same task twice.**

> **A:** Airflow uses `SELECT ... FOR UPDATE SKIP LOCKED` in PostgreSQL. When Scheduler 1 queries for schedulable tasks, it locks those rows. When Scheduler 2 runs the same query simultaneously, `SKIP LOCKED` causes it to skip the already-locked rows and find other tasks to process. After Scheduler 1 updates the task state and commits, the lock is released. This ensures each task is processed by exactly one scheduler without any explicit leader election.

**Q5: What is the mini-scheduler and why does it improve performance?**

> **A:** The mini-scheduler allows workers to schedule downstream tasks immediately after a task completes, bypassing the main scheduler loop. Without it, after Task A completes, Task B must wait for the next scheduler heartbeat (default 5 seconds) to be evaluated. With the mini-scheduler, the worker that completed Task A checks if Task B's dependencies are met and schedules it immediately. In a DAG with 100 sequential tasks, this can save 500 seconds of cumulative wait.

**Q6: How would you tune the scheduler for 500 DAGs that are currently slow?**

> **A:** (1) Enable HA with 2-3 schedulers to distribute work. (2) Increase `parsing_processes` to 4-8 for faster DAG parsing. (3) Increase `min_file_process_interval` to 60+ seconds to reduce unnecessary re-parsing. (4) Review DAGs for heavy top-level code and refactor. (5) Use `.airflowignore` to exclude non-DAG files. (6) Increase `max_tis_per_query` to process more tasks per loop. (7) Ensure the metadata database is on a dedicated, well-provisioned instance with connection pooling (PgBouncer). (8) Monitor `dag_processing.total_parse_time` to track improvements.

### Advanced Level

**Q7: Explain the complete lifecycle of a task from "DAG file saved" to "task succeeded", mentioning every component involved.**

> **A:** (1) DAG file saved to DAG folder. (2) **DagFileProcessor** discovers file during scan (per `dag_dir_list_interval`). (3) DagFileProcessor imports Python module, finds DAG objects, validates, and serializes to **metadata DB**. (4) **Scheduler** main loop reads DAG schedule, determines a new DagRun is needed, creates DagRun and TaskInstance records (state: `none`). (5) Scheduler evaluates dependencies, sets TaskInstance to `scheduled`, then `queued`. (6) Scheduler sends task to **Executor**. (7) Executor enqueues to **message queue** (Celery) or creates **K8s pod**. (8) **Worker** picks up task, sets state to `running`, reads DAG file, executes task code. (9) Worker writes **logs** to storage. (10) Task code may interact with **external systems**. (11) Worker sets state to `success` in DB. (12) **Mini-scheduler** on worker checks downstream dependencies. (13) Main **Scheduler** loop processes executor event, confirms completion.

**Q8: Your scheduler has 3 HA instances but you notice tasks are being double-scheduled. What could cause this?**

> **A:** Possible causes: (1) **MySQL < 8.0**: `SKIP LOCKED` isn't supported, so schedulers can't coordinate. Fix: upgrade to MySQL 8.0+ or switch to PostgreSQL. (2) **Transaction isolation level wrong**: The database might not be using the expected isolation level. Check and set to `READ COMMITTED`. (3) **Connection pooling issue**: If PgBouncer is in transaction pooling mode, `FOR UPDATE` might not work correctly across connections. Fix: use session pooling mode or direct connections for schedulers. (4) **Clock skew**: If scheduler machines have significantly different clocks, the `latest_heartbeat` comparison could be wrong. Fix: use NTP synchronization. (5) **Custom executor bug**: If using a custom executor, the `sync()` method might be reporting incorrect states.

**Q9: Design a monitoring and alerting strategy specifically for the Airflow scheduler.**

> **A:** Monitor: (1) **Scheduler heartbeat interval** — alert if > 30s (scheduler is overloaded or dead). (2) **DAG parsing time** — alert if any file > 10s or total > 2 minutes. (3) **Import errors count** — alert if > 0 (broken DAGs). (4) **Task scheduling latency** (time from `none` to `queued`) — alert if > 60s. (5) **Zombie tasks count** — alert if > 0 consistently (worker instability). (6) **Pool utilization** — alert if > 90% for extended periods. (7) **Database connection pool** — alert if > 80% utilized. (8) **Scheduler process CPU/memory** — alert on anomalies. Implementation: Export StatsD/Prometheus metrics from Airflow, visualize in Grafana, alert via PagerDuty for critical issues and Slack for warnings. Create a meta-DAG that runs every 5 minutes to check scheduler health via the API.

**Q10: Explain why `depends_on_past=True` can cause scheduling deadlocks, and how to resolve them.**

> **A:** With `depends_on_past=True`, a task only runs if the same task in the *previous* DagRun succeeded. If the previous DagRun's task failed and nobody retries it, all future DagRuns are blocked forever — a scheduling deadlock. The chain: Jan 1 task fails → Jan 2 task waits for Jan 1 success → Jan 3 waits for Jan 2 → ... → Every future run is stuck. **Resolution**: (1) Clear the failed task instance in the problematic DagRun (`airflow tasks clear`). (2) Set `wait_for_past_depends_before_skipping=True` to auto-skip after a timeout. (3) Avoid `depends_on_past=True` unless absolutely necessary — use explicit data quality checks instead. (4) If you must use it, always pair with `on_failure_callback` alerting so failures are caught immediately.

---

## Key Takeaways

> **1.** The scheduler is Airflow's brain — it parses DAGs, creates DagRuns, schedules tasks, sends them to executors, processes events, and detects zombies.
>
> **2.** The scheduler loop runs every `scheduler_heartbeat_sec` (default 5s), evaluating all active DAGs and tasks.
>
> **3.** DAG parsing happens in separate processes to isolate the scheduler from buggy DAG files.
>
> **4.** Multiple schedulers coordinate via database row-level locking (`SKIP LOCKED`) — no leader election needed.
>
> **5.** The mini-scheduler (Airflow 2.x) dramatically reduces inter-task latency by scheduling downstream tasks on the worker.
>
> **6.** Zombie detection catches tasks that appear running but have no active worker process.
>
> **7.** Performance tuning focuses on: parsing speed, loop frequency, concurrency limits, and database performance.

---

**[← Previous: DAGs](04-dags.md) | [Home](../README.md) | [Next →](06-operators.md)**
