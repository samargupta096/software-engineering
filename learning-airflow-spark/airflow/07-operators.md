# 07 — Operators: Doing Actual Work in Airflow

> **"A DAG defines the order. An operator defines the action. A task instance is the action happening right now."**

---

## Table of Contents

- [1. Intuition — What Operators Are](#1-intuition--what-operators-are)
- [2. Real-World Analogy — Workers in a Factory](#2-real-world-analogy--workers-in-a-factory)
- [3. The Operator Hierarchy](#3-the-operator-hierarchy)
- [4. Task Lifecycle — From Nothing to Done](#4-task-lifecycle--from-nothing-to-done)
- [5. Built-in Operators](#5-built-in-operators)
- [6. Provider Operators — Cloud & External Systems](#6-provider-operators--cloud--external-systems)
- [7. Specialized Execution Operators](#7-specialized-execution-operators)
- [8. Hooks — The Connection Layer](#8-hooks--the-connection-layer)
- [9. Connections & Variables](#9-connections--variables)
- [10. XCom — Communication Between Tasks](#10-xcom--communication-between-tasks)
- [11. Jinja Templating — Dynamic Parameters](#11-jinja-templating--dynamic-parameters)
- [12. Retries, Timeouts & Error Handling](#12-retries-timeouts--error-handling)
- [13. Building Custom Operators](#13-building-custom-operators)
- [14. Production Scenarios](#14-production-scenarios)
- [15. Troubleshooting](#15-troubleshooting)
- [16. Common Mistakes](#16-common-mistakes)
- [17. Interview Questions](#17-interview-questions)

---

## 1. Intuition — What Operators Are

In Airflow, a **DAG** describes the *shape* of your workflow — what depends on what. But the DAG itself doesn't do anything. The actual work — running a script, querying a database, copying files, sending emails — is done by **operators**.

An **operator** is a template for a task. It defines:
- **What** to do (run Python code, execute SQL, transfer data, etc.)
- **How** to do it (which system to connect to, what parameters to use)
- **What to do when things go wrong** (retries, timeouts, alerts)

When Airflow **instantiates** an operator for a specific execution date, it becomes a **task instance** — a concrete, running piece of work.

```
Operator (template) + Execution Date = Task Instance (actual work)
```

> **💡 Key Insight:** You never "run" an operator directly. You define it in a DAG, and the scheduler creates task instances from it for each DAG run. Think of an operator as a **cookie cutter** and task instances as the **cookies**.

---

## 2. Real-World Analogy — Workers in a Factory

Imagine a car manufacturing factory:

```mermaid
graph TB
    subgraph "🏭 The Factory (DAG)"
        A["🔧 Welder<br/><i>BashOperator</i><br/>Does one specific physical task"]
        B["🧪 Quality Inspector<br/><i>PythonOperator</i><br/>Runs custom logic"]
        C["📧 Shipping Clerk<br/><i>EmailOperator</i><br/>Sends notifications"]
        D["🏗️ Robot Arm<br/><i>DockerOperator</i><br/>Self-contained unit of work"]
        E["📦 Warehouse Manager<br/><i>S3Operator</i><br/>Manages storage"]
        F["👁️ Security Guard<br/><i>Sensor</i><br/>Waits for conditions"]
    end

    A --> B --> C
    A --> D --> E
    B --> F

    style A fill:#e74c3c,color:#fff
    style B fill:#3498db,color:#fff
    style C fill:#f39c12,color:#fff
    style D fill:#2ecc71,color:#fff
    style E fill:#9b59b6,color:#fff
    style F fill:#1abc9c,color:#fff
```

| Factory Worker | Airflow Operator | What They Do |
|----------------|-----------------|--------------|
| Welder | BashOperator | Executes a specific predefined action (bash command) |
| Quality Inspector | PythonOperator | Runs custom inspection logic (Python function) |
| Shipping Clerk | EmailOperator | Sends communications to external parties |
| Robot Arm | DockerOperator | Self-contained unit with its own tools/environment |
| Warehouse Manager | S3/GCS Operator | Moves things to/from storage |
| Security Guard | Sensor | Waits and checks until a condition is met |

Each worker type has a **specific skill set** and follows a **standard procedure**. You don't train a welder to inspect quality — you use the right worker for the right job.

---

## 3. The Operator Hierarchy

### Class Hierarchy

```mermaid
classDiagram
    class BaseOperator {
        +task_id: str
        +dag: DAG
        +retries: int
        +retry_delay: timedelta
        +execution_timeout: timedelta
        +pool: str
        +queue: str
        +execute(context) → Any
        +pre_execute(context)
        +post_execute(context, result)
        +on_failure_callback(context)
        +on_success_callback(context)
    }

    class BashOperator {
        +bash_command: str
        +env: dict
        +execute(context)
    }

    class PythonOperator {
        +python_callable: callable
        +op_args: list
        +op_kwargs: dict
        +execute(context)
    }

    class EmailOperator {
        +to: str
        +subject: str
        +html_content: str
    }

    class BaseSensorOperator {
        +poke_interval: int
        +timeout: int
        +mode: str
        +poke(context) → bool
    }

    class DockerOperator {
        +image: str
        +command: str
        +docker_url: str
    }

    BaseOperator <|-- BashOperator
    BaseOperator <|-- PythonOperator
    BaseOperator <|-- EmailOperator
    BaseOperator <|-- BaseSensorOperator
    BaseOperator <|-- DockerOperator
```

### What BaseOperator Provides

Every operator inherits from `BaseOperator`, which gives you:

```python
# These parameters are available on EVERY operator
my_task = AnyOperator(
    # Identity
    task_id="unique_task_name",          # Required, unique within DAG
    dag=dag,                              # The parent DAG
    
    # Retry behavior
    retries=3,                            # Number of retries on failure
    retry_delay=timedelta(minutes=5),     # Wait between retries
    retry_exponential_backoff=True,       # Exponentially increase delay
    max_retry_delay=timedelta(hours=1),   # Cap on retry delay
    
    # Timeouts
    execution_timeout=timedelta(hours=2), # Max time for task execution
    dagrun_timeout=timedelta(hours=6),    # Max time for the entire DAG run
    
    # Scheduling
    pool="default_pool",                  # Resource pool (limits concurrency)
    pool_slots=1,                         # Number of pool slots consumed
    queue="default",                      # Celery queue routing
    priority_weight=10,                   # Higher = runs first
    weight_rule="downstream",             # How to calculate priority
    
    # Dependencies
    depends_on_past=False,                # Requires previous run to succeed
    wait_for_downstream=False,            # Wait for downstream of previous run
    trigger_rule="all_success",           # When to trigger this task
    
    # Callbacks
    on_failure_callback=alert_oncall,     # Called on failure
    on_success_callback=log_success,      # Called on success
    on_retry_callback=log_retry,          # Called on retry
    sla=timedelta(hours=1),               # SLA deadline
    
    # Documentation
    doc_md="## Task Documentation\nThis task does X",
    
    # Resources (for KubernetesExecutor)
    executor_config={},
)
```

---

## 4. Task Lifecycle — From Nothing to Done

### State Machine

```mermaid
stateDiagram-v2
    [*] --> none: DAG parsed
    none --> scheduled: Scheduler finds it<br/>ready to run
    scheduled --> queued: Scheduler sends<br/>to executor
    queued --> running: Worker picks<br/>it up
    running --> success: Task completes<br/>successfully
    running --> failed: Task raises<br/>exception
    failed --> up_for_retry: retries > 0
    up_for_retry --> scheduled: After retry_delay
    running --> up_for_reschedule: Sensor in<br/>reschedule mode
    up_for_reschedule --> scheduled: After poke_interval
    
    none --> removed: Task removed<br/>from DAG
    scheduled --> skipped: Trigger rule<br/>not met
    scheduled --> upstream_failed: Upstream<br/>task failed
    
    success --> [*]
    failed --> [*]: No retries left
    skipped --> [*]
    upstream_failed --> [*]
```

### What Happens at Each State

| State | What's Happening | Who's Responsible |
|-------|-----------------|-------------------|
| `none` | Task exists in DAG file but hasn't been evaluated yet | DAG parser |
| `scheduled` | Scheduler has determined this task should run | Scheduler |
| `queued` | Task has been sent to the executor's queue | Executor |
| `running` | A worker is actively executing the task code | Worker process/pod |
| `success` | Task's `execute()` method returned without exception | Worker |
| `failed` | Task's `execute()` method raised an exception | Worker |
| `up_for_retry` | Task failed but has retries remaining; waiting for retry_delay | Scheduler |
| `up_for_reschedule` | Sensor released its worker slot; will be rescheduled | Scheduler |
| `skipped` | Task was skipped (e.g., by BranchPythonOperator or trigger_rule) | Scheduler |
| `upstream_failed` | An upstream task failed, and trigger_rule requires upstream success | Scheduler |
| `removed` | Task definition was removed from the DAG file | Scheduler |

### The execute() Method — Where Work Happens

```python
# This is what happens inside the worker when a task runs:

# 1. Deserialize the task instance from the command
task_instance = TaskInstance(task=task, execution_date=execution_date)

# 2. Check dependencies (trigger rules, depends_on_past, etc.)
task_instance.check_and_set_dagrun_timeout()

# 3. Set state to "running"
task_instance.set_state(State.RUNNING)

# 4. Build the execution context (available via **kwargs or **context)
context = task_instance.get_template_context()

# 5. Render Jinja templates
task_instance.render_templates()

# 6. Call pre_execute hook
task.pre_execute(context=context)

# 7. ★ CALL THE ACTUAL execute() METHOD ★
result = task.execute(context=context)

# 8. Push return value to XCom (if any)
if result is not None:
    task_instance.xcom_push(key="return_value", value=result)

# 9. Call post_execute hook
task.post_execute(context=context, result=result)

# 10. Set state to "success"
task_instance.set_state(State.SUCCESS)

# 11. Call on_success_callback
task.on_success_callback(context)
```

---

## 5. Built-in Operators

### BashOperator — Run Shell Commands

The simplest operator. Runs a bash command or script.

```python
from airflow import DAG
from airflow.operators.bash import BashOperator
from datetime import datetime

with DAG("bash_examples", start_date=datetime(2024, 1, 1), schedule="@daily") as dag:
    
    # Simple command
    hello = BashOperator(
        task_id="say_hello",
        bash_command="echo 'Hello from Airflow!'",
    )
    
    # Using templated variables
    print_date = BashOperator(
        task_id="print_execution_date",
        bash_command="echo 'Running for date: {{ ds }}'",
    )
    
    # Running a script file
    run_script = BashOperator(
        task_id="run_etl_script",
        bash_command="/opt/scripts/etl_pipeline.sh ",  # Note trailing space!
        env={"DATA_DATE": "{{ ds }}", "ENV": "production"},
    )
    
    # With error handling — non-zero exit code = task failure
    check_data = BashOperator(
        task_id="check_data_exists",
        bash_command="""
            if [ -f /data/{{ ds }}/output.csv ]; then
                echo "Data file exists"
                wc -l /data/{{ ds }}/output.csv
            else
                echo "ERROR: Data file not found!" >&2
                exit 1
            fi
        """,
    )
    
    hello >> print_date >> run_script >> check_data
```

> **⚠️ Warning:** When `bash_command` points to a script file (not inline commands), you **must** add a trailing space: `bash_command="/path/to/script.sh "`. This is because Airflow uses Jinja templating, and without the trailing space, it may try to render the file as a template.

### PythonOperator — Run Python Functions

The most versatile operator. Runs any Python callable.

```python
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime
import json

# Define your task functions
def extract_data(**kwargs):
    """Extract data from API."""
    execution_date = kwargs["ds"]
    print(f"Extracting data for {execution_date}")
    
    # Simulate API call
    data = {"users": 1500, "orders": 3200, "date": execution_date}
    
    # Return value is automatically pushed to XCom
    return data

def transform_data(**kwargs):
    """Transform extracted data."""
    # Pull data from upstream task's XCom
    ti = kwargs["ti"]
    raw_data = ti.xcom_pull(task_ids="extract")
    
    # Transform
    transformed = {
        "total_revenue": raw_data["orders"] * 49.99,
        "users": raw_data["users"],
        "date": raw_data["date"],
    }
    return transformed

def load_data(transformed_data, target_table, **kwargs):
    """Load data to warehouse."""
    print(f"Loading {transformed_data} into {target_table}")
    # In real life: INSERT INTO warehouse table

with DAG("python_operator_example", start_date=datetime(2024, 1, 1)) as dag:
    
    extract = PythonOperator(
        task_id="extract",
        python_callable=extract_data,
    )
    
    transform = PythonOperator(
        task_id="transform",
        python_callable=transform_data,
    )
    
    load = PythonOperator(
        task_id="load",
        python_callable=load_data,
        op_kwargs={
            "transformed_data": "{{ ti.xcom_pull(task_ids='transform') }}",
            "target_table": "analytics.daily_summary",
        },
    )
    
    extract >> transform >> load
```

### PythonVirtualenvOperator — Isolated Dependencies

When your task needs different Python packages than the Airflow environment:

```python
from airflow.operators.python import PythonVirtualenvOperator

def train_model(data_path, model_type):
    """This runs in its own virtualenv with its own packages."""
    import pandas as pd          # Specific version installed in venv
    import sklearn               # Not available in main Airflow env
    from sklearn.ensemble import RandomForestClassifier
    
    df = pd.read_csv(data_path)
    model = RandomForestClassifier()
    model.fit(df.drop("target", axis=1), df["target"])
    return {"accuracy": 0.95}

train = PythonVirtualenvOperator(
    task_id="train_model",
    python_callable=train_model,
    requirements=[
        "pandas==2.1.0",
        "scikit-learn==1.3.0",
    ],
    python_version="3.10",
    op_kwargs={
        "data_path": "/data/training_data.csv",
        "model_type": "random_forest",
    },
    system_site_packages=False,  # Clean environment
)
```

> **💡 Key Insight:** PythonVirtualenvOperator creates a new virtualenv for *every task run*, installs packages, runs your function, then destroys it. This adds 30-60 seconds of overhead. For frequently-run tasks, consider DockerOperator or pre-built images.

### EmailOperator — Send Notifications

```python
from airflow.operators.email import EmailOperator

send_report = EmailOperator(
    task_id="send_daily_report",
    to=["team@company.com", "manager@company.com"],
    subject="Daily Pipeline Report — {{ ds }}",
    html_content="""
        <h2>Pipeline Report for {{ ds }}</h2>
        <p>Status: <strong>SUCCESS</strong></p>
        <p>Records processed: {{ ti.xcom_pull(task_ids='count_records') }}</p>
        <p><a href="{{ conf.get('webserver', 'base_url') }}">View in Airflow</a></p>
    """,
)
```

### Trigger Rules — Controlling When Tasks Run

```python
from airflow.utils.trigger_rule import TriggerRule

# Default: ALL upstream tasks must succeed
task_a = PythonOperator(
    task_id="normal_task",
    trigger_rule=TriggerRule.ALL_SUCCESS,    # Default
    python_callable=my_func,
)

# Run even if some upstream tasks failed (for cleanup/notifications)
cleanup = BashOperator(
    task_id="cleanup",
    trigger_rule=TriggerRule.ALL_DONE,       # Run regardless of upstream status
    bash_command="rm -rf /tmp/staging/*",
)

# Run only if at least one upstream succeeded
report = PythonOperator(
    task_id="partial_report",
    trigger_rule=TriggerRule.ONE_SUCCESS,     # At least one upstream succeeded
    python_callable=generate_partial_report,
)
```

Available trigger rules:

| Trigger Rule | Behavior |
|-------------|----------|
| `all_success` | All parents must succeed (default) |
| `all_failed` | All parents must fail |
| `all_done` | All parents must complete (regardless of state) |
| `one_success` | At least one parent must succeed |
| `one_failed` | At least one parent must fail |
| `none_failed` | No parent has failed (allows skipped) |
| `none_skipped` | No parent was skipped |
| `none_failed_min_one_success` | No failures, at least one success |
| `dummy` | No dependencies at all — always runs |

---

## 6. Provider Operators — Cloud & External Systems

Airflow's power comes from its massive ecosystem of **provider packages** — pre-built operators for hundreds of external systems.

### Provider Architecture

```mermaid
graph TB
    subgraph "Airflow Core"
        BASE["BaseOperator"]
    end
    
    subgraph "Provider Packages"
        subgraph "apache-airflow-providers-amazon"
            S3["S3CreateObjectOperator"]
            GLUE["GlueJobOperator"]
            EMR["EmrServerlessCreateApplicationOperator"]
            REDSHIFT["RedshiftSQLOperator"]
        end
        
        subgraph "apache-airflow-providers-google"
            GCS["GCSCreateBucketOperator"]
            BQ["BigQueryInsertJobOperator"]
            DF["DataflowCreatePythonJobOperator"]
        end
        
        subgraph "apache-airflow-providers-databricks"
            DBR["DatabricksRunNowOperator"]
            DBSQL["DatabricksSqlOperator"]
        end
        
        subgraph "apache-airflow-providers-snowflake"
            SNOW["SnowflakeOperator"]
        end
    end
    
    BASE --> S3 & GLUE & EMR & REDSHIFT
    BASE --> GCS & BQ & DF
    BASE --> DBR & DBSQL
    BASE --> SNOW

    style BASE fill:#e74c3c,color:#fff
```

### AWS Operators — S3 Example

```python
from airflow import DAG
from airflow.providers.amazon.aws.operators.s3 import (
    S3CreateObjectOperator,
    S3CopyObjectOperator,
    S3DeleteObjectsOperator,
)
from airflow.providers.amazon.aws.sensors.s3 import S3KeySensor
from airflow.providers.amazon.aws.transfers.s3_to_redshift import S3ToRedshiftOperator
from datetime import datetime

with DAG("s3_pipeline", start_date=datetime(2024, 1, 1)) as dag:
    
    # Wait for data to arrive in S3
    wait_for_data = S3KeySensor(
        task_id="wait_for_raw_data",
        bucket_name="my-data-lake",
        bucket_key="raw/{{ ds }}/events.parquet",
        aws_conn_id="aws_default",
        timeout=3600,
        poke_interval=60,
    )
    
    # Copy data to staging
    copy_to_staging = S3CopyObjectOperator(
        task_id="copy_to_staging",
        source_bucket_name="my-data-lake",
        source_bucket_key="raw/{{ ds }}/events.parquet",
        dest_bucket_name="my-data-lake",
        dest_bucket_key="staging/{{ ds }}/events.parquet",
        aws_conn_id="aws_default",
    )
    
    # Load into Redshift
    load_to_redshift = S3ToRedshiftOperator(
        task_id="load_to_redshift",
        schema="analytics",
        table="events",
        s3_bucket="my-data-lake",
        s3_key="staging/{{ ds }}/events.parquet",
        copy_options=["FORMAT AS PARQUET"],
        redshift_conn_id="redshift_default",
        aws_conn_id="aws_default",
        method="UPSERT",
        upsert_keys=["event_id"],
    )
    
    wait_for_data >> copy_to_staging >> load_to_redshift
```

### GCP Operators — BigQuery Example

```python
from airflow import DAG
from airflow.providers.google.cloud.operators.bigquery import (
    BigQueryInsertJobOperator,
    BigQueryCheckOperator,
)
from airflow.providers.google.cloud.transfers.gcs_to_bigquery import (
    GCSToBigQueryOperator,
)
from datetime import datetime

with DAG("bigquery_pipeline", start_date=datetime(2024, 1, 1)) as dag:
    
    # Load CSV from GCS to BigQuery
    load_csv = GCSToBigQueryOperator(
        task_id="load_csv_to_bq",
        bucket="my-data-bucket",
        source_objects=["data/{{ ds }}/*.csv"],
        destination_project_dataset_table="my_project.raw.events",
        source_format="CSV",
        skip_leading_rows=1,
        write_disposition="WRITE_TRUNCATE",
        gcp_conn_id="google_cloud_default",
    )
    
    # Run a transformation query
    transform = BigQueryInsertJobOperator(
        task_id="transform_events",
        configuration={
            "query": {
                "query": """
                    CREATE OR REPLACE TABLE `my_project.analytics.daily_summary` AS
                    SELECT
                        DATE(event_timestamp) as event_date,
                        event_type,
                        COUNT(*) as event_count,
                        COUNT(DISTINCT user_id) as unique_users
                    FROM `my_project.raw.events`
                    WHERE DATE(event_timestamp) = '{{ ds }}'
                    GROUP BY 1, 2
                """,
                "useLegacySql": False,
            }
        },
        gcp_conn_id="google_cloud_default",
    )
    
    # Data quality check
    quality_check = BigQueryCheckOperator(
        task_id="check_row_count",
        sql="""
            SELECT COUNT(*) > 0
            FROM `my_project.analytics.daily_summary`
            WHERE event_date = '{{ ds }}'
        """,
        use_legacy_sql=False,
        gcp_conn_id="google_cloud_default",
    )
    
    load_csv >> transform >> quality_check
```

### Databricks Operator

```python
from airflow.providers.databricks.operators.databricks import (
    DatabricksRunNowOperator,
    DatabricksSubmitRunOperator,
)

# Run an existing Databricks job
run_existing_job = DatabricksRunNowOperator(
    task_id="run_databricks_job",
    databricks_conn_id="databricks_default",
    job_id=12345,
    notebook_params={
        "date": "{{ ds }}",
        "environment": "production",
    },
)

# Submit a new run (one-off)
submit_spark_job = DatabricksSubmitRunOperator(
    task_id="submit_spark_job",
    databricks_conn_id="databricks_default",
    json={
        "new_cluster": {
            "spark_version": "13.3.x-scala2.12",
            "num_workers": 4,
            "node_type_id": "i3.xlarge",
        },
        "spark_python_task": {
            "python_file": "dbfs:/scripts/etl_job.py",
            "parameters": ["{{ ds }}", "production"],
        },
    },
)
```

---

## 7. Specialized Execution Operators

### DockerOperator — Containerized Tasks

```python
from airflow.providers.docker.operators.docker import DockerOperator

run_in_docker = DockerOperator(
    task_id="run_in_container",
    image="my-company/data-processor:v2.1",
    command="python /app/process.py --date {{ ds }}",
    
    # Docker configuration
    docker_url="unix:///var/run/docker.sock",  # Local Docker daemon
    network_mode="bridge",
    auto_remove=True,                           # Clean up container after
    
    # Environment & volumes
    environment={
        "DATABASE_URL": "{{ conn.my_db.get_uri() }}",
        "AWS_ACCESS_KEY_ID": "{{ var.value.aws_access_key }}",
    },
    mounts=[
        {
            "source": "/data/shared",
            "target": "/data",
            "type": "bind",
        }
    ],
    
    # Resource limits
    mem_limit="4g",
    cpu_quota=200000,  # 2 CPU cores
    
    # Capture output as XCom
    retrieve_output=True,
    retrieve_output_path="/tmp/output.json",
)
```

### KubernetesPodOperator — Full K8s Control

The most powerful operator for cloud-native deployments. Unlike KubernetesExecutor (which runs *every* task as a pod), KubernetesPodOperator lets you run *specific* tasks as pods while using any executor.

```python
from airflow.providers.cncf.kubernetes.operators.pod import KubernetesPodOperator
from kubernetes.client import models as k8s
from datetime import datetime

with DAG("k8s_pod_examples", start_date=datetime(2024, 1, 1)) as dag:
    
    # Basic usage
    simple_task = KubernetesPodOperator(
        task_id="simple_pod_task",
        namespace="data-engineering",
        image="python:3.11-slim",
        cmds=["python", "-c"],
        arguments=["print('Hello from Kubernetes!')"],
        name="simple-pod",
        is_delete_operator_pod=True,
    )
    
    # Production ML training with GPU
    train_model = KubernetesPodOperator(
        task_id="train_model",
        namespace="ml-training",
        image="my-company/ml-trainer:v3.2",
        cmds=["python"],
        arguments=[
            "/app/train.py",
            "--date", "{{ ds }}",
            "--epochs", "100",
            "--model-output", "s3://models/{{ ds }}/model.pkl",
        ],
        name="ml-training-{{ ds_nodash }}",
        
        # Resource requirements
        container_resources=k8s.V1ResourceRequirements(
            requests={"memory": "16Gi", "cpu": "4", "nvidia.com/gpu": "1"},
            limits={"memory": "32Gi", "cpu": "8", "nvidia.com/gpu": "1"},
        ),
        
        # Node selection
        node_selector={"gpu-type": "a100"},
        tolerations=[
            k8s.V1Toleration(
                key="nvidia.com/gpu", operator="Exists", effect="NoSchedule"
            )
        ],
        
        # Secrets and config
        secrets=[
            k8s.V1EnvFromSource(
                secret_ref=k8s.V1SecretEnvSource(name="ml-credentials")
            )
        ],
        env_vars={
            "WANDB_API_KEY": k8s.V1EnvVar(
                name="WANDB_API_KEY",
                value_from=k8s.V1EnvVarSource(
                    secret_key_ref=k8s.V1SecretKeySelector(
                        name="ml-secrets", key="wandb-api-key"
                    )
                ),
            ),
        },
        
        # Pod lifecycle
        startup_timeout_seconds=600,
        is_delete_operator_pod=True,
        get_logs=True,
        log_events_on_failure=True,
        
        # Sidecar containers (e.g., for cloud-sql-proxy)
        init_containers=[
            k8s.V1Container(
                name="init-data",
                image="busybox",
                command=["sh", "-c", "echo 'Initializing...'"],
            )
        ],
    )
    
    simple_task >> train_model
```

> **💡 Key Insight:** `KubernetesPodOperator` ≠ `KubernetesExecutor`. The operator runs *one specific task* as a pod. The executor runs *all tasks* as pods. You can use KubernetesPodOperator with CeleryExecutor to run just your heavy/isolated tasks as pods.

---

## 8. Hooks — The Connection Layer

### What Hooks Are

Hooks are the **low-level interface** to external systems. Operators *use* hooks internally to connect to databases, APIs, cloud services, etc.

```mermaid
graph LR
    OP["Operator<br/>(High-level)"] --> HOOK["Hook<br/>(Connection logic)"]
    HOOK --> EXT["External System<br/>(Database, API, Cloud)"]
    
    subgraph "Example"
        S3OP["S3CreateObjectOperator"] --> S3HOOK["S3Hook"]
        S3HOOK --> S3["AWS S3 API"]
    end

    style OP fill:#3498db,color:#fff
    style HOOK fill:#f39c12,color:#fff
    style EXT fill:#2ecc71,color:#fff
```

### Using Hooks Directly in PythonOperator

Sometimes you need more control than pre-built operators offer:

```python
from airflow.providers.postgres.hooks.postgres import PostgresHook
from airflow.providers.amazon.aws.hooks.s3 import S3Hook
from airflow.operators.python import PythonOperator

def extract_and_upload(**kwargs):
    """Extract data from PostgreSQL and upload to S3."""
    
    # Hook manages connection lifecycle (open, close, retry)
    pg_hook = PostgresHook(postgres_conn_id="my_postgres")
    s3_hook = S3Hook(aws_conn_id="my_aws")
    
    # Execute query using the hook
    records = pg_hook.get_records(
        sql="SELECT * FROM orders WHERE date = %s",
        parameters=[kwargs["ds"]],
    )
    
    # Convert to CSV
    import csv
    import io
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerows(records)
    
    # Upload to S3 using the hook
    s3_hook.load_string(
        string_data=output.getvalue(),
        key=f"exports/{kwargs['ds']}/orders.csv",
        bucket_name="my-data-lake",
        replace=True,
    )
    
    return len(records)

extract_task = PythonOperator(
    task_id="extract_and_upload",
    python_callable=extract_and_upload,
)
```

### Common Hooks

| Hook | Provider Package | Connects To |
|------|-----------------|-------------|
| `PostgresHook` | `apache-airflow-providers-postgres` | PostgreSQL databases |
| `MySqlHook` | `apache-airflow-providers-mysql` | MySQL databases |
| `S3Hook` | `apache-airflow-providers-amazon` | AWS S3 |
| `GCSHook` | `apache-airflow-providers-google` | Google Cloud Storage |
| `HttpHook` | `apache-airflow-providers-http` | REST APIs |
| `SlackHook` | `apache-airflow-providers-slack` | Slack messaging |
| `SnowflakeHook` | `apache-airflow-providers-snowflake` | Snowflake data warehouse |

---

## 9. Connections & Variables

### Connections — Credentials for External Systems

Connections store the credentials and connection parameters for external systems. They are stored encrypted in the metadata database.

```mermaid
graph TB
    subgraph "Connection Storage"
        META["Metadata DB<br/>(encrypted)"]
        ENV["Environment Variables"]
        SEC["Secrets Backend<br/>(Vault, AWS SM)"]
    end
    
    subgraph "Usage"
        HOOK["Hook"]
        HOOK -->|"conn_id"| META
        HOOK -->|"AIRFLOW_CONN_*"| ENV
        HOOK -->|"Configurable"| SEC
    end
    
    HOOK --> EXT["External System"]
```

```python
# Setting connections via CLI
# airflow connections add 'my_postgres' \
#     --conn-type 'postgres' \
#     --conn-host 'db.example.com' \
#     --conn-port 5432 \
#     --conn-login 'airflow' \
#     --conn-password 'secret123' \
#     --conn-schema 'analytics'

# Setting connections via environment variables
# Format: AIRFLOW_CONN_{CONN_ID} = {conn_type}://{login}:{password}@{host}:{port}/{schema}
# export AIRFLOW_CONN_MY_POSTGRES='postgresql://airflow:secret123@db.example.com:5432/analytics'

# Using connections in code
from airflow.hooks.base import BaseHook

def use_connection(**kwargs):
    # Get the connection object
    conn = BaseHook.get_connection("my_postgres")
    print(f"Host: {conn.host}")
    print(f"Port: {conn.port}")
    print(f"Schema: {conn.schema}")
    print(f"Login: {conn.login}")
    # conn.password is available but be careful with logging!
    
    # Extra field (JSON) for additional parameters
    extra = conn.extra_dejson
    print(f"SSL Mode: {extra.get('sslmode', 'prefer')}")
```

### Using a Secrets Backend (Production)

```python
# airflow.cfg — Use AWS Secrets Manager
# [secrets]
# backend = airflow.providers.amazon.aws.secrets.secrets_manager.SecretsManagerBackend
# backend_kwargs = {"connections_prefix": "airflow/connections", "variables_prefix": "airflow/variables"}

# Now connections are fetched from AWS Secrets Manager automatically
# Secret name: airflow/connections/my_postgres
# Secret value: {"conn_type": "postgres", "host": "db.example.com", ...}
```

### Variables — Configuration Values

Variables are key-value pairs stored in the metadata database, used for runtime configuration.

```python
from airflow.models import Variable

# Setting variables
Variable.set("environment", "production")
Variable.set("alert_email", "oncall@company.com")
Variable.set("pipeline_config", {     # Automatically JSON-serialized
    "batch_size": 1000,
    "max_retries": 3,
    "output_format": "parquet",
}, serialize_json=True)

# Getting variables
env = Variable.get("environment")                           # "production"
config = Variable.get("pipeline_config", deserialize_json=True)  # dict
batch_size = config["batch_size"]                           # 1000

# With default value (no error if missing)
debug = Variable.get("debug_mode", default_var="false")
```

> **⚠️ Warning: The Variable.get() Performance Trap**
> 
> `Variable.get()` makes a **database query** every time it's called. If you use it at the **top level** of your DAG file (outside task functions), it runs every time the DAG file is parsed (every 30 seconds by default). This can overwhelm your metadata database.

```python
# ❌ BAD — Database query on every DAG parse (every 30 seconds!)
config = Variable.get("pipeline_config", deserialize_json=True)

with DAG("my_dag", ...) as dag:
    task = PythonOperator(
        task_id="my_task",
        op_kwargs={"batch_size": config["batch_size"]},  # BAD
    )

# ✅ GOOD — Use Jinja template (only resolved at task execution time)
with DAG("my_dag", ...) as dag:
    task = PythonOperator(
        task_id="my_task",
        op_kwargs={"batch_size": "{{ var.json.pipeline_config.batch_size }}"},
    )

# ✅ ALSO GOOD — Access inside the task function
def my_task_function(**kwargs):
    config = Variable.get("pipeline_config", deserialize_json=True)
    # This only runs when the task actually executes
```

---

## 10. XCom — Communication Between Tasks

### What XCom Is

XCom (Cross-Communication) is Airflow's mechanism for tasks to pass small amounts of data to each other.

```mermaid
graph LR
    subgraph "DAG Run"
        T1["Task 1<br/>extract"]
        T2["Task 2<br/>transform"]
        T3["Task 3<br/>load"]
    end
    
    XCOM["XCom Table<br/>(Metadata DB)"]
    
    T1 -->|"xcom_push<br/>key='data', value={...}"| XCOM
    XCOM -->|"xcom_pull<br/>task_ids='extract'"| T2
    T2 -->|"xcom_push<br/>return_value"| XCOM
    XCOM -->|"xcom_pull"| T3

    style XCOM fill:#f39c12,color:#fff
```

### Using XCom

```python
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime

def extract(**kwargs):
    data = {"users": [1, 2, 3], "count": 3}
    
    # Method 1: Return value (automatically pushed as "return_value")
    return data

def transform(**kwargs):
    ti = kwargs["ti"]
    
    # Method 2: Pull using task instance
    data = ti.xcom_pull(task_ids="extract_task")  # Gets "return_value" key
    
    # Method 3: Push explicitly with custom key
    ti.xcom_push(key="record_count", value=data["count"])
    ti.xcom_push(key="status", value="transformed")
    
    return {"processed": data["count"] * 2}

def load(**kwargs):
    ti = kwargs["ti"]
    
    # Pull specific key from specific task
    count = ti.xcom_pull(task_ids="transform_task", key="record_count")
    status = ti.xcom_pull(task_ids="transform_task", key="status")
    result = ti.xcom_pull(task_ids="transform_task")  # Gets return_value
    
    print(f"Loading {count} records, status: {status}")

with DAG("xcom_example", start_date=datetime(2024, 1, 1)) as dag:
    t1 = PythonOperator(task_id="extract_task", python_callable=extract)
    t2 = PythonOperator(task_id="transform_task", python_callable=transform)
    t3 = PythonOperator(task_id="load_task", python_callable=load)
    
    t1 >> t2 >> t3
```

### XCom Limitations and Custom Backends

> **⚠️ Critical:** XCom values are stored in the metadata database by default. This means:
> - **Size limit:** Typically 48KB (MySQL) or unlimited (PostgreSQL JSONB), but storing large data in XCom is a **bad practice**
> - **Performance:** Large XCom values slow down the metadata DB
> - **Not for large data:** Never pass DataFrames, files, or large datasets through XCom

```python
# ❌ BAD — Don't pass large data through XCom
def bad_extract():
    import pandas as pd
    df = pd.read_csv("huge_file.csv")  # 1GB DataFrame
    return df.to_dict()  # This will kill your metadata DB!

# ✅ GOOD — Pass references, not data
def good_extract():
    import pandas as pd
    df = pd.read_csv("huge_file.csv")
    output_path = "s3://my-bucket/intermediate/data.parquet"
    df.to_parquet(output_path)
    return output_path  # Just pass the path (a few bytes)

def good_transform(**kwargs):
    import pandas as pd
    ti = kwargs["ti"]
    data_path = ti.xcom_pull(task_ids="extract")  # Gets the path
    df = pd.read_parquet(data_path)                # Reads from S3
    # ... transform ...
```

### Custom XCom Backend (for Large Data)

```python
# Custom XCom backend that stores values in S3
# airflow.cfg: xcom_backend = my_package.s3_xcom_backend.S3XComBackend

from airflow.models.xcom import BaseXCom
import json

class S3XComBackend(BaseXCom):
    """Store XCom values in S3 instead of the metadata DB."""
    
    @staticmethod
    def serialize_value(value, *, key=None, task_id=None, 
                        dag_id=None, run_id=None, map_index=-1):
        # Store in S3 and save the S3 path in the DB
        s3_key = f"xcom/{dag_id}/{run_id}/{task_id}/{key}.json"
        s3_hook = S3Hook()
        s3_hook.load_string(
            string_data=json.dumps(value),
            key=s3_key,
            bucket_name="my-xcom-bucket",
        )
        return BaseXCom.serialize_value(s3_key)
    
    @staticmethod
    def deserialize_value(result):
        s3_key = BaseXCom.deserialize_value(result)
        s3_hook = S3Hook()
        content = s3_hook.read_key(key=s3_key, bucket_name="my-xcom-bucket")
        return json.loads(content)
```

---

## 11. Jinja Templating — Dynamic Parameters

### What Templates Are

Airflow uses **Jinja2** templating to inject runtime values into operator parameters. This is how your DAGs adapt to different execution dates, configurations, and upstream results.

```mermaid
graph LR
    TEMPLATE["Template<br/>'Hello {{ ds }}'"]
    CONTEXT["Context<br/>ds='2024-01-15'"]
    RENDERED["Rendered<br/>'Hello 2024-01-15'"]
    
    TEMPLATE --> |"Jinja2 Engine"| RENDERED
    CONTEXT --> |"Provides values"| RENDERED

    style TEMPLATE fill:#3498db,color:#fff
    style CONTEXT fill:#f39c12,color:#fff
    style RENDERED fill:#2ecc71,color:#fff
```

### Available Template Variables

```python
# These variables are available in ALL templated fields:

# Execution date related
"{{ ds }}"                    # '2024-01-15' (YYYY-MM-DD)
"{{ ds_nodash }}"             # '20240115' (YYYYMMDD)
"{{ ts }}"                    # '2024-01-15T00:00:00+00:00' (ISO format)
"{{ ts_nodash }}"             # '20240115T000000'
"{{ execution_date }}"        # datetime object (deprecated in 2.2+)
"{{ data_interval_start }}"   # Start of data interval (Pendulum)
"{{ data_interval_end }}"     # End of data interval (Pendulum)
"{{ logical_date }}"          # The logical execution date (Pendulum)

# Relative dates
"{{ yesterday_ds }}"          # '2024-01-14'
"{{ tomorrow_ds }}"           # '2024-01-16'
"{{ macros.ds_add(ds, -7) }}" # '2024-01-08' (7 days ago)

# DAG and task info
"{{ dag.dag_id }}"            # 'my_pipeline'
"{{ task.task_id }}"          # 'extract_data'
"{{ task_instance }}"         # TaskInstance object
"{{ ti }}"                    # Shortcut for task_instance
"{{ run_id }}"                # 'scheduled__2024-01-15T00:00:00+00:00'
"{{ dag_run }}"               # DagRun object

# Parameters (passed via trigger)
"{{ params.my_param }}"       # Value of 'my_param'

# Variables and connections
"{{ var.value.my_variable }}"         # Simple variable
"{{ var.json.my_json_var.key }}"      # JSON variable field
"{{ conn.my_connection.host }}"       # Connection attribute

# XCom
"{{ ti.xcom_pull(task_ids='upstream_task') }}"
"{{ ti.xcom_pull(task_ids='upstream_task', key='custom_key') }}"

# Macros (utility functions)
"{{ macros.ds_add(ds, 5) }}"          # Add days
"{{ macros.ds_format(ds, '%Y-%m-%d', '%d/%m/%Y') }}"  # Reformat date
"{{ macros.datetime }}"               # Python datetime module
"{{ macros.uuid }}"                   # UUID module
```

### Practical Template Examples

```python
from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.providers.amazon.aws.operators.s3 import S3CopyObjectOperator
from datetime import datetime

with DAG("template_examples", start_date=datetime(2024, 1, 1)) as dag:
    
    # Partitioned file path
    process_partition = BashOperator(
        task_id="process_partition",
        bash_command="""
            spark-submit \
                --master yarn \
                /opt/jobs/etl.py \
                --input s3://bucket/raw/year={{ execution_date.year }}/month={{ execution_date.month }}/day={{ execution_date.day }}/ \
                --output s3://bucket/processed/ds={{ ds }}/ \
                --date {{ ds }}
        """,
    )
    
    # Conditional logic in templates
    conditional = BashOperator(
        task_id="conditional_processing",
        bash_command="""
            {% if execution_date.day_of_week == 0 %}
                echo "It's Monday — running full refresh"
                python /opt/scripts/full_refresh.py
            {% else %}
                echo "Incremental update for {{ ds }}"
                python /opt/scripts/incremental.py --date {{ ds }}
            {% endif %}
        """,
    )
    
    # Loop in templates
    multi_table = BashOperator(
        task_id="process_tables",
        bash_command="""
            {% for table in params.tables %}
            echo "Processing table: {{ table }}"
            python /opt/scripts/sync_table.py --table {{ table }} --date {{ ds }}
            {% endfor %}
        """,
        params={"tables": ["users", "orders", "products"]},
    )
```

### Which Fields Are Templated?

Not every operator parameter supports Jinja templates. Only fields listed in `template_fields` are rendered:

```python
# Check which fields support templates
print(BashOperator.template_fields)
# ('bash_command', 'env', 'cwd')

print(PythonOperator.template_fields)
# ('templates_dict', 'op_args', 'op_kwargs')

print(S3CopyObjectOperator.template_fields)
# ('source_bucket_key', 'dest_bucket_key', 'source_bucket_name', 'dest_bucket_name')
```

---

## 12. Retries, Timeouts & Error Handling

### Retry Configuration

```python
from datetime import timedelta

task_with_retries = PythonOperator(
    task_id="resilient_task",
    python_callable=call_flaky_api,
    
    # Retry configuration
    retries=5,                                    # Try up to 5 more times
    retry_delay=timedelta(minutes=2),             # Wait 2 min between retries
    retry_exponential_backoff=True,               # 2min, 4min, 8min, 16min, 32min
    max_retry_delay=timedelta(minutes=30),        # Cap at 30 minutes
    
    # Timeout
    execution_timeout=timedelta(hours=1),         # Kill after 1 hour
    
    # Callbacks
    on_failure_callback=notify_slack,             # On final failure
    on_retry_callback=log_retry_attempt,          # On each retry
    on_success_callback=update_dashboard,         # On success
)
```

### Retry Timeline

```mermaid
sequenceDiagram
    participant T as Task
    participant S as Scheduler
    participant A as Alert System

    T->>T: Attempt 1 — FAILED (API timeout)
    T->>S: State → up_for_retry
    Note over S: Wait 2 minutes (retry_delay)
    
    S->>T: Attempt 2 — FAILED (API 500 error)
    T->>S: State → up_for_retry
    Note over S: Wait 4 minutes (exponential backoff)
    
    S->>T: Attempt 3 — FAILED (API 500 error)
    T->>S: State → up_for_retry
    Note over S: Wait 8 minutes (exponential backoff)
    
    S->>T: Attempt 4 — SUCCESS ✅
    T->>A: on_success_callback()
```

### Error Handling Patterns

```python
from airflow.exceptions import AirflowFailException, AirflowSkipException

def smart_task(**kwargs):
    """Demonstrates different error handling strategies."""
    
    try:
        result = call_external_api()
        
        if result.status == "no_data":
            # Skip the task (don't retry, don't fail)
            raise AirflowSkipException("No data available for this date")
        
        if result.status == "permanent_error":
            # Fail immediately without retrying
            raise AirflowFailException("Data schema changed — needs manual fix")
        
        if result.status == "transient_error":
            # Regular exception → will retry (if retries configured)
            raise Exception("API temporarily unavailable")
        
        return result.data
        
    except ConnectionError as e:
        # This will trigger a retry (it's a regular exception)
        raise
    except ValueError as e:
        # This is a data issue — retrying won't help
        raise AirflowFailException(f"Invalid data format: {e}")
```

### Callback Functions

```python
from airflow.providers.slack.hooks.slack_webhook import SlackWebhookHook

def notify_slack_on_failure(context):
    """Called when a task fails after all retries are exhausted."""
    task_instance = context["task_instance"]
    dag_id = context["dag"].dag_id
    task_id = task_instance.task_id
    execution_date = context["ds"]
    log_url = task_instance.log_url
    exception = context.get("exception", "Unknown error")
    
    message = f"""
    :red_circle: *Task Failed*
    • DAG: `{dag_id}`
    • Task: `{task_id}`
    • Date: `{execution_date}`
    • Error: `{exception}`
    • <{log_url}|View Logs>
    """
    
    hook = SlackWebhookHook(slack_webhook_conn_id="slack_webhook")
    hook.send(text=message)

def notify_on_sla_miss(dag, task_list, blocking_task_list, slas, blocking_tis):
    """Called when tasks miss their SLA deadline."""
    message = f"SLA Miss! DAG: {dag.dag_id}, Tasks: {[t.task_id for t in task_list]}"
    # Send alert...
```

---

## 13. Building Custom Operators

### When to Build Custom Operators

- You have a **repeated pattern** across many DAGs
- You need a **clean interface** for a specific external system
- You want to enforce **standards** (logging, error handling, retry logic)

### Custom Operator Template

```python
from airflow.models import BaseOperator
from airflow.utils.decorators import apply_defaults
from typing import Any, Optional, Sequence

class DataQualityOperator(BaseOperator):
    """
    Runs data quality checks against a SQL database.
    
    :param conn_id: Connection ID for the database
    :param table: Table name to check
    :param checks: List of check definitions
    :param fail_on_error: Whether to fail the task if checks fail
    """
    
    # Fields that support Jinja templating
    template_fields: Sequence[str] = ("table", "checks")
    
    # File extensions to render as Jinja templates
    template_ext: Sequence[str] = (".sql",)
    
    # UI color
    ui_color = "#89CFF0"
    ui_fgcolor = "#000000"
    
    def __init__(
        self,
        conn_id: str,
        table: str,
        checks: list[dict],
        fail_on_error: bool = True,
        **kwargs,
    ) -> None:
        super().__init__(**kwargs)
        self.conn_id = conn_id
        self.table = table
        self.checks = checks
        self.fail_on_error = fail_on_error
    
    def execute(self, context: Any) -> dict:
        """Execute all data quality checks."""
        from airflow.providers.postgres.hooks.postgres import PostgresHook
        
        hook = PostgresHook(postgres_conn_id=self.conn_id)
        results = {}
        failures = []
        
        for check in self.checks:
            check_name = check["name"]
            sql = check["sql"]
            expected = check.get("expected", True)
            
            self.log.info(f"Running check: {check_name}")
            self.log.info(f"SQL: {sql}")
            
            result = hook.get_first(sql)
            actual = result[0] if result else None
            passed = actual == expected
            
            results[check_name] = {
                "passed": passed,
                "expected": expected,
                "actual": actual,
            }
            
            if not passed:
                msg = f"Check '{check_name}' FAILED: expected={expected}, actual={actual}"
                self.log.error(msg)
                failures.append(msg)
            else:
                self.log.info(f"Check '{check_name}' PASSED")
        
        if failures and self.fail_on_error:
            raise ValueError(
                f"{len(failures)} data quality checks failed:\n"
                + "\n".join(failures)
            )
        
        return results


# Usage in a DAG
with DAG("custom_operator_example", start_date=datetime(2024, 1, 1)) as dag:
    
    check_orders = DataQualityOperator(
        task_id="check_orders_quality",
        conn_id="warehouse_postgres",
        table="orders",
        checks=[
            {
                "name": "row_count",
                "sql": "SELECT COUNT(*) > 0 FROM orders WHERE date = '{{ ds }}'",
                "expected": True,
            },
            {
                "name": "no_nulls",
                "sql": "SELECT COUNT(*) FROM orders WHERE order_id IS NULL AND date = '{{ ds }}'",
                "expected": 0,
            },
            {
                "name": "amount_positive",
                "sql": "SELECT COUNT(*) FROM orders WHERE amount < 0 AND date = '{{ ds }}'",
                "expected": 0,
            },
        ],
    )
```

---

## 14. Production Scenarios

### Scenario: Complete ETL Pipeline for an E-Commerce Company

```python
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from airflow.providers.amazon.aws.sensors.s3 import S3KeySensor
from airflow.providers.amazon.aws.transfers.s3_to_redshift import S3ToRedshiftOperator
from airflow.operators.email import EmailOperator
from airflow.utils.trigger_rule import TriggerRule
from datetime import datetime, timedelta

default_args = {
    "owner": "data-engineering",
    "depends_on_past": False,
    "email_on_failure": True,
    "email": ["data-eng@company.com"],
    "retries": 3,
    "retry_delay": timedelta(minutes=5),
    "retry_exponential_backoff": True,
    "max_retry_delay": timedelta(minutes=30),
    "execution_timeout": timedelta(hours=2),
}

with DAG(
    dag_id="ecommerce_daily_etl",
    default_args=default_args,
    start_date=datetime(2024, 1, 1),
    schedule="0 6 * * *",                  # 6 AM daily
    catchup=False,
    max_active_runs=1,
    tags=["production", "etl", "ecommerce"],
    doc_md="""
    ## E-Commerce Daily ETL Pipeline
    
    Processes daily order, user, and product data from S3 to Redshift.
    
    **SLA:** Must complete by 8 AM EST.
    **Owner:** data-engineering team
    **Oncall:** #data-eng-oncall Slack channel
    """,
) as dag:
    
    # Step 1: Wait for upstream data
    wait_for_orders = S3KeySensor(
        task_id="wait_for_orders_data",
        bucket_name="raw-data-lake",
        bucket_key="orders/dt={{ ds }}/_SUCCESS",
        aws_conn_id="aws_production",
        timeout=3600,                      # 1 hour max wait
        poke_interval=120,                 # Check every 2 minutes
        mode="reschedule",                 # Free up worker slot while waiting
    )
    
    # Step 2: Validate raw data
    validate = PythonOperator(
        task_id="validate_raw_data",
        python_callable=validate_raw_data,
        op_kwargs={
            "s3_path": "s3://raw-data-lake/orders/dt={{ ds }}/",
            "min_records": 1000,
        },
    )
    
    # Step 3: Transform with Spark
    transform = BashOperator(
        task_id="spark_transform",
        bash_command="""
            spark-submit \
                --master yarn \
                --deploy-mode cluster \
                --num-executors 10 \
                --executor-memory 4g \
                --conf spark.sql.shuffle.partitions=200 \
                s3://scripts/transform_orders.py \
                --date {{ ds }} \
                --input s3://raw-data-lake/orders/dt={{ ds }}/ \
                --output s3://processed-data-lake/orders/dt={{ ds }}/
        """,
        execution_timeout=timedelta(hours=3),
    )
    
    # Step 4: Load to Redshift
    load = S3ToRedshiftOperator(
        task_id="load_to_redshift",
        schema="analytics",
        table="daily_orders",
        s3_bucket="processed-data-lake",
        s3_key="orders/dt={{ ds }}/",
        copy_options=["FORMAT AS PARQUET", "COMPUPDATE ON"],
        redshift_conn_id="redshift_production",
        aws_conn_id="aws_production",
        method="UPSERT",
        upsert_keys=["order_id"],
    )
    
    # Step 5: Data quality checks
    quality_check = PythonOperator(
        task_id="data_quality_check",
        python_callable=run_quality_checks,
    )
    
    # Step 6: Send success notification
    notify_success = EmailOperator(
        task_id="notify_success",
        to=["data-eng@company.com"],
        subject="✅ E-Commerce ETL Success — {{ ds }}",
        html_content="Pipeline completed successfully for {{ ds }}.",
    )
    
    # Step 7: Cleanup on any outcome
    cleanup = BashOperator(
        task_id="cleanup_staging",
        bash_command="aws s3 rm s3://staging/orders/dt={{ ds }}/ --recursive",
        trigger_rule=TriggerRule.ALL_DONE,
    )
    
    # Define dependencies
    wait_for_orders >> validate >> transform >> load >> quality_check >> notify_success
    quality_check >> cleanup
```

---

## 15. Troubleshooting

### Problem 1: "Jinja template not found" or Template Not Rendering

| Aspect | Detail |
|--------|--------|
| **Symptom** | Template variables appear as literal strings: `{{ ds }}` instead of `2024-01-15` |
| **Root Cause** | The field is not in the operator's `template_fields` list |
| **Fix** | Check `MyOperator.template_fields` — only listed fields are rendered |

```python
# Check which fields are templated
print(PythonOperator.template_fields)
# op_kwargs is templated, but python_callable is NOT

# ❌ This won't work — python_callable is not a template field
task = PythonOperator(
    task_id="bad",
    python_callable="{{ var.value.my_func }}",  # Not rendered!
)

# ✅ Use op_kwargs instead
task = PythonOperator(
    task_id="good",
    python_callable=my_func,
    op_kwargs={"date": "{{ ds }}"},  # Rendered correctly!
)
```

### Problem 2: XCom Value is None

| Aspect | Detail |
|--------|--------|
| **Symptom** | `xcom_pull()` returns `None` even though upstream task succeeded |
| **Root Cause** | Wrong `task_ids`, wrong `key`, or function didn't return a value |
| **Fix** | Verify task_id spelling, key name, and that the function has a `return` |

```python
# Common mistakes:
# 1. Typo in task_ids
data = ti.xcom_pull(task_ids="extact")  # Typo! Should be "extract"

# 2. Function doesn't return anything
def extract():
    data = get_data()
    print(data)          # ❌ Forgot to return!
    # return data        # ✅ Must explicitly return

# 3. Wrong key
data = ti.xcom_pull(task_ids="extract", key="data")     # Wrong key
data = ti.xcom_pull(task_ids="extract", key="return_value")  # Correct default key
data = ti.xcom_pull(task_ids="extract")                  # Or omit key for return_value
```

### Problem 3: Task Stuck in "Running" State

| Aspect | Detail |
|--------|--------|
| **Symptom** | Task shows "running" in UI but the actual process is dead |
| **Root Cause** | Worker crashed without updating state; zombie task |
| **Fix** | Airflow has a zombie detection mechanism; check scheduler logs |

```bash
# Manually fix stuck tasks
airflow tasks clear my_dag -t my_task -s 2024-01-15 -e 2024-01-15

# Or mark as failed via CLI
airflow tasks set-state my_dag my_task 2024-01-15 --state failed
```

---

## 16. Common Mistakes

### Mistake 1: Doing Heavy Work at DAG Parse Time

```python
# ❌ BAD — This runs every time the file is parsed (every 30 seconds!)
import pandas as pd
df = pd.read_csv("s3://bucket/config.csv")  # Network call during parsing!

with DAG("my_dag", ...) as dag:
    for _, row in df.iterrows():
        PythonOperator(task_id=f"task_{row['name']}", ...)

# ✅ GOOD — Use lightweight config or read at execution time
import yaml
with open("/opt/airflow/dags/config.yaml") as f:
    config = yaml.safe_load(f)  # Fast, local file read is OK
```

### Mistake 2: Not Setting execution_timeout

```python
# ❌ BAD — Task can run forever if the API hangs
task = PythonOperator(
    task_id="call_api",
    python_callable=call_slow_api,
    # No timeout! Could block a worker slot indefinitely
)

# ✅ GOOD — Always set a timeout for production tasks
task = PythonOperator(
    task_id="call_api",
    python_callable=call_slow_api,
    execution_timeout=timedelta(hours=1),
)
```

### Mistake 3: Using Operators as Functions

```python
# ❌ BAD — Operators are templates, not functions
result = BashOperator(
    task_id="get_date",
    bash_command="date",
).execute({})  # Don't call execute directly!

# ✅ GOOD — Let Airflow orchestrate execution
get_date = BashOperator(
    task_id="get_date",
    bash_command="date",
)
# Airflow calls execute() at the right time with proper context
```

---

## 17. Interview Questions

### Beginner Level

**Q1: What is the difference between an operator, a task, and a task instance?**

> **A:** An **operator** is a Python class that defines *what* to do (it's a template). A **task** is an instance of an operator within a specific DAG (defined at DAG parse time). A **task instance** is a task + execution_date — it represents a specific run of that task for a specific date. Think: Operator is a cookie cutter, Task is the cookie cutter placed on the dough, Task Instance is the actual cookie.

**Q2: Name 5 commonly-used operators and when to use each.**

> **A:**
> 1. **PythonOperator** — Custom Python logic, most versatile
> 2. **BashOperator** — Shell commands, scripts, CLI tools
> 3. **EmailOperator** — Sending email notifications
> 4. **S3ToRedshiftOperator** — Loading S3 data into Redshift
> 5. **BigQueryInsertJobOperator** — Running BigQuery SQL queries

**Q3: What is a Hook and how does it relate to an Operator?**

> **A:** A Hook is a low-level interface to an external system (database, API, cloud service). It handles connection management, authentication, and provides methods to interact with the system. Operators *use* hooks internally. For example, `S3CopyObjectOperator` uses `S3Hook` to connect to AWS S3. You can also use hooks directly in PythonOperator for custom logic.

### Intermediate Level

**Q4: Explain the danger of using `Variable.get()` at the top level of a DAG file.**

> **A:** `Variable.get()` queries the metadata database. DAG files are parsed by the scheduler every `min_file_process_interval` (default 30 seconds). If `Variable.get()` is at the top level (not inside a task function), it runs on every parse — potentially dozens of times per minute. With many DAGs doing this, it can overwhelm the metadata database. The fix: use Jinja templates (`{{ var.value.my_var }}`) which are only rendered at task execution time, or call `Variable.get()` inside the task function.

**Q5: What's the difference between `DockerOperator` and `KubernetesPodOperator`?**

> **A:** Both run tasks in isolated containers, but:
> - **DockerOperator** runs containers on a local Docker daemon. It's simpler but limited to one machine. Good for development or single-server setups.
> - **KubernetesPodOperator** creates pods on a Kubernetes cluster. It supports advanced scheduling (node affinity, tolerations, resource requests), auto-scaling, and GPU access. It's the production choice for cloud-native environments.
> - You can use either with any executor. `KubernetesPodOperator` + `CeleryExecutor` is common — the task runs on a Celery worker, but the worker creates a K8s pod for the actual work.

**Q6: Explain trigger rules. When would you use `ALL_DONE` vs `ONE_SUCCESS`?**

> **A:** Trigger rules determine when a task runs based on its upstream tasks' states:
> - `ALL_DONE`: Task runs after all upstreams have completed, regardless of success/failure. Use for **cleanup tasks** (e.g., deleting temporary files) that must run regardless of pipeline outcome.
> - `ONE_SUCCESS`: Task runs when at least one upstream succeeds. Use for **fallback patterns** where you try multiple sources and only need one to work.

### Advanced Level

**Q7: Design a custom operator for a data quality framework.**

> **A:** (See the DataQualityOperator example in section 13). Key design decisions:
> 1. Inherit from `BaseOperator`
> 2. Define `template_fields` for dynamic SQL queries
> 3. Use hooks for database connectivity (not raw connections)
> 4. Return structured results via XCom for downstream processing
> 5. Support both "fail on error" and "warn only" modes
> 6. Log each check result for debugging
> 7. Implement `on_failure_callback` integration for alerting

**Q8: How does template rendering work internally? When does it happen?**

> **A:** Template rendering happens in the worker process, after the task is picked up but before `execute()` is called. The process:
> 1. Worker deserializes the task instance
> 2. Airflow builds the template context (ds, params, connections, macros, etc.)
> 3. For each field in `template_fields`, Airflow runs Jinja2's `render()` 
> 4. If `template_ext` files are referenced, they're loaded and rendered too
> 5. The rendered values replace the template strings on the operator instance
> 6. Then `execute()` is called with the rendered values
>
> This means template errors are **runtime errors**, not parse-time errors.

**Q9: Your PythonOperator is passing a 500MB DataFrame through XCom, causing metadata DB slowdowns. How do you fix this without changing the DAG structure?**

> **A:** Three approaches, from least to most invasive:
> 1. **Custom XCom Backend**: Implement an S3/GCS XCom backend that transparently stores large values in object storage instead of the DB. The DAG code stays the same — `xcom_push`/`xcom_pull` work transparently.
> 2. **Intermediate Storage Pattern**: Modify the task to write the DataFrame to S3/GCS and return only the path through XCom. The downstream task reads from that path.
> 3. **TaskFlow with Custom Serialization**: Use `@task` decorator with a custom serializer that handles large objects.

---

**[← Previous: 06-executors.md](06-executors.md) | [Home](../README.md) | [Next →: 08-sensors.md](08-sensors.md)**
