# 📈 Airflow Scaling Deep Dive

> **How to take Airflow from 10 DAGs to 10,000 DAGs.**

---

## 1. The Four Dimensions of Scaling

When someone says "Airflow is slow," you must define the dimension:
1. **DAG Parsing Scale:** Too many DAG files (Scheduler CPU bound).
2. **Concurrent Task Scale:** Too many tasks running simultaneously (Executor/Worker bound).
3. **Database Scale:** Too many state transitions per second (Metadata DB bound).
4. **Data Volume Scale:** Tasks processing too much data (Not an Airflow problem, push compute out).

---

## 2. Scaling the Scheduler (Parsing)

The Scheduler's biggest job is parsing Python files to find DAGs. If you have 5,000 DAG files, parsing them every 30 seconds will melt a single scheduler.

### Optimizations:
1. **`.airflowignore`:** Add regex patterns for folders, tests, and non-DAG python scripts. If the parser opens a file and it's not a DAG, you wasted CPU.
2. **Top-Level Code:** The #1 rule. NO database connections, API calls, or heavy computation outside of `execute()`.
3. **Tune `min_file_process_interval`:** Default is 0. Increase to 30 or 60. This tells the parser to wait 60 seconds before re-parsing the same file.
4. **Increase `parsing_processes`:** Use more CPU cores to parse files in parallel.
5. **Scheduler HA:** Run multiple scheduler instances. They will automatically load balance parsing and scheduling operations (requires DB locking support).

---

## 3. Scaling the Executor (Concurrency)

### CeleryExecutor
Workers are statically provisioned VMs/Pods pulling from a Redis/RabbitMQ queue.
- **Bottleneck:** You hit the `worker_concurrency` limit (default 16 per worker). If you have 10 workers, max concurrency is 160.
- **Scaling:** Use KEDA (Kubernetes Event-driven Autoscaling) to auto-scale Celery workers based on the length of the Redis queue.

### KubernetesExecutor
Every task gets its own Pod.
- **Bottleneck:** API Server limits and Pod startup latency (can take 10-20 seconds to pull image and start). If you schedule 10,000 short-lived tasks, you will DDOS the Kubernetes API Server.
- **Scaling:** Use `CeleryKubernetesExecutor`. Route short, fast tasks to the Celery queue (low latency), and route heavy, resource-intensive tasks to the K8s queue (high isolation).

---

## 4. Scaling the Database

As task concurrency increases, database transactions per second (TPS) spike.
1. **PgBouncer:** Mandatory above ~50 concurrent workers. Prevents Postgres connection exhaustion.
2. **Metadata Cleanup:** Run `airflow db clean` daily to keep tables small. Large tables mean slow index scans during scheduling.
3. **Offload Logs:** Store task logs in S3/GCS. The Webserver will fetch them from cloud storage instead of querying the DB or hitting worker APIs.

---

## 5. Scaling Configuration Parameters (`airflow.cfg`)

| Parameter | Default | Tuned | Impact |
|---|---|---|---|
| `parallelism` | 32 | 1024 | Max active tasks across the whole Airflow cluster. |
| `max_active_tasks_per_dag` | 16 | 64 | Prevents a single massive DAG from eating the whole `parallelism` budget. |
| `max_active_runs_per_dag` | 16 | 2 | Rarely need 16 instances of the *same* DAG running at once. |
| `parsing_processes` | 2 | 8 | Cores dedicated to parsing DAG files. |
| `scheduler_heartbeat_sec` | 5 | 10 | Reduces DB load by checking less frequently. |

---

## 6. The Deferrable Operator Revolution

Prior to Airflow 2.2, if you had 1000 Sensor tasks waiting for S3 files, you needed 1000 Celery worker slots blocked, doing nothing but sleeping.

**The Fix:** The Triggerer process and `AsyncOperator`.
1. The task suspends itself in the DB and gives a trigger condition to the Triggerer daemon.
2. The worker slot is freed immediately.
3. The Triggerer uses a single threaded `asyncio` loop to wait on thousands of conditions simultaneously (using almost zero CPU/RAM).
4. When the condition is met, the task is re-queued to a worker to finish.

**Impact:** Scales waiting tasks from 1-to-1 (worker-to-task) to 1-to-10,000+.

---

## 7. Scaling Checklist

- [ ] Webserver is separated from Scheduler.
- [ ] Celery backend is Redis, not the Metadata DB.
- [ ] PgBouncer is running in transaction mode.
- [ ] DB cleanup DAG runs daily.
- [ ] Top-level Python code execution time is < 0.1s.
- [ ] All sensors are using `mode='reschedule'` or are Deferrable.
- [ ] Logs are writing to remote storage (S3).
- [ ] Multiple schedulers are running (HA).

---

**[← Back to Deep Dives](../README.md#-deep-dives)**
