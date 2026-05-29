# Deep Dive: Apache Airflow Architecture & Internals

📄 **Navigation:**
[🏠 Back to Index](airflow_comprehensive_guide.md) | [Next: Module 2](02_core_concepts_deep_dive.md) ➔

---

## 1. The Big Picture: System Architecture

The following diagram illustrates the modern Airflow architecture (3.0+) and how the different services interact with each other and the Metadata Database.

```mermaid
graph TD
    subgraph Airflow Core Services
        S[Scheduler]
        W[Webserver]
        DP[DAG Processor]
        T[Triggerer]
    end

    subgraph Database Layer
        DB[("Metadata Database \n PostgreSQL / MySQL")]
    end

    subgraph Execution Layer
        E[Executor]
        W1[Worker Node 1]
        W2[Worker Node 2]
    end
    
    subgraph Storage Layer
        VCS[DAG Files / Git Repo]
    end

    %% Connections
    VCS -.->|Parses Python Files| DP
    DP -->|Writes DAG structure| DB
    
    S -->|Reads DAGs & State| DB
    S -->|Schedules/Queues| E
    
    W -->|Reads State/Logs| DB
    W -.->|Fetches Logs| W1
    W -.->|Fetches Logs| W2
    
    T -->|Reads Deferred Tasks| DB
    T -->|Writes Task State| DB

    E -->|Dispatches Tasks| W1
    E -->|Dispatches Tasks| W2
    
    W1 -->|Updates Task State| DB
    W2 -->|Updates Task State| DB

    classDef core fill:#f9f,stroke:#333,stroke-width:2px;
    classDef db fill:#ff9,stroke:#333,stroke-width:2px;
    classDef exec fill:#9f9,stroke:#333,stroke-width:2px;
    classDef storage fill:#99f,stroke:#333,stroke-width:2px;
    
    class S,W,DP,T core;
    class DB db;
    class E,W1,W2 exec;
    class VCS storage;
```

---

## 2. Component Internals: How They Actually Work

### A. The DAG Processor
In older versions of Airflow, the Scheduler was responsible for both parsing Python files and scheduling tasks. This caused performance bottlenecks. Now, the **DAG Processor** is a standalone component.

1.  **Scanning:** It continuously scans your `dags_folder` (usually synced via Git).
2.  **Parsing:** It executes the Python code at the top level of your DAG files.
3.  **Serialization:** It converts the DAG structure (tasks, dependencies, schedules) into a serialized JSON format.
4.  **Storage:** It saves this serialized DAG into the Metadata Database. 
*Why?* So the Webserver and Scheduler don't have to parse Python code; they just read the fast JSON representation from the DB.

### B. The Scheduler Internals (The Heartbeat)
The Scheduler is a multi-process component. It runs a continuous loop (the "Heartbeat") to determine what needs to run.

**The Scheduling Loop Workflow:**
```mermaid
sequenceDiagram
    participant S as Scheduler
    participant DB as Metadata DB
    participant E as Executor

    loop Every Scheduler Heartbeat
        S->>DB: Query for DAGs that are "due" (based on schedule)
        DB-->>S: Return Due DAGs
        S->>DB: Create "DagRun" records (State: Running)
        S->>DB: Query for Tasks inside Running DAGs whose dependencies are met
        DB-->>S: Return "Schedulable" Tasks
        S->>DB: Update Task State to "Queued"
        S->>E: Send Queued Tasks to Executor
    end
```

### C. The Triggerer & Deferrable Operators
Historically, if a task needed to wait for an external event (e.g., waiting for an EMR cluster to start), it would sit in a "running" state on a Worker node, consuming a valuable worker slot and CPU/RAM while doing nothing but sleeping.

Enter the **Triggerer** (introduced in 2.2, perfected in 3.0).

1.  A worker starts a task using a **Deferrable Operator**.
2.  The operator realizes it needs to wait. It suspends itself, freeing up the worker slot, and registers a "Trigger" with the Metadata DB.
3.  The **Triggerer** service runs in an asyncio loop, efficiently monitoring thousands of triggers simultaneously (e.g., polling an API).
4.  Once the event occurs, the Triggerer updates the DB, and the task is thrown back to the Executor to resume on a normal Worker.

---

## 3. Executor Internals: Celery vs. Kubernetes

The Executor is the mechanism by which task instances get run. It is an API/Interface, not a physical server.

### The Celery Executor Architecture
Used for high-throughput, predictable workloads. It relies on a Message Broker (RabbitMQ/Redis).

```mermaid
graph LR
    S[Scheduler] -->|Enqueues Task ID| B[("Message Broker \n Redis/RabbitMQ")]
    B -->|Pulls Task ID| W1[Celery Worker 1]
    B -->|Pulls Task ID| W2[Celery Worker 2]
    
    W1 -.->|Runs `airflow tasks run`| DB[(Metadata DB)]
    W2 -.->|Runs `airflow tasks run`| DB
```
*   **Pros:** Instant task startup (workers are always running). High throughput.
*   **Cons:** "Noisy neighbor" problem. If Worker 1 runs out of memory because of Task A, Task B running on the same worker might fail.

### The Kubernetes Executor Architecture
Used for dynamic scaling, resource isolation, and cloud-native environments.

```mermaid
graph TD
    S[Scheduler] -->|API Call: Create Pod| K8s[Kubernetes API Server]
    K8s --> P1["Pod: Task A \n (1 CPU, 2GB RAM)"]
    K8s --> P2["Pod: Task B \n (4 CPU, 16GB RAM)"]
    
    P1 -.->|Updates State| DB[(Metadata DB)]
    P2 -.->|Updates State| DB
    
    P1 -->|Terminates on Completion| K8s
    P2 -->|Terminates on Completion| K8s
```
*   **Pros:** Total isolation. You can specify exact CPU/RAM limits per task. Scales to absolute zero when no tasks are running.
*   **Cons:** Slower startup time (it takes time for Kubernetes to provision and spin up a new Pod).

---

## 4. State Transitions (The Task Lifecycle)

Understanding the lifecycle of a task is critical for debugging.

```mermaid
stateDiagram-v2
    [*] --> None: Task defined
    None --> Scheduled: Dependencies met
    Scheduled --> Queued: Scheduler sent to Executor
    Queued --> Running: Worker picks up task
    
    Running --> Success: Completed without error
    Running --> Failed: Threw an exception
    Running --> UpForRetry: Failed, but retries remaining
    Running --> Deferred: Waiting on Triggerer
    
    UpForRetry --> Scheduled
    Deferred --> Scheduled
    
    Success --> [*]
    Failed --> [*]
```

---

📄 **Navigation:**
[🏠 Back to Index](airflow_comprehensive_guide.md) | [Next: Module 2](02_core_concepts_deep_dive.md) ➔
