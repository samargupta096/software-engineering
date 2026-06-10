# ⚡ Apache Airflow Cheatsheet

> **A quick reference guide for daily Airflow development and operations.**

---

## 🏗️ Basic DAG Template

```python
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.operators.python import PythonOperator

# 1. Default arguments applied to all tasks
default_args = {
    'owner': 'data_engineering_team',
    'depends_on_past': False,
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
    'execution_timeout': timedelta(hours=1),
}

# 2. Python function (Task logic)
def process_data(target_date, **context):
    print(f"Processing data for {target_date}")
    # Return value is automatically pushed to XCom
    return "processing_complete"

# 3. DAG Definition
with DAG(
    dag_id='example_production_dag',
    default_args=default_args,
    description='A standard daily ETL pipeline',
    schedule_interval='0 2 * * *', # Run daily at 2:00 AM
    start_date=datetime(2023, 1, 1),
    catchup=False,                 # CRITICAL: Prevent historical run deluge
    max_active_runs=1,             # Prevent concurrent DAG runs
    tags=['etl', 'daily', 'core'],
) as dag:

    # 4. Task Definitions
    extract_task = BashOperator(
        task_id='extract_data',
        bash_command='echo "Extracting data for {{ ds }}"',
    )

    transform_task = PythonOperator(
        task_id='transform_data',
        python_callable=process_data,
        op_kwargs={'target_date': '{{ ds }}'},
    )

    # 5. Define Dependencies
    extract_task >> transform_task
```

---

## 🛠️ Common Task Dependencies

| Syntax | Meaning |
|---|---|
| `task_a >> task_b` | Task B depends on Task A |
| `task_b << task_a` | Task B depends on Task A |
| `[task_a, task_b] >> task_c` | Task C depends on both A and B |
| `task_a >> [task_b, task_c]` | Both B and C depend on A |
| `chain(t1, [t2, t3], t4)` | t1 >> (t2 & t3) >> t4 |
| `cross_downstream([a, b], [c, d])` | Both c and d depend on both a and b |

---

## 🔤 Essential Jinja Macros / Templates

Used in `templated_fields` of Operators (like `bash_command` or `sql`).

| Macro | Description | Example Output |
|---|---|---|
| `{{ ds }}` | Execution date as YYYY-MM-DD | `2023-10-31` |
| `{{ ds_nodash }}` | Execution date without dashes | `20231031` |
| `{{ ts }}` | ISO 8601 timestamp | `2023-10-31T00:00:00+00:00` |
| `{{ data_interval_start }}` | Start of data period (DateTime obj) | `2023-10-31 00:00:00` |
| `{{ data_interval_end }}` | End of data period (DateTime obj) | `2023-11-01 00:00:00` |
| `{{ prev_ds }}` | Previous execution date | `2023-10-30` |
| `{{ next_ds }}` | Next execution date | `2023-11-01` |
| `{{ dag_run.conf['key'] }}` | Fetch config passed during manual trigger | `my_value` |
| `{{ var.value.my_var }}` | Fetch Airflow Variable (string) | `api_key_123` |
| `{{ var.json.my_var.nested_key }}` | Fetch JSON Variable | `nested_val` |

---

## 💻 Essential CLI Commands

```bash
# General
airflow info                        # Print architecture and config info
airflow config list                 # List all configurations
airflow db check                    # Check database connection

# DAGs
airflow dags list                   # List all parsed DAGs
airflow dags trigger my_dag_id      # Trigger a DAG manually
airflow dags trigger -c '{"env":"prod"}' my_dag # Trigger with config
airflow dags pause my_dag_id        # Pause DAG
airflow dags unpause my_dag_id      # Unpause DAG

# Tasks & Testing
airflow tasks list my_dag_id        # List tasks in a DAG
airflow tasks test my_dag_id task_1 2023-10-01  # Test task locally (no DB state)
airflow dags test my_dag_id 2023-10-01          # Test entire DAG locally

# Connections & Variables
airflow connections get my_conn     # View connection details
airflow variables get my_var        # Get variable value
```

---

## 🤖 TaskFlow API (Airflow 2.0+)

The modern, Pythonic way to write DAGs.

```python
from airflow.decorators import dag, task
from datetime import datetime

@dag(schedule_interval='@daily', start_date=datetime(2023, 1, 1), catchup=False)
def taskflow_example():
    
    @task
    def extract():
        return {"data": [1, 2, 3]} # Automatically pushed to XCom
        
    @task
    def transform(data_dict):
        # Automatically pulled from XCom
        return [i * 2 for i in data_dict["data"]]
        
    @task
    def load(final_data):
        print(f"Loading: {final_data}")

    # Functional dependency definition
    raw_data = extract()
    processed_data = transform(raw_data)
    load(processed_data)

# Don't forget to invoke the DAG
dag_obj = taskflow_example()
```

---

## 🔄 Dynamic Task Mapping (Airflow 2.3+)

Create tasks at runtime based on upstream output.

```python
@task
def get_files():
    return ["file1.csv", "file2.csv", "file3.csv"]

@task
def process_file(filename):
    print(f"Processing {filename}")

# expand() creates exactly 3 Task Instances of 'process_file'
with DAG(...) as dag:
    files = get_files()
    process_file.expand(filename=files) 
```

---

## ⚙️ Key Configuration Tweaks (`airflow.cfg`)

| Setting | Default | Recommendation for Prod | Reason |
|---|---|---|---|
| `parallelism` | 32 | 100-500 | Max active tasks across the entire Airflow cluster. |
| `dag_concurrency` / `max_active_tasks_per_dag` | 16 | 32-100 | Max concurrent tasks *per DAG*. Increase for wide DAGs. |
| `max_active_runs_per_dag` | 16 | 1-5 | Usually don't want 16 intervals of the same DAG running simultaneously. |
| `min_file_process_interval` | 0 | 30-60 | Seconds before parsing the same DAG file again. Saves CPU. |
| `catchup_by_default` | True | False | NEVER leave this True in prod unless you want accidental backfills. |

---

## 🩺 Debugging & Troubleshooting

### 1. Scheduler using 100% CPU
**Fix:** Look for top-level code in DAG files. Remove any `requests.get()` or DB connections that aren't inside a task's `execute()` method or `@task` function. Increase `min_file_process_interval`. Use `.airflowignore`.

### 2. Task stuck in "None" or "Scheduled" state
**Fix:** Check if the Scheduler is running. Check if dependencies are actually met. Check if the task's `start_date` is in the future relative to the DAG's `start_date`. 

### 3. Task stuck in "Queued" state
**Fix:** Executor lacks resources. Check Celery workers (are they all busy?). Check Kubernetes cluster capacity (are pods stuck in Pending?). Check if the Airflow Pool assigned to the task is full.

### 4. "Negsignal.SIGKILL" Error
**Fix:** The task exceeded its memory limit and was killed by the OS (OOM Killer). Increase RAM for the worker/pod.

### 5. "Zombie Task" Error
**Fix:** The worker executing the task died abruptly, lost network connection, or froze. Airflow detected it was marked "Running" but isn't responding. Check worker logs/metrics for OOM or segfaults.

---

## 🔍 Useful Metadata DB Queries (Postgres)

**Find failing tasks in the last 24 hours:**
```sql
SELECT dag_id, task_id, execution_date, state, duration
FROM task_instance
WHERE state = 'failed' 
  AND start_date > NOW() - INTERVAL '1 day'
ORDER BY start_date DESC;
```

**Find long-running active tasks:**
```sql
SELECT dag_id, task_id, state, 
       EXTRACT(EPOCH FROM (NOW() - start_date))/60 AS duration_minutes
FROM task_instance
WHERE state = 'running'
ORDER BY duration_minutes DESC;
```

**[← Previous](14-airflow-interview-guide.md) | [Home](../README.md) | [Next →](../spark/01-why-spark-exists.md)**
