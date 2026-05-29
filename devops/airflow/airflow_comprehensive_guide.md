# 🌪️ The Ultimate Apache Airflow Guide (2025/2026 Edition)

Welcome to the definitive guide on Apache Airflow. Whether you are building simple batch scripts or massive, dynamic Data Engineering and MLOps pipelines, Airflow is the industry standard for workflow orchestration.

To provide you with the most detailed, visually rich learning experience, this guide is split into four comprehensive modules. Please explore them in order:

### 📚 Deep Dive Modules
1. **[Architecture & Internals](01_architecture_and_internals.md)**: Explore the modern Airflow 3.0+ architecture, the DAG processor, the scheduling loop heartbeat, and compare Celery vs. Kubernetes Executors using detailed diagrams.
2. **[Core Concepts & Dynamic Workflows](02_core_concepts_deep_dive.md)**: Master the TaskFlow API, understand how XComs actually work under the hood, and learn to build dynamic task maps, branching logic, and trigger rules.
3. **[Advanced Scheduling & Scaling](03_advanced_scheduling_and_scaling.md)**: Move beyond cron. Learn Data-Aware scheduling with Assets/Events, and master resource management using Pools, Priority Weights, and SLAs.
4. **[Production Best Practices](04_production_best_practices.md)**: See a real-world Data Stack architecture (dbt, Snowflake, Airflow). Learn the absolute "Do Nots" (anti-patterns), idempotency, and how to unit test your DAGs.
5. **[Real-World Projects & Pipelines](05_real_world_projects.md)**: Practical architectures and DAG workflows for Data Warehousing (ELT), Machine Learning Operations (MLOps), and Ephemeral Infrastructure Provisioning.

---

## Quick Reference Summary

### Why use Airflow?
- **Workflows as Code:** Everything is written in Python. This means you can use version control (Git), write unit tests, and perform code reviews.
- **Rich Ecosystem:** Need to talk to AWS, GCP, Slack, or Snowflake? There's a Provider package for it.
- **Scalability:** It can run on a single laptop or scale out horizontally across hundreds of Kubernetes nodes.
- **Observability:** Its UI gives you a crystal-clear view of what succeeded, what failed, and logs for every single task.

---

## 2. Core Architecture

With the release of **Airflow 3.0 (April 2025)**, Airflow moved to a highly modular, service-oriented architecture.

```mermaid
graph TD
    A[Webserver (React UI)] --> B(Metadata Database)
    C[Scheduler] --> B
    D[DAG Processor] --> B
    E[Triggerer] --> B
    C -.->|Queues Tasks| F[Executor / Message Broker]
    F --> G[Worker Node 1]
    F --> H[Worker Node 2]
    G --> B
    H --> B
```

### The Components:
1.  **Metadata Database:** (Usually PostgreSQL or MySQL). Stores everything: DAG definitions, task states, XComs, connections, and users.
2.  **Scheduler:** The brain. It constantly reads DAGs and the DB, deciding which tasks need to run and when.
3.  **Webserver:** The UI. Used to monitor DAGs, trigger runs manually, view logs, and manage connections.
4.  **DAG Processor:** Parses your Python files to extract DAG structure. (Decoupled in recent versions to prevent scheduler slowdowns).
5.  **Triggerer:** Handles deferred tasks (tasks waiting for an external event) to free up worker slots.
6.  **Executor / Workers:** The muscle. The Executor (e.g., Celery, Kubernetes) determines *where* tasks run, and the Workers actually execute them.

---

## 3. Core Concepts

### A. DAGs (Directed Acyclic Graphs)
A DAG is your workflow. 
- **Directed:** Tasks run in a specific order.
- **Acyclic:** No infinite loops. Task A -> Task B -> Task A is NOT allowed.
- **Graph:** A visual representation of tasks and dependencies.

### B. Tasks & Operators
A Task is an instance of an Operator.
- **Action Operators:** Do something (`BashOperator`, `PythonOperator`).
- **Transfer Operators:** Move data (`S3ToRedshiftOperator`).
- **Sensors:** Wait for something to happen (`FileSensor`, `HttpSensor`).

### C. The TaskFlow API (Modern Standard)
The TaskFlow API (using `@task` decorators) is the modern way to write Airflow code. It automatically handles passing data between tasks using **XComs** (Cross-Communication).

```python
from airflow.decorators import dag, task
from pendulum import datetime

@dag(start_date=datetime(2025, 1, 1), schedule="@daily", catchup=False)
def modern_etl_pipeline():

    @task
    def extract():
        # Simulating API extraction
        return {"users": ["Alice", "Bob", "Charlie"]}

    @task
    def transform(data: dict):
        # Transforming data
        return [user.upper() for user in data["users"]]

    @task
    def load(processed_data: list):
        # Loading data to a target
        print(f"Loading to DB: {processed_data}")

    # The dependencies are automatically inferred!
    raw_data = extract()
    clean_data = transform(raw_data)
    load(clean_data)

modern_etl_pipeline()
```

---

## 4. Advanced Concepts & 2025/2026 Features

### A. Event-Driven Scheduling & Assets (Airflow 3.0+)
Airflow isn't just about cron schedules anymore. You can trigger DAGs based on the availability of Data Assets.

```python
from airflow.datasets import Dataset # Or Asset in 3.0+

s3_raw_data = Dataset("s3://my-bucket/raw_data.csv")

# This DAG runs whenever s3_raw_data is updated by another DAG!
@dag(schedule=[s3_raw_data], ...) 
def process_data_dag():
    ...
```

### B. Dynamic Task Mapping
Want to process 5 files today, and 50 files tomorrow? Use `.expand()`.

```python
@task
def process_file(filename: str):
    print(f"Processing {filename}")

@task
def get_files():
    return ["file1.txt", "file2.txt", "file3.txt"]

with DAG(...) as dag:
    files = get_files()
    # Creates 3 parallel task instances dynamically!
    process_file.expand(filename=files) 
```

### C. Resource Management: Pools & Priority Weights
- **Pools:** Prevent API rate limits or DB crashes. E.g., create an "API_Pool" with 5 slots. If 20 tasks try to run, 15 will wait in the queue.
- **Priority Weights:** When resources are constrained, tasks with higher `priority_weight` run first.

### D. Task Groups (Replace SubDAGs)
Never use SubDAGs. Use Task Groups to visually organize complex DAGs in the UI without performance penalties.

---

## 5. Executors: Which one to choose?

| Executor | Where tasks run | Use Case |
| :--- | :--- | :--- |
| **LocalExecutor** | Same machine as Scheduler | Local dev, very small workloads. |
| **CeleryExecutor** | Persistent Worker Nodes | Traditional production. Great for high-throughput, fast-starting tasks. |
| **KubernetesExecutor** | A new Pod per Task | Cloud-native production. Great for total task isolation and scaling to zero. |
| **CeleryKubernetes** | Both | Hybrid workloads (fast tasks on Celery, heavy tasks on K8s). |

---

## 6. Real-World Use Case: The E-Commerce Pipeline

**Problem:** A company needs to generate a daily sales report. Data lives in a Postgres DB (transactions) and a third-party API (shipping statuses).

**Solution Architecture with Airflow:**
1. **Extract (Sensor + Operators):** 
   - An `HttpSensor` waits for the shipping API to be available.
   - A `PostgresToGCSOperator` dumps yesterday's transactions to Google Cloud Storage.
   - An `HttpToGCSOperator` dumps shipping data.
2. **Transform (Compute Engine):**
   - A `DataprocSubmitJobOperator` triggers an Apache Spark job to join and aggregate the data. (Airflow doesn't process it, Spark does!)
3. **Load:**
   - A `GCSToBigQueryOperator` loads the final report into BigQuery.
4. **Alert:**
   - On success: Notify Slack using `SlackWebhookOperator`.
   - On SLA Miss (took > 2 hours): Trigger an `sla_miss_callback` to page the on-call engineer.

---

## 7. Challenges & Anti-Patterns to Avoid

> [!CAUTION]
> **The "Godzilla" Task:** Do not write a 1000-line PythonOperator that extracts, transforms, and loads everything in pandas. If it fails at step 3, you have to restart from step 1. Keep tasks **atomic**.

> [!WARNING]
> **Top-Level Code:** Airflow parses DAG files every 30 seconds. Do NOT put API calls, database connections, or heavy processing outside of your task functions. It will crash your scheduler.

> [!WARNING]
> **Data in XComs:** Do not pass DataFrames through XComs. XComs live in the Metadata DB. Use them for metadata (paths, IDs). Pass actual data via Cloud Storage (S3/GCS).

> [!TIP]
> **Idempotency:** Write tasks so they can be run 10 times and produce the same result as running once (e.g., use `UPSERT` instead of `INSERT`). This makes rerunning failed tasks safe.

---

## 8. Local Setup via Docker Compose

Want to practice? The official Docker way is best.

1. Create a folder: `mkdir airflow-local && cd airflow-local`
2. Download docker-compose: `curl -LfO 'https://airflow.apache.org/docs/apache-airflow/stable/docker-compose.yaml'`
3. Create folders: `mkdir -p ./dags ./logs ./plugins ./config`
4. Set permissions (Linux/Mac): `echo -e "AIRFLOW_UID=$(id -u)" > .env`
5. Init DB: `docker compose up airflow-init`
6. Start: `docker compose up -d`
7. Access: `http://localhost:8080` (User/Pass: airflow)

Place your Python DAG scripts inside the `./dags` folder, and they will automatically appear in the UI!
