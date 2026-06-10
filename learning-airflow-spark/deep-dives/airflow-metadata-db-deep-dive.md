# 🗄️ Airflow Metadata DB Deep Dive

> **Understanding the beating heart of an Apache Airflow cluster.**

---

## 1. The Role of the Database

Airflow is entirely stateless across its worker and scheduler processes. The Metadata Database is the **single source of truth**. Every component communicates by reading from and writing to this database via SQLAlchemy.

If the database is slow, Airflow is slow. If the database goes down, Airflow stops.

---

## 2. Core Tables Schema

Here are the most critical tables you must understand to debug Airflow.

### `dag`
Stores the metadata about the DAG itself, updated by the `DagFileProcessor`.
- `dag_id`: Primary key.
- `is_paused`: Boolean state toggle.
- `fileloc`: Path to the Python file.
- `next_dagrun_data_interval_start`: Used by scheduler to know when to run next.

### `dag_run`
Represents an instantiation of a DAG for a specific time period.
- `dag_id`, `run_id`: Composite unique identifier.
- `execution_date`: Logical date.
- `state`: `queued`, `running`, `success`, `failed`.
- `run_type`: `scheduled`, `manual`, `backfill`.

### `task_instance` (The Busiest Table)
Represents a specific task within a specific DAG Run. This table receives the most UPDATE queries.
- `dag_id`, `task_id`, `run_id`, `map_index`: Composite primary key.
- `state`: The famous state machine (`none` -> `scheduled` -> `queued` -> `running` -> `success`/`failed`).
- `try_number`: Increments on retries.
- `hostname`: Which worker is executing it.
- `start_date`, `end_date`: For duration calculation.

### `xcom`
Stores cross-communication messages.
- DO NOT store large dataframes here! It bloats the database, causes massive memory spikes in the Webserver/Scheduler, and slows down task transitions.

### `serialized_dag`
Stores the JSON representation of parsed DAGs.
- Read by the Webserver to render the UI without parsing Python code.

---

## 3. The Scheduler Database Loop

How does a task actually get scheduled? It's a series of database transactions:

1. **Find runnable DAGs:**
   ```sql
   SELECT * FROM dag WHERE is_paused = False AND next_dagrun_create_after <= NOW();
   ```
2. **Create DagRun:**
   INSERT into `dag_run` with state `queued`.
3. **Find runnable Tasks:**
   The scheduler looks for `task_instance` records where the parent `dag_run` is `running` and upstream dependencies are met.
   ```sql
   UPDATE task_instance SET state = 'scheduled' WHERE state = 'none' AND ...
   ```
4. **Queue Tasks (The Critical Lock):**
   To prevent two HA schedulers from grabbing the same task, Airflow uses row-level locking.
   ```sql
   SELECT * FROM task_instance WHERE state = 'scheduled' FOR UPDATE SKIP LOCKED;
   -- Updates to 'queued' and sends to Celery/K8s
   ```

---

## 4. Connection Pooling (PgBouncer)

Because Airflow is heavily multi-processed (Webserver Gunicorn workers, multiple Scheduler processes, Celery workers), it opens hundreds or thousands of database connections.

**The Problem:** Postgres spawns a heavy process for every connection. 1000 connections will crash Postgres or cause OOM.

**The Solution:** PgBouncer (Connection Pooling).
- PgBouncer sits between Airflow and Postgres.
- Airflow opens 1000 lightweight connections to PgBouncer.
- PgBouncer multiplexes these over a pool of ~50 heavy connections to Postgres.
- **Crucial Setting:** Must use `transaction` pooling mode, not `session` mode.

---

## 5. Performance Tuning & Maintenance

### 1. Database Vacuuming
Postgres uses MVCC (Multi-Version Concurrency Control). An `UPDATE` doesn't overwrite a row; it inserts a new one and marks the old one dead. `task_instance` gets updated 5-6 times per execution.
- **Symptom:** Slow queries, massive table bloat.
- **Fix:** Aggressive `autovacuum` settings on the `task_instance` and `dag_run` tables.

### 2. Indexes
If you write custom monitoring scripts or dashboards that query the metadata DB, ensure you create custom indexes. Airflow's default indexes are optimized for the Scheduler, not for complex reporting.

### 3. Log and State Pruning
Over time, `task_instance`, `log`, `dag_run`, and `xcom` tables will grow to millions of rows, slowing down index scans.
- **Fix:** Run the `airflow db clean` command as a scheduled DAG to delete metadata older than 30-90 days.

---

## 6. Common Database Failure Scenarios

### Scenario 1: "OperationalError: FATAL: remaining connection slots are reserved"
- **Cause:** Airflow spawned more processes than `max_connections` in Postgres.
- **Fix:** Implement PgBouncer. If using PgBouncer, increase the PgBouncer pool size or reduce `sql_alchemy_pool_size` in `airflow.cfg`.

### Scenario 2: Deadlocks during Scheduler HA
- **Cause:** Two schedulers trying to update the exact same records in a different order, causing a deadlock.
- **Fix:** This was mostly fixed in Airflow 2.0+ via `SKIP LOCKED`. If seen, upgrade Airflow or reduce scheduler instances.

### Scenario 3: Zombie Tasks appearing constantly
- **Cause:** The database is so heavily loaded that workers cannot update the `task_instance` table to `success` or heartbeat back to the DB within the timeout window. The scheduler assumes they died.
- **Fix:** Check database CPU/IOPS. Optimize autovacuum. Clean up old data.

---

**[← Back to Deep Dives](../README.md#-deep-dives)**
