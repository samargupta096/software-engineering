# 🎤 Apache Airflow Interview Guide

> **Your comprehensive guide to passing Apache Airflow interviews.**

This guide contains over 100 interview questions organized by level and topic. It focuses on testing deep understanding rather than mere memorization.

---

## 📌 The WISE Framework for Interviews

When answering questions, use the **WISE** framework:
- **W**hat is it? (Define the concept simply)
- **I**nternals (Explain how it works under the hood)
- **S**cenario (Give a real-world use case)
- **E**xperience (Share a specific time you used it or debugged it)

---

## 🟢 Beginner Level (Concepts & Basics)

### 1. What is Apache Airflow and what problem does it solve?
**Answer:**
- **What:** Airflow is an open-source platform to programmatically author, schedule, and monitor workflows.
- **Problem solved:** It solves the problems of cron jobs and unmanaged scripts by providing dependency management, retries, backfilling, monitoring, and an auditable history of execution.
- **Key feature:** Workflows are defined as code (Python), making them versionable, testable, and collaborative.

### 2. What is a DAG?
**Answer:**
- **What:** A Directed Acyclic Graph.
- **Concept:** It's a collection of all the tasks you want to run, organized in a way that reflects their relationships and dependencies.
- **Directed:** Tasks flow in one direction (A -> B -> C).
- **Acyclic:** No loops allowed. A task cannot depend on itself or cause a cycle (A -> B -> A is invalid).

### 3. What is an Operator?
**Answer:**
An Operator represents a single, ideally idempotent, task in a DAG. It acts as a template for carrying out a specific type of work.
- **Examples:** `BashOperator` (runs a bash command), `PythonOperator` (calls a Python function), `PostgresOperator` (executes SQL).

### 4. What is the difference between an Operator, a Task, and a Task Instance?
**Answer:**
- **Operator:** The template or class definition (e.g., `BashOperator`).
- **Task:** An instantiated Operator within a DAG (e.g., `run_script = BashOperator(task_id='run_script', ...)`).
- **Task Instance:** A specific run of that task for a specific point in time (e.g., `run_script` for `2023-10-01`).

### 5. What are Sensors in Airflow?
**Answer:**
Sensors are a special type of Operator designed to wait for something to happen (a condition to be met).
- **Use case:** Waiting for a file to arrive in S3, a partition to be created in Hive, or an external API to return a certain status.
- **How they work:** They evaluate a condition periodically (poke) until it returns `True`.

### 6. Explain `execution_date` vs `data_interval_start`.
**Answer:**
- **`execution_date` (Legacy):** The *logical* date and time for which a DAG Run is executing. It marks the *start* of the data interval the run is processing.
- **`data_interval_start` & `data_interval_end` (Airflow 2.2+):** Represents the exact time period the data being processed covers. If a daily DAG runs for the 10th of October, the interval is `[2023-10-10 00:00:00, 2023-10-11 00:00:00)`.

### 7. What is Idempotency and why is it important in Airflow?
**Answer:**
- **What:** An operation is idempotent if executing it multiple times yields the same result as executing it once.
- **Why:** If a task fails halfway through and Airflow retries it, or if you clear a task to run it again, it shouldn't produce duplicate data or side effects (like sending 5 emails).
- **Example:** `INSERT OVERWRITE` is idempotent. `INSERT INTO` is not.

### 8. What are XComs?
**Answer:**
- **What:** Cross-Communication. A mechanism that allows tasks to talk to each other.
- **How:** Tasks can "push" small amounts of data (like a job ID or status) to the metadata DB, and downstream tasks can "pull" that data.
- **Warning:** XComs are for metadata, not large dataframes.

### 9. What is a Hook?
**Answer:**
A Hook is an interface to external platforms and databases (like S3, Postgres, Hive).
- Operators use Hooks internally to perform operations. Hooks abstract away the connection details and boilerplate code for interacting with external systems.

### 10. Explain the components of Airflow Architecture.
**Answer:**
- **Webserver:** Flask app for UI and monitoring.
- **Scheduler:** Daemon that parses DAGs and decides what needs to run and when.
- **Executor:** The mechanism that handles running tasks (e.g., Local, Celery, K8s).
- **Worker:** The actual nodes/processes executing the task code.
- **Metadata DB:** Stores state of DAGs, tasks, variables, connections, etc. (usually Postgres/MySQL).

---

## 🟡 Intermediate Level (Internals & Operations)

### 11. How does the Airflow Scheduler work under the hood?
**Answer:**
The scheduler runs a continuous loop:
1. **Parse DAGs:** The `DagFileProcessor` reads Python files in the DAG folder and updates the DB with DAG structures.
2. **Create DAG Runs:** It checks if any DAGs need a new run based on their schedule and creates a `DagRun` record.
3. **Schedule Tasks:** It looks for `TaskInstances` in a created state whose dependencies are met, and marks them as `Scheduled`.
4. **Queue Tasks:** It sends `Scheduled` tasks to the Executor, updating their state to `Queued`.

### 12. Compare `LocalExecutor`, `CeleryExecutor`, and `KubernetesExecutor`.
**Answer:**
- **LocalExecutor:** Runs tasks in multiple processes on the same machine as the scheduler. Good for single-node setups.
- **CeleryExecutor:** Distributes tasks across multiple worker nodes using a message broker (Redis/RabbitMQ). Good for horizontal scaling of static worker pools.
- **KubernetesExecutor:** Creates a new K8s Pod for every task instance. Great for dynamic scaling, resource isolation, and custom environments per task, but has pod startup overhead.

### 13. What is the difference between `poke` and `reschedule` mode in Sensors?
**Answer:**
- **Poke mode (default):** The sensor occupies a worker slot continuously. It sleeps between checks. Bad for long-running sensors as it starves the worker pool.
- **Reschedule mode:** The sensor checks the condition, and if `False`, it releases the worker slot and goes to sleep. It is picked up again later. Essential for sensors waiting hours.

### 14. What are Airflow Pools?
**Answer:**
Pools are used to limit the execution parallelism on arbitrary sets of tasks.
- **Scenario:** You have 50 tasks that hit an external API, but the API rate-limits you to 5 concurrent requests. You assign those tasks to an "api_pool" with a size of 5. The scheduler will queue the rest until slots free up.

### 15. Explain `catchup` and `backfill`.
**Answer:**
- **Catchup:** A DAG parameter (`catchup=True/False`). If `True` (default in older versions), when you turn on a DAG with a `start_date` in the past, Airflow will run all missed intervals up to the present. Always set to `False` unless explicitly needed!
- **Backfill:** A CLI command (`airflow dags backfill`) to run a DAG for a specific historical date range, regardless of the `catchup` setting or whether it ran before.

### 16. How do you handle secrets and credentials in Airflow?
**Answer:**
1. **Connections UI/DB:** Stores encrypted passwords in the Metadata DB (requires `fernet_key` setup).
2. **Environment Variables:** `AIRFLOW_CONN_MY_DB=postgres://user:pass@host/db`.
3. **Secret Backends (Best Practice):** Integrate Airflow with AWS Secrets Manager, HashiCorp Vault, or GCP Secret Manager. Airflow retrieves credentials at runtime, keeping them out of the DB entirely.

### 17. What is TaskFlow API?
**Answer:**
Introduced in Airflow 2.0, it allows you to write tasks as plain Python functions using the `@task` decorator.
- **Benefit:** It automatically handles passing data between tasks using XComs, making code much cleaner and eliminating boilerplate `PythonOperator` definitions.

### 18. Explain Trigger Rules.
**Answer:**
Trigger rules define the condition for a task to execute based on its upstream tasks.
- `all_success` (default): All parents succeeded.
- `all_failed`: All parents failed.
- `one_failed`: Fires as soon as at least one parent fails.
- `none_failed`: All parents succeeded or were skipped.
- `dummy`: Run regardless of parent state.

### 19. What happens if an Airflow worker dies mid-task?
**Answer:**
- The task remains in a `running` state in the metadata DB (it's an "orphan" or "zombie").
- The Scheduler periodically runs a **zombie detection** job. If it finds a task marked running but no heartbeat from the worker, it marks the task as `failed`.
- If retries are configured, the task will be queued for another worker.

### 20. How do you pass parameters to a DAG at runtime?
**Answer:**
Using **DAG Run Configuration** (Trigger with config).
- You trigger the DAG via UI or API and pass a JSON payload (`{"target_env": "prod"}`).
- The task accesses this via Jinja templating: `{{ dag_run.conf['target_env'] }}` or via the context dictionary in Python tasks.

---

## 🔴 Advanced Level (Architecture & Scaling)

### 21. How do you scale Airflow to handle 10,000+ DAGs?
**Answer:**
Scaling requires tuning multiple layers:
1. **Scheduler Parsing:** Increase `DagFileProcessor` processes, use `.airflowignore` aggressively, ensure top-level code in DAG files is extremely lightweight (no DB/API calls).
2. **Metadata DB:** Upgrade Postgres/MySQL, use connection pooling (PgBouncer), run regular DB maintenance (vacuum, clearing old logs/runs).
3. **Execution:** Move from Celery to K8s for infinite scaling, or use CeleryKubernetesExecutor.
4. **HA:** Run multiple Schedulers (Airflow 2.0+).

### 22. What are Deferrable Operators and why are they a game-changer?
**Answer:**
- **Problem:** Traditional sensors block a worker slot. Even `reschedule` mode causes database load from constant re-queuing.
- **Solution (Airflow 2.2+):** Deferrable operators suspend themselves, release the worker slot, and offload the waiting logic to the **Triggerer** process via an asynchronous `asyncio` loop.
- **Impact:** A single Triggerer process can wait on thousands of conditions simultaneously with very little CPU/Memory, drastically reducing cost and worker starvation.

### 23. Explain how the Scheduler High Availability (HA) works in Airflow 2.0+.
**Answer:**
- Before 2.0, running two schedulers would cause them to schedule the same task twice.
- 2.0 introduced a robust DB locking mechanism (e.g., `SELECT ... FOR UPDATE SKIP LOCKED` in Postgres).
- Multiple schedulers safely query the DB for tasks to queue. If Scheduler A locks a row to queue a task, Scheduler B ignores that row and locks the next one. This provides both HA and increased scheduling throughput.

### 24. What is Dynamic Task Mapping?
**Answer:**
Introduced in 2.3, it allows a task to dynamically spawn multiple instances of itself at runtime based on the output of a previous task.
- **Usage:** `task2.expand(arg1=task1.output)`
- **Benefit:** Eliminates the need for dynamic DAG generation or complex branching loops when processing a variable number of items (e.g., files in a directory, tables in a DB).

### 25. How do you test Airflow DAGs?
**Answer:**
1. **Validation Tests:** Check for cycles, valid DAG IDs, typos (using `pytest` to assert DAG bag loads with 0 errors).
2. **Structure Tests:** Assert that task dependencies are correct (`task_a` is upstream of `task_b`).
3. **Unit Tests (Business Logic):** Extract Python logic into separate modules and test them independently of Airflow.
4. **Integration Tests:** Use `airflow tasks test` CLI command to run a single task without affecting the DB.

### 26. Describe the top-level code anti-pattern in Airflow.
**Answer:**
- **The rule:** Never put heavy computation, database connections, or API calls outside of an Operator's `execute()` method.
- **Why:** The scheduler parses DAG files every 30-60 seconds. If you have a `requests.get()` at the top level of the file, the scheduler executes that request every 30 seconds for every worker and the scheduler process, bringing down the external system and causing scheduler lag.

### 27. How does DAG Serialization work and why is it needed?
**Answer:**
- **Before:** The Webserver had to parse Python files to display the UI, leading to UI timeouts and heavy CPU usage.
- **Now:** The Scheduler parses the Python files, converts the DAG structure into JSON (Serialization), and stores it in the Metadata DB. The Webserver only reads this JSON. This isolates the Webserver from execution code and improves security and performance.

### 28. How would you design a custom Operator?
**Answer:**
1. Inherit from `BaseOperator`.
2. Define `template_fields` if you want Jinja templating to work on specific variables.
3. Define the `__init__` method, accepting `**kwargs` and passing them to `super().__init__(**kwargs)`.
4. Implement the `execute(self, context)` method containing the core logic.
5. Use existing Hooks inside `execute()` for external connections.

### 29. Explain the Airflow Executor lifecycle for a task.
**Answer:**
1. Scheduler writes task state as `Scheduled` in DB.
2. Scheduler picks it up, changes state to `Queued`, sends command to Executor.
3. Executor allocates a worker (starts process, sends to Celery queue, or spins up K8s pod).
4. Worker picks up task, sets state to `Running`.
5. Worker finishes, updates DB state to `Success` or `Failed`.

### 30. How do you handle Data Skew or long-running tasks in Airflow?
**Answer:**
Airflow is an orchestrator, not an execution engine. It doesn't handle data skew directly.
- **Strategy:** If a Spark or BigQuery job is skewed, you fix it in Spark/BQ.
- **Airflow's role:** Configure `execution_timeout` to ensure the task fails and alerts if it runs way longer than expected. Use Sensors to ensure source data is fully ready before triggering the heavy compute.

---

## 🛠️ System Design Scenarios

### 31. Design an ETL pipeline to ingest 1000 tables from Postgres to S3 daily.
**Key Design Points expected:**
- Do NOT write a DAG with 1000 hardcoded tasks.
- Do NOT write 1000 DAG files.
- **Approach:** Use a Factory Pattern to generate one DAG per schema, or use **Dynamic Task Mapping** to iterate over a list of tables fetched from a configuration file or DB table.
- **Concurrency:** Use Airflow Pools (e.g., `postgres_read_pool` set to 20) to prevent overwhelming the source database.
- **Tools:** Use `PostgresToS3Operator`.
- **Idempotency:** Load data to specific partitioned folders `s3://bucket/table/dt={{ds}}/` so reruns overwrite the exact partition.

### 32. Design an Airflow deployment architecture for a financial institution with strict security.
**Key Design Points expected:**
- **Network:** Private VPC, no public IPs for workers or DB.
- **Execution:** KubernetesExecutor for strict container isolation per task.
- **Secrets:** HashiCorp Vault backend. No connections stored in Airflow DB.
- **RBAC:** Active Directory integration for Webserver login. Role-based access (Viewers vs Editors) applied at the DAG level.
- **Logging:** Remote logging to encrypted S3 bucket.
- **Code sync:** Git-sync sidecar container pulling from a private repo.

---

## 🔥 Production Incident Scenarios

### 33. Incident: Tasks are stuck in "Queued" state and not running.
**Troubleshooting steps:**
1. **Worker Capacity:** Are all Celery workers full? Check Celery queues. Are K8s nodes maxed out? Check pod status (`Pending`).
2. **Pools:** Is the task assigned to an Airflow Pool that is full?
3. **Concurrency Limits:** Did you hit `max_active_runs` for the DAG, `max_active_tasks` for the DAG, or global `parallelism` in `airflow.cfg`?
4. **Executor Health:** Is the Redis/RabbitMQ broker down?

### 34. Incident: The Scheduler is using 100% CPU and tasks are taking 15 minutes to be scheduled.
**Troubleshooting steps:**
1. **Top-level code:** Look for someone making API/DB calls at the root level of a DAG file.
2. **Too many files:** Use `.airflowignore` to ignore non-DAG Python files, virtual envs, or tests inside the DAG folder.
3. **Parsing config:** Tune `min_file_process_interval` (increase it to parse less frequently).
4. **DB Load:** Check if the Metadata DB is under heavy load or needs a vacuum/index rebuild.

### 35. Incident: A DAG ran, all tasks show success, but the target table is empty.
**Troubleshooting steps:**
- Check for **silent failures** where a Bash/Python script caught an exception, printed an error, but exited with `sys.exit(0)` instead of `sys.exit(1)`.
- Airflow relies entirely on exit codes (Bash) or raised Exceptions (Python). If your code swallows the error, Airflow thinks it succeeded.

---

> *"The best answers in an Airflow interview show that you treat Airflow as an orchestrator, not an execution engine. You push data movement to the external systems and use Airflow just to pull the strings."*

**[← Previous](13-airflow-on-kubernetes.md) | [Home](../README.md) | [Next →](airflow-cheatsheet.md)**
