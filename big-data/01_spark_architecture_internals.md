# ⚡ Module 1: Apache Spark — Architecture & Internals

[⬅️ Back to Hub](spark-flink-guide.md) | [➡️ Next: Execution Engine Deep Dive](02_spark_execution_engine.md)

---

## 1. What is Apache Spark?

Apache Spark is a **unified analytics engine** for large-scale data processing. Originally developed at UC Berkeley's AMPLab in 2009, it became an Apache top-level project in 2014. Spark provides:

- **Speed**: 100x faster than Hadoop MapReduce (in-memory), 10x faster on disk
- **Unified**: Batch, streaming, ML, and graph processing in one engine
- **Ease of Use**: High-level APIs in Java, Scala, Python, R, and SQL
- **Generality**: Libraries for SQL, streaming, ML, and graph computation

> **Spark 4.0** (released May 2025) is the latest major release, bringing ANSI SQL compliance, the VARIANT data type, Spark Connect maturation, and Java 17 as the default JDK.

---

## 2. High-Level Architecture

```mermaid
graph TB
    subgraph "Driver Program"
        SC["SparkContext /\nSparkSession"]
        DAG["DAGScheduler"]
        TS["TaskScheduler"]
        SC --> DAG --> TS
    end

    subgraph "Cluster Manager"
        CM["YARN / Kubernetes /\nStandalone / Mesos"]
    end

    subgraph "Worker Node 1"
        E1["Executor 1"]
        C1["Cache"]
        T1a["Task"] & T1b["Task"]
        E1 --> C1
        E1 --> T1a & T1b
    end

    subgraph "Worker Node 2"
        E2["Executor 2"]
        C2["Cache"]
        T2a["Task"] & T2b["Task"]
        E2 --> C2
        E2 --> T2a & T2b
    end

    subgraph "Storage"
        HDFS["HDFS / S3 / GCS"]
    end

    TS <--> CM
    CM --> E1 & E2
    E1 & E2 <--> HDFS
```

### Key Components

| Component | Role |
|:---|:---|
| **Driver** | The "brain" — creates SparkContext, builds DAG, schedules tasks |
| **SparkSession** | Unified entry point (replaces SparkContext, SQLContext, HiveContext) |
| **Cluster Manager** | Allocates resources (executors) across the cluster |
| **Executor** | A JVM process on a worker node that runs tasks and stores data |
| **Task** | The smallest unit of work — processes one partition of data |
| **Cache/Storage** | In-memory (or disk) data caching for iterative algorithms |

---

## 3. Application Lifecycle — From Code to Execution

Understanding how Spark translates your code into distributed computation is the **#1 most important** internals concept.

```mermaid
graph LR
    A["User Code\n(DataFrame API / SQL)"] --> B["Logical Plan"]
    B --> C["Optimized Logical Plan\n(Catalyst)"]
    C --> D["Physical Plan\n(Tungsten)"]
    D --> E["DAG of RDDs"]
    E --> F["Stages\n(shuffle boundaries)"]
    F --> G["TaskSets"]
    G --> H["Individual Tasks\n(one per partition)"]
```

### Step-by-Step Breakdown

1. **User writes code** using the DataFrame/Dataset API or SQL
2. **Catalyst Optimizer** creates a Logical Plan, then optimizes it (predicate pushdown, join reordering, etc.)
3. **Physical Plan** is generated — Catalyst picks the best execution strategy
4. **Tungsten** generates optimized Java bytecode
5. **DAG is built** — a graph of RDD transformations
6. **DAGScheduler** breaks the DAG into **Stages** at shuffle boundaries
7. Each Stage is decomposed into **Tasks** (one per partition)
8. **TaskScheduler** sends tasks to available Executors

---

## 4. The Driver Program — In Detail

The Driver is the process where your `main()` function runs. It's responsible for:

```mermaid
graph TD
    D["Driver Program"] --> A["1. Create SparkSession"]
    D --> B["2. Transform user code\ninto Logical Plan"]
    D --> C["3. Optimize via Catalyst"]
    D --> E["4. Build DAG of stages"]
    D --> F["5. Schedule tasks on executors"]
    D --> G["6. Monitor task progress"]
    D --> H["7. Collect results"]

    style D fill:#FFF3E0,stroke:#FF9800,color:#000
```

### Driver Memory Pitfalls

> [!CAUTION]
> The Driver is a **single JVM**. These operations can crash it:
> - `collect()` on a large DataFrame → pulls ALL data to the Driver
> - Large broadcast variables that exceed Driver memory
> - Too many accumulated task results (e.g., thousands of small tasks)

```python
# ❌ DANGEROUS — pulls entire DataFrame to Driver memory
huge_df.collect()

# ✅ SAFE — take only what you need
huge_df.take(100)
huge_df.show(20)
```

---

## 5. Executors — The Workhorses

Each Executor is a **long-running JVM process** on a worker node. Key characteristics:

| Property | Description |
|:---|:---|
| **Cores** | Number of concurrent tasks the executor can run (`spark.executor.cores`) |
| **Memory** | JVM heap for task execution + caching (`spark.executor.memory`) |
| **Lifetime** | Lives for the entire duration of the Spark application |
| **Isolation** | Each application gets its own set of executors (no sharing between apps) |

### Executor Internal Architecture

```mermaid
graph TB
    subgraph "Executor JVM"
        subgraph "On-Heap Memory"
            EM["Execution Memory\n(Shuffles, Joins, Sorts)"]
            SM["Storage Memory\n(Cache, Broadcast)"]
            UM["User Memory\n(UDFs, Data Structures)"]
            RM["Reserved Memory\n(300 MB fixed)"]
        end

        subgraph "Off-Heap Memory"
            OH["Off-Heap Storage\n(Project Tungsten)"]
        end

        subgraph "Task Slots"
            T1["Task Thread 1"]
            T2["Task Thread 2"]
            T3["Task Thread N"]
        end
    end

    subgraph "Overhead (Non-JVM)"
        OV["PySpark Workers\nNetwork Buffers\nOS Overhead"]
    end
```

> [!TIP]
> **Unified Memory Management** (since Spark 1.6): Execution and Storage memory share a common pool. If one region is empty, the other can borrow from it. Execution memory can evict Storage memory if needed, but not vice versa.

---

## 6. RDD — The Foundation

**Resilient Distributed Dataset (RDD)** is Spark's fundamental data abstraction. Everything in Spark — DataFrames, Datasets, SQL — compiles down to RDD operations internally.

### Five Properties of an RDD

```mermaid
graph TB
    RDD["RDD"] --> P1["1. List of Partitions"]
    RDD --> P2["2. Function to compute\neach partition"]
    RDD --> P3["3. List of dependencies\n(parent RDDs)"]
    RDD --> P4["4. Partitioner\n(for key-value RDDs)"]
    RDD --> P5["5. Preferred locations\n(data locality hints)"]
```

### Narrow vs Wide Dependencies

This distinction is **critical** — it determines where Spark draws stage boundaries.

```mermaid
graph LR
    subgraph "Narrow Dependencies"
        direction TB
        A1["Partition 1"] --> B1["Partition 1"]
        A2["Partition 2"] --> B2["Partition 2"]
        A3["Partition 3"] --> B3["Partition 3"]
    end

    subgraph "Wide Dependencies (Shuffle)"
        direction TB
        C1["Partition 1"] --> D1["Partition 1"] & D2["Partition 2"] & D3["Partition 3"]
        C2["Partition 2"] --> D1 & D2 & D3
        C3["Partition 3"] --> D1 & D2 & D3
    end
```

| Type | Description | Examples | Stage Impact |
|:---|:---|:---|:---|
| **Narrow** | Each parent partition maps to at most one child partition | `map`, `filter`, `flatMap`, `union` | Same stage |
| **Wide** | Each parent partition maps to **multiple** child partitions | `groupByKey`, `reduceByKey`, `join`, `repartition` | **New stage** (shuffle boundary) |

---

## 7. Fault Tolerance: Lineage-Based Recovery

Unlike traditional systems that replicate data for fault tolerance, Spark uses **lineage** — the history of transformations.

```mermaid
graph LR
    A["textFile\n(HDFS)"] -->|"flatMap"| B["words RDD"]
    B -->|"map(w → w,1)"| C["pairs RDD"]
    C -->|"reduceByKey"| D["counts RDD"]

    D -.->|"Partition 2\nlost!"| E["Recompute from\nlineage"]
    E -.->|"Replay: textFile →\nflatMap → map →\nreduceByKey"| F["Partition 2\nrecovered!"]

    style E fill:#FFEBEE,stroke:#F44336,color:#000
    style F fill:#E8F5E9,stroke:#4CAF50,color:#000
```

### How It Works
1. Each RDD remembers the chain of transformations that created it
2. If a partition is lost (executor crash), Spark traces back through the lineage
3. Only the **lost partitions** are recomputed — not the entire dataset
4. Narrow dependencies require recomputing from only the parent partition
5. Wide dependencies may require recomputing from multiple parents (more expensive)

> [!IMPORTANT]
> **Checkpointing** breaks the lineage by saving the RDD to stable storage (HDFS/S3). Use it for:
> - Very long lineage chains (iterative algorithms)
> - RDDs with wide dependencies that are expensive to recompute

```python
# Set checkpoint directory
spark.sparkContext.setCheckpointDir("hdfs:///checkpoints")

# Checkpoint a frequently-reused RDD
expensive_rdd.checkpoint()
expensive_rdd.count()  # Triggers the checkpoint
```

---

## 8. Cluster Managers — Compared

```mermaid
graph TB
    subgraph "Deployment Options"
        SA["Standalone\n(Built-in)"]
        YA["Apache YARN\n(Hadoop)"]
        K8["Kubernetes\n(Cloud-Native)"]
        ME["Apache Mesos\n(Deprecated in 4.0)"]
    end

    SA -->|"Simplest"| DEV["Development\n& Small Clusters"]
    YA -->|"Mature"| ENT["Enterprise\nHadoop Clusters"]
    K8 -->|"Modern"| CLD["Cloud-Native\nProduction"]
    ME -->|"Legacy"| LEG["Legacy Systems"]

    style K8 fill:#E8F5E9,stroke:#4CAF50,color:#000
    style YA fill:#E3F2FD,stroke:#2196F3,color:#000
```

| Manager | Pros | Cons | Best For |
|:---|:---|:---|:---|
| **Standalone** | Zero dependencies, easy setup | No multi-tenancy, limited features | Development, small teams |
| **YARN** | Mature, multi-tenant, Hadoop integration | Heavy, tightly coupled to Hadoop | Existing Hadoop infrastructure |
| **Kubernetes** | Cloud-native, elastic, containerized | Complex setup, networking overhead | Cloud production, microservices |
| **Mesos** | Fine-grained sharing | Deprecated in Spark 4.0 | Don't use for new projects |

---

## 9. Spark 4.0 — What's New (May 2025)

### Major Highlights

| Feature | Description | Impact |
|:---|:---|:---|
| **ANSI SQL Mode (Default)** | Strict type checking, runtime exceptions for invalid ops | Catches bugs earlier, PostgreSQL-like behavior |
| **VARIANT Data Type** | Native semi-structured data (JSON) storage + querying | No more exploding JSON strings; direct nested queries |
| **Spark Connect (GA)** | Thin client-server architecture, 1.5 MB Python client | Remote execution, language-agnostic (Go, Swift, Rust) |
| **Pipe Syntax (`\|>`)** | Functional-style SQL chaining | `SELECT * FROM t \|> WHERE x > 5 \|> LIMIT 10` |
| **`transformWithState`** | Arbitrary stateful processing in Structured Streaming | Timers, TTL, state schema evolution |
| **Python Data Source API** | Create custom data sources in pure Python | No Scala/Java needed |
| **Java 17 Default** | Modern JVM with better GC, performance | Improved garbage collection, security |
| **Structured Logging** | Machine-readable JSON logs | Better observability in production |

### Spark Connect Architecture (Spark 4.0)

```mermaid
graph LR
    subgraph "Client Side"
        PY["Python Client\n(1.5 MB)"]
        JV["Java Client"]
        GO["Go Client"]
        RS["Rust Client"]
    end

    subgraph "Spark Connect Server"
        GR["gRPC Server"]
        AN["Plan Analyzer"]
        EX["Execution Engine"]
    end

    subgraph "Cluster"
        DR["Driver"]
        E1["Executor 1"]
        E2["Executor N"]
    end

    PY & JV & GO & RS -->|"gRPC (Protobuf)"| GR
    GR --> AN --> EX --> DR
    DR --> E1 & E2
```

> [!TIP]
> **Spark Connect** decouples the client from the Spark cluster. This means:
> - You can run PySpark from a **Jupyter notebook** without installing Spark locally
> - Multiple languages can connect to the **same** Spark cluster
> - **Resource isolation**: Client failures don't crash the Spark Driver

---

## 10. Interview Essentials 🎯

### Q1: What happens when you call `spark.read.csv("data.csv").filter(...).groupBy(...).count().show()`?

**Answer:**
1. `spark.read.csv()` → Creates an unresolved logical plan
2. `filter()` → Adds a Filter node to the plan (lazy)
3. `groupBy().count()` → Adds Aggregate node (lazy)
4. `.show()` → **Action!** Triggers the entire pipeline:
   - Catalyst optimizes the logical plan (pushes filter before groupBy if possible)
   - Physical plan selected (hash aggregate vs sort aggregate)
   - DAG built, stages created at the shuffle boundary (groupBy)
   - Tasks launched on executors
   - Results collected to Driver and printed

### Q2: Why is Spark faster than MapReduce?

| Factor | MapReduce | Spark |
|:---|:---|:---|
| **Storage** | Writes intermediate results to disk (HDFS) | Keeps data in memory between stages |
| **Execution** | Two-phase model (Map → Reduce) only | DAG-based, arbitrary pipeline of operations |
| **Optimization** | None (user must optimize manually) | Catalyst optimizer + Tungsten code generation |
| **Iteration** | Each iteration reads from and writes to disk | Caches data in memory for iterative algorithms |

### Q3: What is the difference between `repartition()` and `coalesce()`?

- `repartition(n)`: **Full shuffle** → can increase or decrease partitions. Produces evenly distributed partitions.
- `coalesce(n)`: **No shuffle** → can only **decrease** partitions. Merges existing partitions (may be uneven).
- Use `coalesce()` when reducing partitions to avoid expensive shuffle.

---

📄 **Navigation:**
[⬅️ Back to Hub](spark-flink-guide.md) | [➡️ Next: Execution Engine Deep Dive](02_spark_execution_engine.md)
