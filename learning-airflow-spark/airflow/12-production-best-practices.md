# 🏭 Production Best Practices — Running Airflow Like a Fortune 500 Company

> **"Anyone can build a DAG that works on a laptop. The art is building DAGs that survive production — at 3 AM, on Black Friday, when your data source changes its schema without telling you."**

---

## Table of Contents

- [Intuition — Why Production Practices Matter](#intuition--why-production-practices-matter)
- [Real-World Analogy](#real-world-analogy)
- [DAG Design Patterns](#dag-design-patterns)
- [Idempotency — The Golden Rule](#idempotency--the-golden-rule)
- [Atomicity — All or Nothing](#atomicity--all-or-nothing)
- [Incremental Processing](#incremental-processing)
- [Data Partitioning Strategy](#data-partitioning-strategy)
- [Configuration Management](#configuration-management)
- [Secret Management](#secret-management)
- [CI/CD for DAGs](#cicd-for-dags)
- [Monitoring and Observability](#monitoring-and-observability)
- [Alerting](#alerting)
- [Logging — Remote Logging to S3/GCS](#logging--remote-logging-to-s3gcs)
- [Airflow REST API](#airflow-rest-api)
- [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [Database Maintenance](#database-maintenance)
- [Resource Management](#resource-management)
- [Pool Management](#pool-management)
- [Priority Weights](#priority-weights)
- [DAG Timeout Management](#dag-timeout-management)
- [Production Architecture](#production-architecture)
- [Troubleshooting Production Issues](#troubleshooting-production-issues)
- [Common Mistakes in Production](#common-mistakes-in-production)
- [Interview Questions](#interview-questions)

---

## Intuition — Why Production Practices Matter

Running Airflow in development is easy. Running it in production — where it orchestrates pipelines that affect business revenue, regulatory compliance, and real-time decisions — is an entirely different discipline.

The difference between a hobbyist DAG and a production DAG:

| Aspect | Hobbyist | Production |
|--------|----------|------------|
| **Failure handling** | "I'll fix it manually" | Automatic retries, alerts, self-healing |
| **Data correctness** | "Looks about right" | Idempotent, auditable, verifiable |
| **Scalability** | 5 DAGs | 5,000 DAGs |
| **Monitoring** | Check the UI once a day | Prometheus + Grafana + PagerDuty |
| **Deployment** | Copy files to the server | CI/CD with tests, linting, staging |
| **Secrets** | Hardcoded in DAG files | Vault/Secrets Manager |
| **Maintenance** | "What metadata DB?" | Automated cleanup, partitioning |

---

## Real-World Analogy

Think of running Airflow in production like running a **commercial airport**:

- **DAGs** = Flight routes (scheduled, with dependencies, repeatable)
- **Tasks** = Individual flights (each can succeed, fail, be delayed)
- **Scheduler** = Air Traffic Control (coordinates everything)
- **Executor** = Runways and gates (limited resources, need management)
- **Monitoring** = Radar systems (see everything in real-time)
- **Alerting** = Emergency protocols (triggered on anomalies)
- **Idempotency** = Rebookable flights (if a flight is cancelled, rebook without duplicating passengers)
- **CI/CD** = Flight certification (test before putting passengers on board)

No airline operates on gut feeling. They have standard operating procedures for everything. Your Airflow deployment should too.

---

## DAG Design Patterns

### Pattern 1: ETL Star Pattern

```mermaid
graph TD
    E1["Extract Source A"]
    E2["Extract Source B"]
    E3["Extract Source C"]

    T["Transform & Join"]

    L1["Load to Warehouse"]
    L2["Load to Data Lake"]
    L3["Load to Cache"]

    E1 --> T
    E2 --> T
    E3 --> T
    T --> L1
    T --> L2
    T --> L3

    style T fill:#f39c12,color:#fff
```

### Pattern 2: Staging Pattern (Recommended)

```python
"""
Production Pattern: Stage-then-swap for zero-downtime data loads.
Used by: Netflix, Airbnb, Uber
"""
from airflow.decorators import dag, task
from airflow.providers.postgres.operators.postgres import PostgresOperator
from datetime import datetime

@dag(
    schedule="0 2 * * *",
    start_date=datetime(2024, 1, 1),
    catchup=False,
    tags=["production", "etl"],
    doc_md="""
    ## Daily User Metrics Pipeline
    
    **Owner:** data-engineering@company.com  
    **SLA:** Must complete by 6:00 AM UTC  
    **Data Source:** PostgreSQL (OLTP)  
    **Data Target:** PostgreSQL (OLAP)  
    **Recovery:** Fully idempotent. Safe to re-run.
    """,
)
def daily_user_metrics():
    
    create_staging = PostgresOperator(
        task_id="create_staging_table",
        postgres_conn_id="warehouse",
        sql="""
            DROP TABLE IF EXISTS staging.user_metrics_{{ ds_nodash }};
            CREATE TABLE staging.user_metrics_{{ ds_nodash }} (
                LIKE production.user_metrics INCLUDING ALL
            );
        """,
    )

    populate_staging = PostgresOperator(
        task_id="populate_staging",
        postgres_conn_id="warehouse",
        sql="""
            INSERT INTO staging.user_metrics_{{ ds_nodash }}
            SELECT 
                user_id,
                COUNT(*) as total_orders,
                SUM(amount) as total_spend,
                '{{ ds }}'::date as metric_date
            FROM orders
            WHERE order_date = '{{ ds }}'
            GROUP BY user_id;
        """,
    )

    validate = PostgresOperator(
        task_id="validate_staging",
        postgres_conn_id="warehouse",
        sql="""
            DO $$
            DECLARE row_count INTEGER;
            BEGIN
                SELECT COUNT(*) INTO row_count 
                FROM staging.user_metrics_{{ ds_nodash }};
                
                IF row_count = 0 THEN
                    RAISE EXCEPTION 'Staging table is empty for {{ ds }}';
                END IF;
            END $$;
        """,
    )

    swap_tables = PostgresOperator(
        task_id="swap_to_production",
        postgres_conn_id="warehouse",
        sql="""
            BEGIN;
            DELETE FROM production.user_metrics 
            WHERE metric_date = '{{ ds }}';
            
            INSERT INTO production.user_metrics 
            SELECT * FROM staging.user_metrics_{{ ds_nodash }};
            COMMIT;
        """,
    )

    cleanup = PostgresOperator(
        task_id="cleanup_staging",
        postgres_conn_id="warehouse",
        sql="DROP TABLE IF EXISTS staging.user_metrics_{{ ds_nodash }};",
        trigger_rule="all_done",  # Always cleanup, even on failure
    )

    create_staging >> populate_staging >> validate >> swap_tables >> cleanup

daily_user_metrics()
```

### Pattern 3: Sensor-Triggered Pattern

```python
from airflow.providers.amazon.aws.sensors.s3 import S3KeySensor

wait_for_file = S3KeySensor(
    task_id="wait_for_upstream_file",
    bucket_key="data/{{ ds }}/users.parquet",
    bucket_name="partner-data",
    aws_conn_id="aws_prod",
    timeout=3600 * 6,              # Wait up to 6 hours
    poke_interval=300,              # Check every 5 minutes
    mode="reschedule",              # Don't hold a worker slot while waiting
    soft_fail=True,                 # Mark as skipped (not failed) on timeout
)
```

### Pattern 4: Branching Pattern

```python
from airflow.decorators import dag, task
from airflow.operators.python import BranchPythonOperator

@dag(schedule="@daily", start_date=datetime(2024, 1, 1), catchup=False)
def branching_pipeline():

    @task.branch
    def check_data_quality(ds=None):
        """Branch based on data quality results"""
        quality_score = run_quality_checks(ds)
        if quality_score > 0.95:
            return "full_processing"
        elif quality_score > 0.80:
            return "partial_processing_with_alert"
        else:
            return "halt_and_alert"

    @task
    def full_processing():
        pass

    @task
    def partial_processing_with_alert():
        send_alert("Data quality below 95%, processing partial dataset")

    @task
    def halt_and_alert():
        send_critical_alert("Data quality below 80%, halting pipeline")
        raise AirflowFailException("Data quality too low")
```

---

## Idempotency — The Golden Rule

### What is Idempotency?

> **An operation is idempotent if running it once produces the same result as running it N times.**

This is the **single most important property** of a production DAG. Why? Because:
- Tasks will be **retried** on failure
- DAGs will be **backfilled** for historical dates
- Engineers will accidentally **re-run** DAGs
- Kubernetes pods get **rescheduled** mid-execution

### How to Achieve Idempotency

```mermaid
graph TD
    subgraph "❌ Non-Idempotent (DANGEROUS)"
        A1["INSERT INTO orders VALUES(...)"]
        A2["Running twice → duplicate rows"]
    end

    subgraph "✅ Idempotent (SAFE)"
        B1["DELETE FROM orders WHERE date='2024-01-15'"]
        B2["INSERT INTO orders SELECT ... WHERE date='2024-01-15'"]
        B3["Running twice → same result"]
    end

    style A2 fill:#e74c3c,color:#fff
    style B3 fill:#27ae60,color:#fff
```

### Production-Grade Idempotent Patterns

```python
# Pattern 1: Delete-then-insert (most common)
sql = """
    DELETE FROM target_table WHERE partition_date = '{{ ds }}';
    INSERT INTO target_table 
    SELECT * FROM source_table WHERE event_date = '{{ ds }}';
"""

# Pattern 2: MERGE/UPSERT
sql = """
    MERGE INTO target_table t
    USING source_table s
    ON t.id = s.id AND t.partition_date = '{{ ds }}'
    WHEN MATCHED THEN UPDATE SET t.value = s.value
    WHEN NOT MATCHED THEN INSERT (id, value, partition_date) 
        VALUES (s.id, s.value, '{{ ds }}');
"""

# Pattern 3: Overwrite partition (for data lakes)
@task
def write_to_s3(ds=None):
    """Overwrite the partition — idempotent by design"""
    output_path = f"s3://data-lake/metrics/dt={ds}/"
    df.write.mode("overwrite").parquet(output_path)

# Pattern 4: Replace file (for file systems)
@task
def generate_report(ds=None):
    """Same input date → same output file"""
    output_file = f"/reports/daily/{ds}/summary.pdf"
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    create_report(ds, output_file)  # Overwrites if exists
```

### Testing Idempotency

```python
"""Test that a DAG is idempotent by running it twice"""
def test_idempotency():
    # Run the pipeline
    result1 = run_pipeline(date="2024-01-15")
    row_count_1 = get_row_count("target_table", "2024-01-15")
    
    # Run it again
    result2 = run_pipeline(date="2024-01-15")
    row_count_2 = get_row_count("target_table", "2024-01-15")
    
    # Row count should be identical
    assert row_count_1 == row_count_2, "Pipeline is NOT idempotent!"
```

---

## Atomicity — All or Nothing

### The Problem

If your task writes to 3 tables and fails after writing to 2, you have **inconsistent data**. The next retry will write to all 3, potentially duplicating the first 2.

### The Solution: Transactional Processing

```python
@task
def atomic_load(ds=None):
    """All-or-nothing loading with database transactions"""
    from sqlalchemy import create_engine
    
    engine = create_engine(Variable.get("warehouse_uri"))
    
    with engine.begin() as conn:  # Transaction — auto-rollback on exception
        # Delete existing data for this date
        conn.execute(f"DELETE FROM dim_users WHERE load_date = '{ds}'")
        conn.execute(f"DELETE FROM dim_products WHERE load_date = '{ds}'")
        conn.execute(f"DELETE FROM fact_orders WHERE load_date = '{ds}'")
        
        # Load new data
        conn.execute(f"INSERT INTO dim_users SELECT ... WHERE date = '{ds}'")
        conn.execute(f"INSERT INTO dim_products SELECT ... WHERE date = '{ds}'")
        conn.execute(f"INSERT INTO fact_orders SELECT ... WHERE date = '{ds}'")
        
        # If ANY statement fails, ALL changes are rolled back
```

### For File Systems: Staging Directories

```python
@task
def atomic_file_write(ds=None):
    """Atomic file write using temp directory + rename"""
    import shutil
    import tempfile
    
    final_dir = f"/data/output/{ds}/"
    temp_dir = tempfile.mkdtemp(prefix=f"airflow_{ds}_")
    
    try:
        # Write to temp directory
        write_files(temp_dir)
        validate_files(temp_dir)
        
        # Atomic swap: remove old, rename temp to final
        if os.path.exists(final_dir):
            shutil.rmtree(final_dir)
        os.rename(temp_dir, final_dir)  # Atomic on same filesystem
        
    except Exception:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise
```

---

## Incremental Processing

### Full Load vs Incremental Load

```mermaid
graph LR
    subgraph "Full Load"
        F1["Read ALL source data"] --> F2["Replace ALL target data"]
        F3["Time: O(total data)"]
    end

    subgraph "Incremental Load"
        I1["Read ONLY new/changed data"] --> I2["Merge into target"]
        I3["Time: O(new data)"]
    end

    style F3 fill:#e74c3c,color:#fff
    style I3 fill:#27ae60,color:#fff
```

### Production Incremental Pattern

```python
@dag(schedule="@hourly", start_date=datetime(2024, 1, 1), catchup=True)
def incremental_pipeline():
    """
    Process only data from the current interval.
    Uses data_interval_start and data_interval_end for precise windowing.
    """

    @task
    def extract_incremental(data_interval_start=None, data_interval_end=None):
        """Extract only new data since last successful run"""
        query = f"""
            SELECT * FROM source_events
            WHERE event_time >= '{data_interval_start}'
              AND event_time < '{data_interval_end}'
        """
        return execute_query(query)

    @task
    def load_incremental(data, data_interval_start=None):
        """Upsert new data into target"""
        partition = data_interval_start.strftime("%Y-%m-%d-%H")
        upsert_to_target(data, partition_key=partition)
```

### High-Water Mark Pattern

```python
@task
def extract_with_watermark():
    """Use a stored watermark to track progress"""
    from airflow.models import Variable
    
    last_watermark = Variable.get("orders_watermark", default_var="2020-01-01")
    
    new_data = query(f"""
        SELECT * FROM orders 
        WHERE updated_at > '{last_watermark}'
        ORDER BY updated_at
        LIMIT 100000
    """)
    
    if new_data:
        new_watermark = max(row["updated_at"] for row in new_data)
        Variable.set("orders_watermark", str(new_watermark))
    
    return new_data
```

---

## Data Partitioning Strategy

### Why Partition?

Partitioning is essential for:
1. **Idempotency** — Replace a partition without touching other data
2. **Performance** — Query only the partitions you need
3. **Data management** — Drop old partitions easily
4. **Parallelism** — Process partitions independently

### Common Partitioning Schemes

| Scheme | Example Path | Use Case |
|--------|-------------|----------|
| **Daily** | `s3://lake/events/dt=2024-01-15/` | Most batch pipelines |
| **Hourly** | `s3://lake/events/dt=2024-01-15/hour=14/` | Near-real-time |
| **By source** | `s3://lake/events/source=app/dt=2024-01-15/` | Multi-source ingestion |
| **By region** | `s3://lake/events/region=us-east/dt=2024-01-15/` | Geo-distributed data |

```python
@task
def write_partitioned(ds=None):
    """Write data partitioned by date — enables idempotent overwrites"""
    output_path = f"s3://data-lake/processed/dt={ds}/"
    
    df.write \
        .mode("overwrite") \
        .partitionBy("event_type") \
        .parquet(output_path)
```

---

## Configuration Management

### The Configuration Hierarchy

```mermaid
graph TD
    A["Environment Variables<br/>(AIRFLOW__CORE__PARALLELISM)"]
    B["airflow.cfg<br/>(core.parallelism)"]
    C["Airflow Variables<br/>(Admin → Variables)"]
    D["Airflow Connections<br/>(Admin → Connections)"]
    E["DAG-level params<br/>(default_args, params)"]
    F["Task-level params<br/>(op_args, op_kwargs)"]

    A -->|Highest priority| B
    B --> C
    C --> D
    D --> E
    E --> F

    style A fill:#e74c3c,color:#fff
    style F fill:#3498db,color:#fff
```

### Variables — Best Practices

```python
from airflow.models import Variable

# ✅ Good: Use JSON variables for grouped config
config = Variable.get("etl_config", deserialize_json=True)
# Returns: {"batch_size": 1000, "timeout": 300, "env": "prod"}

# ✅ Good: Use default values
threshold = Variable.get("quality_threshold", default_var="0.95")

# ❌ Bad: Calling Variable.get() at module level (runs during DAG parsing)
# This creates a DB query every time the scheduler parses DAGs
BAD_CONFIG = Variable.get("config")  # DON'T DO THIS!

# ✅ Good: Call inside a task or use Jinja templating
@task
def my_task():
    config = Variable.get("config")  # Only called at runtime

# ✅ Best: Use Jinja templates — no DB query at parse time
bash_task = BashOperator(
    task_id="my_bash",
    bash_command="echo {{ var.json.etl_config.batch_size }}",
)
```

### Connections — Best Practices

```python
from airflow.hooks.base import BaseHook

# ✅ Get connection at runtime
@task
def fetch_data():
    conn = BaseHook.get_connection("my_postgres")
    uri = conn.get_uri()
    # or access individual fields:
    host = conn.host
    port = conn.port
    schema = conn.schema
    login = conn.login
    password = conn.password
    extra = conn.extra_dejson  # JSON parsed
```

### Environment Variables for Configuration

```bash
# Airflow configuration via env vars (AIRFLOW__SECTION__KEY)
export AIRFLOW__CORE__PARALLELISM=64
export AIRFLOW__CORE__MAX_ACTIVE_TASKS_PER_DAG=32
export AIRFLOW__SCHEDULER__MIN_FILE_PROCESS_INTERVAL=30
export AIRFLOW__WEBSERVER__EXPOSE_CONFIG=false

# Connection via env var
export AIRFLOW_CONN_MY_POSTGRES="postgresql://user:pass@host:5432/db"
```

---

## Secret Management

### Why External Secret Management?

> **Never store secrets in DAG files, Airflow Variables, or environment variables in plain text.** Use a dedicated secrets backend.

### HashiCorp Vault Integration

```ini
# airflow.cfg
[secrets]
backend = airflow.providers.hashicorp.secrets.vault.VaultBackend
backend_kwargs = {
    "connections_path": "airflow/connections",
    "variables_path": "airflow/variables",
    "url": "https://vault.company.com:8200",
    "auth_type": "approle",
    "role_id": "airflow-role",
    "secret_id_env_var": "VAULT_SECRET_ID",
    "mount_point": "secret"
}
```

### AWS Secrets Manager Integration

```ini
# airflow.cfg
[secrets]
backend = airflow.providers.amazon.aws.secrets.secrets_manager.SecretsManagerBackend
backend_kwargs = {
    "connections_prefix": "airflow/connections",
    "variables_prefix": "airflow/variables",
    "region_name": "us-east-1"
}
```

```python
# Store a connection in AWS Secrets Manager:
# Secret name: airflow/connections/my_postgres
# Secret value: {"conn_type": "postgresql", "host": "...", "login": "...", "password": "..."}

# Airflow automatically discovers it:
@task
def query_db():
    hook = PostgresHook(postgres_conn_id="my_postgres")  # Auto-resolved from Secrets Manager
    return hook.get_records("SELECT COUNT(*) FROM users")
```

### Secret Lookup Order

```mermaid
graph LR
    A["Code requests connection 'my_postgres'"]
    B{"Check Secrets Backend<br/>(Vault/AWS SM)"}
    C{"Check Environment Variables<br/>(AIRFLOW_CONN_MY_POSTGRES)"}
    D{"Check Metadata DB<br/>(Admin → Connections)"}
    E["Connection Found ✅"]
    F["Connection Not Found ❌"]

    A --> B
    B -->|Found| E
    B -->|Not Found| C
    C -->|Found| E
    C -->|Not Found| D
    D -->|Found| E
    D -->|Not Found| F

    style E fill:#27ae60,color:#fff
    style F fill:#e74c3c,color:#fff
```

---

## CI/CD for DAGs

### DAG Testing Pyramid

```mermaid
graph BT
    U["Unit Tests<br/>(Fast, isolated, many)"]
    I["Integration Tests<br/>(Test with dependencies)"]
    E["End-to-End Tests<br/>(Full DAG execution)"]

    U --> I
    I --> E

    style U fill:#27ae60,color:#fff
    style I fill:#f39c12,color:#fff
    style E fill:#e74c3c,color:#fff
```

### Unit Tests

```python
"""tests/test_dags.py — Essential DAG validation tests"""
import pytest
from airflow.models import DagBag

@pytest.fixture(scope="session")
def dagbag():
    return DagBag(dag_folder="dags/", include_examples=False)

def test_no_import_errors(dagbag):
    """Verify all DAGs can be parsed without errors"""
    assert len(dagbag.import_errors) == 0, \
        f"DAG import errors: {dagbag.import_errors}"

def test_dag_count(dagbag):
    """Verify expected number of DAGs"""
    assert len(dagbag.dags) >= 10, "Expected at least 10 DAGs"

@pytest.mark.parametrize("dag_id", [
    "daily_user_metrics",
    "hourly_ingestion",
    "weekly_report",
])
def test_dag_has_tags(dagbag, dag_id):
    """All production DAGs must have tags"""
    dag = dagbag.get_dag(dag_id)
    assert dag is not None, f"DAG {dag_id} not found"
    assert len(dag.tags) > 0, f"DAG {dag_id} has no tags"

def test_dag_has_owner(dagbag):
    """All DAGs must have an owner (not 'airflow')"""
    for dag_id, dag in dagbag.dags.items():
        assert dag.default_args.get("owner", "airflow") != "airflow", \
            f"DAG {dag_id} has default owner. Set a real owner."

def test_no_cycles(dagbag):
    """Verify no circular dependencies"""
    for dag_id, dag in dagbag.dags.items():
        # DAG.topological_sort() will raise if cycles exist
        dag.topological_sort()

def test_task_retries(dagbag):
    """All tasks should have at least 1 retry"""
    for dag_id, dag in dagbag.dags.items():
        for task in dag.tasks:
            assert task.retries >= 1, \
                f"Task {dag_id}.{task.task_id} has 0 retries"
```

### Integration Tests

```python
"""tests/test_dag_integration.py"""
import pytest
from airflow.models import DagBag, TaskInstance
from airflow.utils.state import State
from datetime import datetime

def test_task_renders_correctly():
    """Test that Jinja templates render correctly"""
    dagbag = DagBag()
    dag = dagbag.get_dag("daily_user_metrics")
    task = dag.get_task("populate_staging")
    
    ti = TaskInstance(task=task, execution_date=datetime(2024, 1, 15))
    rendered = ti.render_templates()
    
    assert "2024-01-15" in rendered.sql
    assert "staging.user_metrics_20240115" in rendered.sql
```

### DAG Linting

```python
"""lint_dags.py — Custom DAG linting rules"""

def lint_dag(dag):
    """Enforce company DAG standards"""
    errors = []
    
    # Rule 1: Must have description
    if not dag.doc_md and not dag.description:
        errors.append(f"{dag.dag_id}: Missing description/doc_md")
    
    # Rule 2: Must have tags
    if not dag.tags:
        errors.append(f"{dag.dag_id}: Missing tags")
    
    # Rule 3: Must have SLA or timeout
    for task in dag.tasks:
        if not task.sla and not task.execution_timeout:
            errors.append(
                f"{dag.dag_id}.{task.task_id}: No SLA or execution_timeout"
            )
    
    # Rule 4: Must use approved connections
    approved_conn_ids = {"aws_prod", "warehouse_prod", "slack_alerts"}
    # ... check connection IDs
    
    # Rule 5: No hardcoded credentials
    import inspect
    source = inspect.getsource(dag.fileloc) if hasattr(dag, 'fileloc') else ""
    if "password" in source.lower() or "secret" in source.lower():
        errors.append(f"{dag.dag_id}: Possible hardcoded credentials")
    
    return errors
```

### CI/CD Pipeline

```mermaid
graph LR
    A["Git Push"] --> B["CI Pipeline"]
    B --> C["Lint DAGs<br/>(pylint, ruff)"]
    C --> D["Unit Tests<br/>(pytest)"]
    D --> E["DAG Validation<br/>(import check)"]
    E --> F["Integration Tests<br/>(staging env)"]
    F --> G["Deploy to Staging"]
    G --> H["Smoke Tests"]
    H --> I["Deploy to Production"]
    I --> J["Health Check"]

    style A fill:#3498db,color:#fff
    style I fill:#27ae60,color:#fff
```

```yaml
# .github/workflows/airflow-ci.yml
name: Airflow CI/CD

on:
  push:
    branches: [main]
    paths: ['dags/**']
  pull_request:
    paths: ['dags/**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install apache-airflow==2.8.0 pytest ruff
          pip install -r requirements.txt
      
      - name: Lint
        run: ruff check dags/
      
      - name: Validate DAGs
        run: python -c "
          from airflow.models import DagBag
          db = DagBag('dags/', include_examples=False)
          assert not db.import_errors, f'Errors: {db.import_errors}'
          print(f'✅ {len(db.dags)} DAGs validated successfully')
        "
      
      - name: Unit Tests
        run: pytest tests/ -v

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Sync DAGs to S3
        run: aws s3 sync dags/ s3://airflow-dags-prod/ --delete
```

---

## Monitoring and Observability

### What to Monitor

```mermaid
graph TD
    subgraph "System Metrics"
        S1["Scheduler heartbeat"]
        S2["DAG parse time"]
        S3["Scheduler loop duration"]
        S4["Executor queue depth"]
    end

    subgraph "Task Metrics"
        T1["Task duration"]
        T2["Task success/failure rate"]
        T3["Task queue wait time"]
        T4["Active tasks per DAG"]
    end

    subgraph "Infrastructure Metrics"
        I1["CPU / Memory usage"]
        I2["Database connections"]
        I3["Metadata DB size"]
        I4["Worker pod count"]
    end

    subgraph "Business Metrics"
        B1["Data freshness"]
        B2["Row counts"]
        B3["SLA compliance"]
        B4["Pipeline throughput"]
    end
```

### StatsD + Prometheus + Grafana Stack

```ini
# airflow.cfg — Enable StatsD metrics
[metrics]
statsd_on = True
statsd_host = statsd-exporter
statsd_port = 9125
statsd_prefix = airflow

# Key metrics emitted:
# airflow.dag.{dag_id}.duration           — DAG run duration
# airflow.dag_processing.total_parse_time — Time to parse all DAGs
# airflow.scheduler.heartbeat             — Scheduler health
# airflow.executor.queued_tasks           — Tasks waiting for execution
# airflow.executor.running_tasks          — Tasks currently executing
# airflow.pool.open_slots.{pool}          — Available pool slots
# airflow.ti.{dag_id}.{task_id}.duration  — Individual task duration
```

### Prometheus Alerting Rules

```yaml
# prometheus-alerts.yml
groups:
  - name: airflow-alerts
    rules:
      - alert: AirflowSchedulerDown
        expr: up{job="airflow-scheduler"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Airflow scheduler is down"
          
      - alert: AirflowHighTaskFailureRate
        expr: |
          rate(airflow_ti_failures_total[1h]) / 
          rate(airflow_ti_finish_total[1h]) > 0.1
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Task failure rate exceeds 10%"
          
      - alert: AirflowDAGParseTimeSlow
        expr: airflow_dag_processing_total_parse_time > 60
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "DAG parsing taking over 60 seconds"
          
      - alert: AirflowMetadataDBGrowing
        expr: pg_database_size_bytes{datname="airflow"} > 10e9
        labels:
          severity: warning
        annotations:
          summary: "Airflow metadata DB exceeds 10 GB"
```

---

## Alerting

### SLA Misses

```python
from datetime import timedelta

@dag(
    schedule="@daily",
    start_date=datetime(2024, 1, 1),
    sla_miss_callback=sla_miss_handler,
)
def sla_sensitive_pipeline():

    @task(sla=timedelta(hours=2))  # Must complete within 2 hours
    def critical_etl():
        pass

def sla_miss_handler(dag, task_list, blocking_task_list, slas, blocking_tis):
    """Called when any task misses its SLA"""
    msg = f"🚨 SLA Miss in DAG: {dag.dag_id}\n"
    msg += f"Tasks: {[t.task_id for t in task_list]}\n"
    msg += f"Blocking: {[t.task_id for t in blocking_tis]}"
    send_slack_alert(msg, channel="#data-alerts")
```

### Callback Functions

```python
from airflow.decorators import dag, task

def on_failure(context):
    """Called when a task fails"""
    task_instance = context["task_instance"]
    exception = context.get("exception", "Unknown")
    
    msg = (
        f"❌ Task Failed\n"
        f"DAG: {task_instance.dag_id}\n"
        f"Task: {task_instance.task_id}\n"
        f"Execution Date: {task_instance.execution_date}\n"
        f"Error: {exception}\n"
        f"Log: {task_instance.log_url}"
    )
    send_pagerduty_alert(msg, severity="critical")

def on_success(context):
    """Called when a task succeeds"""
    # Update monitoring dashboard, send metrics
    pass

def on_retry(context):
    """Called when a task is retried"""
    task_instance = context["task_instance"]
    msg = f"⚠️ Retrying {task_instance.task_id} (attempt {task_instance.try_number})"
    send_slack_alert(msg, channel="#data-warnings")

@dag(
    schedule="@daily",
    start_date=datetime(2024, 1, 1),
    default_args={
        "on_failure_callback": on_failure,
        "on_success_callback": on_success,
        "on_retry_callback": on_retry,
        "retries": 3,
        "retry_delay": timedelta(minutes=5),
    },
)
def monitored_pipeline():
    pass
```

### DAG-Level Callbacks

```python
def dag_success_callback(context):
    """Called when entire DAG run succeeds"""
    dag_run = context["dag_run"]
    duration = (dag_run.end_date - dag_run.start_date).total_seconds()
    send_metric("dag.duration", duration, tags={"dag": dag_run.dag_id})

def dag_failure_callback(context):
    """Called when DAG run fails"""
    send_pagerduty_alert(
        f"DAG {context['dag_run'].dag_id} failed!",
        severity="critical"
    )

@dag(
    on_success_callback=dag_success_callback,
    on_failure_callback=dag_failure_callback,
)
def my_dag():
    pass
```

---

## Logging — Remote Logging to S3/GCS

### Why Remote Logging?

- Workers are **ephemeral** (especially on Kubernetes)
- Logs need to survive **pod restarts**
- Centralized logs for **debugging across workers**
- Compliance and **audit requirements**

### S3 Remote Logging

```ini
# airflow.cfg
[logging]
remote_logging = True
remote_log_conn_id = aws_production
remote_base_log_folder = s3://airflow-logs/production/
encrypt_s3_logs = True
```

### GCS Remote Logging

```ini
# airflow.cfg
[logging]
remote_logging = True
remote_log_conn_id = google_cloud_default
remote_base_log_folder = gs://airflow-logs/production/
```

### Custom Logging Configuration

```python
# config/log_config.py
import os
from airflow.config_templates.airflow_local_settings import DEFAULT_LOGGING_CONFIG

LOGGING_CONFIG = {
    **DEFAULT_LOGGING_CONFIG,
    "handlers": {
        **DEFAULT_LOGGING_CONFIG["handlers"],
        "task": {
            "class": "airflow.utils.log.file_task_handler.FileTaskHandler",
            "formatter": "airflow",
            "base_log_folder": os.path.expanduser("~/airflow/logs"),
        },
    },
}
```

---

## Airflow REST API

### Key API Endpoints

```bash
# List all DAGs
curl -X GET "http://airflow:8080/api/v1/dags" \
     -H "Authorization: Basic $(echo -n 'admin:admin' | base64)"

# Trigger a DAG run
curl -X POST "http://airflow:8080/api/v1/dags/my_dag/dagRuns" \
     -H "Content-Type: application/json" \
     -H "Authorization: Basic ..." \
     -d '{"conf": {"key": "value"}, "logical_date": "2024-01-15T00:00:00Z"}'

# Get task instance status
curl -X GET "http://airflow:8080/api/v1/dags/my_dag/dagRuns/run_id/taskInstances" \
     -H "Authorization: Basic ..."

# Pause/unpause a DAG
curl -X PATCH "http://airflow:8080/api/v1/dags/my_dag" \
     -H "Content-Type: application/json" \
     -d '{"is_paused": false}'
```

### Using the API in Automation

```python
"""Trigger DAGs programmatically from external systems"""
import requests
from datetime import datetime

class AirflowClient:
    def __init__(self, base_url, username, password):
        self.base_url = base_url
        self.auth = (username, password)
    
    def trigger_dag(self, dag_id, conf=None, logical_date=None):
        """Trigger a DAG run"""
        payload = {}
        if conf:
            payload["conf"] = conf
        if logical_date:
            payload["logical_date"] = logical_date.isoformat()
        
        response = requests.post(
            f"{self.base_url}/api/v1/dags/{dag_id}/dagRuns",
            json=payload,
            auth=self.auth,
        )
        response.raise_for_status()
        return response.json()
    
    def get_dag_run_status(self, dag_id, run_id):
        """Check status of a DAG run"""
        response = requests.get(
            f"{self.base_url}/api/v1/dags/{dag_id}/dagRuns/{run_id}",
            auth=self.auth,
        )
        return response.json()["state"]

# Usage
client = AirflowClient("http://airflow:8080", "admin", "password")
run = client.trigger_dag("etl_pipeline", conf={"source": "api"})
```

---

## Role-Based Access Control (RBAC)

### Built-in Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to everything |
| **Op** | Full access to DAGs, limited admin |
| **User** | View/trigger DAGs, view logs |
| **Viewer** | Read-only access |
| **Public** | No access (authentication required) |

### Custom Roles

```python
# Create custom roles using the Airflow CLI or Security Manager
# In webserver_config.py:

from airflow.security import permissions
from airflow.www.fab_security.manager import AUTH_DB

AUTH_TYPE = AUTH_DB

# Or use LDAP/OAuth:
# AUTH_TYPE = AUTH_LDAP
# AUTH_LDAP_SERVER = "ldap://ldap.company.com"
```

### DAG-Level Access Control

```python
@dag(
    access_control={
        "data-engineering": {"can_read", "can_edit", "can_delete"},
        "data-science": {"can_read"},
        "finance": {"can_read"},
    },
)
def financial_pipeline():
    pass
```

---

## Database Maintenance

### Why Metadata DB Maintenance Matters

The metadata DB stores:
- Every DAG run ever executed
- Every task instance status
- All XCom values
- All logs, job states, and audit records

**Without maintenance, it grows unbounded and eventually kills performance.**

### Automated Cleanup

```python
"""DAG for automated metadata DB cleanup"""
from airflow.decorators import dag, task
from datetime import datetime, timedelta

@dag(
    schedule="0 3 * * 0",  # Weekly on Sundays at 3 AM
    start_date=datetime(2024, 1, 1),
    catchup=False,
    tags=["maintenance"],
)
def metadata_db_cleanup():

    @task
    def cleanup_old_data():
        """Remove data older than retention period"""
        from airflow.utils.db import provide_session
        from airflow.models import DagRun, TaskInstance, Log, XCom
        from sqlalchemy import delete
        
        retention_days = 90
        cutoff = datetime.utcnow() - timedelta(days=retention_days)
        
        @provide_session
        def _cleanup(session=None):
            # Clean XCom
            xcom_deleted = session.execute(
                delete(XCom).where(XCom.timestamp < cutoff)
            ).rowcount
            
            # Clean task instances
            ti_deleted = session.execute(
                delete(TaskInstance).where(
                    TaskInstance.start_date < cutoff,
                    TaskInstance.state.in_(["success", "skipped"]),
                )
            ).rowcount
            
            session.commit()
            return {"xcom": xcom_deleted, "task_instances": ti_deleted}
        
        return _cleanup()

    cleanup_old_data()

metadata_db_cleanup()
```

### CLI-Based Cleanup

```bash
# Clean up old DAG runs (keep last 30 days)
airflow db clean --clean-before-timestamp "2024-01-01 00:00:00" --tables dag_run,task_instance,xcom,log --yes

# Check DB size
airflow db check
```

### Useful Maintenance SQL Queries

```sql
-- Check metadata DB size by table
SELECT
    table_name,
    pg_size_pretty(pg_total_relation_size(table_name::text)) as total_size,
    pg_size_pretty(pg_relation_size(table_name::text)) as data_size,
    pg_size_pretty(pg_indexes_size(table_name::text)) as index_size
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(table_name::text) DESC
LIMIT 20;

-- Find DAGs with the most task instances
SELECT dag_id, COUNT(*) as ti_count
FROM task_instance
GROUP BY dag_id
ORDER BY ti_count DESC
LIMIT 10;

-- Check for zombie task instances
SELECT dag_id, task_id, state, start_date, hostname
FROM task_instance
WHERE state = 'running'
  AND start_date < NOW() - INTERVAL '24 hours';

-- XCom storage usage
SELECT dag_id, task_id, 
       COUNT(*) as xcom_count,
       SUM(LENGTH(value::text)) as total_bytes
FROM xcom
GROUP BY dag_id, task_id
ORDER BY total_bytes DESC
LIMIT 10;
```

---

## Resource Management

### Key Resources to Manage

```mermaid
graph TD
    subgraph "Global Resources"
        G1["parallelism<br/>(max tasks across all DAGs)"]
        G2["max_active_runs_per_dag"]
        G3["max_active_tasks_per_dag"]
    end

    subgraph "Worker Resources"
        W1["Worker count"]
        W2["Worker CPU/Memory"]
        W3["worker_concurrency"]
    end

    subgraph "Executor Resources"
        E1["Pools (slot limits)"]
        E2["Priority weights"]
        E3["Queue assignments"]
    end

    subgraph "Scheduler Resources"
        S1["parsing_processes"]
        S2["scheduler_heartbeat_sec"]
        S3["min_file_process_interval"]
    end
```

### Resource Configuration

```ini
# airflow.cfg — Production resource settings

[core]
# Maximum task instances across the entire Airflow installation
parallelism = 128

# Max active DAG runs per DAG
max_active_runs_per_dag = 3

# Max active tasks per DAG run
max_active_tasks_per_dag = 32

[scheduler]
# Number of processes for parsing DAGs
parsing_processes = 4

# Minimum seconds between re-parsing a DAG file
min_file_process_interval = 30

# Scheduler heartbeat interval
scheduler_heartbeat_sec = 5

# Max number of TIs to schedule per loop
max_tis_per_query = 512

[celery]
# Tasks each worker can run concurrently
worker_concurrency = 16
```

---

## Pool Management

### What Are Pools?

Pools limit the number of concurrent task instances that can access a shared resource (database, API, etc.).

### Pool Setup

```python
from airflow.models import Pool
from airflow.utils.db import provide_session

@provide_session
def create_pools(session=None):
    """Create pools programmatically"""
    pools = [
        Pool(pool="database_pool", slots=10, description="Limit DB connections"),
        Pool(pool="api_pool", slots=5, description="Rate limit API calls"),
        Pool(pool="gpu_pool", slots=2, description="GPU-bound tasks"),
        Pool(pool="heavy_processing", slots=8, description="CPU-intensive tasks"),
    ]
    for pool in pools:
        existing = session.query(Pool).filter(Pool.pool == pool.pool).first()
        if not existing:
            session.add(pool)
    session.commit()
```

### Using Pools in DAGs

```python
@task(pool="database_pool", pool_slots=2)  # Takes 2 slots per instance
def heavy_db_query():
    """This task uses 2 of the 10 database pool slots"""
    pass

@task(pool="api_pool")
def call_api():
    """Only 5 concurrent API calls allowed"""
    pass
```

### Pool Monitoring

```python
# Check pool usage
from airflow.models import Pool

def get_pool_stats():
    pools = Pool.get_pools()
    for pool in pools:
        print(f"Pool: {pool.pool}")
        print(f"  Total slots: {pool.slots}")
        print(f"  Running: {pool.running_slots()}")
        print(f"  Queued: {pool.queued_slots()}")
        print(f"  Open: {pool.open_slots()}")
```

---

## Priority Weights

### How Priority Works

Tasks with higher priority weights are scheduled before tasks with lower weights when resources are limited.

```python
# Critical pipeline — high priority
@task(priority_weight=100)
def revenue_report():
    """Business-critical — always runs first"""
    pass

# Normal pipeline — default priority
@task(priority_weight=1)
def analytics_report():
    """Nice-to-have — can wait"""
    pass

# Batch processing — low priority
@task(priority_weight=0)
def cleanup_old_data():
    """Background task — runs when resources are free"""
    pass
```

### Weight Rules

```python
from airflow.utils.weight_rule import WeightRule

@dag(
    schedule="@daily",
    start_date=datetime(2024, 1, 1),
)
def priority_example():
    # "downstream" (default): weight = sum of all downstream weights
    # "upstream": weight = sum of all upstream weights
    # "absolute": weight = the task's own weight only

    @task(
        priority_weight=10,
        weight_rule=WeightRule.ABSOLUTE,  # Use only this task's weight
    )
    def critical_task():
        pass
```

---

## DAG Timeout Management

### Execution Timeouts

```python
from datetime import timedelta

@dag(
    schedule="@daily",
    start_date=datetime(2024, 1, 1),
    dagrun_timeout=timedelta(hours=6),  # Entire DAG run must finish in 6 hours
)
def timeout_example():

    @task(execution_timeout=timedelta(minutes=30))
    def short_task():
        """Fails if runs longer than 30 minutes"""
        pass

    @task(
        execution_timeout=timedelta(hours=2),
        retries=2,
        retry_delay=timedelta(minutes=10),
    )
    def long_task():
        """2-hour timeout, with retries"""
        pass
```

### Why Timeouts Are Critical

> **⚠️ Warning:** Without timeouts, a hung task will hold a worker slot **forever**, slowly draining your cluster capacity. Always set execution timeouts on tasks and dagrun_timeout on DAGs.

---

## Production Architecture

### Recommended Production Setup

```mermaid
graph TD
    subgraph "Load Balancer"
        LB["NGINX / ALB"]
    end

    subgraph "Airflow Components"
        WS1["Webserver 1"]
        WS2["Webserver 2"]
        S1["Scheduler 1 (Active)"]
        S2["Scheduler 2 (Standby)"]
        TR["Triggerer"]
    end

    subgraph "Workers (Auto-Scaling)"
        W1["Worker 1"]
        W2["Worker 2"]
        W3["Worker N"]
    end

    subgraph "Shared Infrastructure"
        DB["PostgreSQL (HA)<br/>Metadata DB"]
        RD["Redis (HA)<br/>Message Broker"]
        S3["S3/GCS<br/>Logs + DAGs"]
    end

    LB --> WS1
    LB --> WS2
    S1 --> DB
    S2 --> DB
    S1 --> RD
    W1 --> DB
    W2 --> DB
    W3 --> DB
    W1 --> RD
    W2 --> RD
    W3 --> RD
    WS1 --> DB
    WS2 --> DB
    W1 --> S3
    W2 --> S3
    W3 --> S3
    TR --> DB

    style DB fill:#3498db,color:#fff
    style RD fill:#e74c3c,color:#fff
    style S3 fill:#f39c12,color:#fff
```

---

## Troubleshooting Production Issues

### Problem: Scheduler Lag

**Symptom:** DAGs are triggered but tasks take minutes/hours to start.

**Diagnosis:**
```bash
# Check scheduler heartbeat
airflow jobs check --job-type SchedulerJob --hostname $(hostname)

# Check parsing time
grep "DAG parsing" ~/airflow/logs/scheduler/*.log | tail -20

# Check DB connection pool
SELECT count(*) FROM pg_stat_activity WHERE datname = 'airflow';
```

**Fix:**
1. Increase `parsing_processes`
2. Reduce DAG complexity (fewer tasks per DAG)
3. Increase `min_file_process_interval` (parse less often)
4. Scale up metadata DB (CPU, connections, IOPS)
5. Use DAG serialization (enabled by default in 2.x)

### Problem: Workers Running Out of Memory

**Symptom:** Workers crash with OOM errors; tasks are marked as `failed` without logs.

**Fix:**
1. Increase worker memory
2. Reduce `worker_concurrency` (fewer concurrent tasks per worker)
3. Use pools to limit concurrent heavy tasks
4. Offload heavy processing to external systems (Spark, Kubernetes pods)

### Problem: Metadata DB Growing Too Large

**Symptom:** Airflow becomes sluggish; queries to the UI time out.

**Fix:**
1. Enable `airflow db clean` on a schedule
2. Reduce XCom usage (don't pass large data through XCom)
3. Use a custom XCom backend (S3/GCS) for large values
4. Archive old DAG runs to cold storage
5. Add database indexes on frequently queried columns

---

## Common Mistakes in Production

### Mistake 1: No Idempotency

```python
# ❌ Appends duplicates on retry
INSERT INTO target SELECT * FROM source WHERE date = '{{ ds }}'

# ✅ Idempotent: delete then insert
DELETE FROM target WHERE date = '{{ ds }}';
INSERT INTO target SELECT * FROM source WHERE date = '{{ ds }}';
```

### Mistake 2: Hardcoded Secrets

```python
# ❌ Never do this
conn = psycopg2.connect(host="db.company.com", password="hunter2")

# ✅ Use Airflow connections
hook = PostgresHook(postgres_conn_id="warehouse_prod")
```

### Mistake 3: No Retries

```python
# ❌ No retries = one transient error kills the pipeline
@task
def fragile_task():
    pass

# ✅ Always set retries with exponential backoff
@task(retries=3, retry_delay=timedelta(minutes=5), retry_exponential_backoff=True)
def resilient_task():
    pass
```

### Mistake 4: Not Using Pools

```python
# ❌ 100 concurrent connections to the same DB = connection pool exhaustion
process.expand(table=hundred_tables)

# ✅ Limit with pools
@task(pool="db_pool")  # Pool with 10 slots
def process(table):
    pass
```

### Mistake 5: Querying External Systems at Parse Time

```python
# ❌ This runs every 30 seconds during DAG parsing
import requests
config = requests.get("http://config-service/settings").json()

# ✅ Move to runtime
@task
def get_config():
    import requests
    return requests.get("http://config-service/settings").json()
```

---

## Interview Questions

### Beginner

**Q1: What does idempotency mean in the context of Airflow DAGs?**

**A:** An idempotent DAG produces the same result whether you run it once or 10 times for the same execution date. This is critical because tasks get retried on failure, DAGs get backfilled, and operators may accidentally re-trigger runs. The common pattern is "delete-then-insert" for database loads and "overwrite" mode for file writes.

**Q2: Why should you never query external systems at DAG parse time?**

**A:** DAG files are parsed by the scheduler every 30 seconds (configurable). If you query an API, database, or cloud service at the module level of your DAG file, that query runs every 30 seconds across all scheduler processes. This creates excessive load on external systems, slows down DAG parsing, and creates failures if the external system is unavailable.

---

### Intermediate

**Q3: Describe a CI/CD pipeline for Airflow DAGs.**

**A:** A production CI/CD pipeline for Airflow includes: (1) **Linting** with tools like ruff/pylint, (2) **DAG import validation** — ensuring all DAGs can be parsed without errors using `DagBag`, (3) **Unit tests** — testing individual task logic, template rendering, and DAG structure (no cycles, proper tags, owners), (4) **Integration tests** — testing DAG execution in a staging environment, (5) **Deployment** — syncing DAG files to the production DAGs folder (via S3, GCS, or git-sync), (6) **Health checks** — verifying DAGs appear and are parseable in production.

**Q4: How would you manage secrets in a production Airflow deployment?**

**A:** Use an external secrets backend such as HashiCorp Vault or AWS Secrets Manager. Configure the `[secrets]` section in `airflow.cfg` to point to the backend. Airflow will automatically look up Connections and Variables from the secrets backend before falling back to environment variables and the metadata DB. This keeps secrets out of code, DAG files, and the metadata DB, while enabling secret rotation and audit logging.

---

### Advanced

**Q5: How would you design Airflow monitoring for 1,000+ DAGs?**

**A:** I'd implement a multi-layered monitoring strategy: (1) **System metrics** via StatsD → Prometheus → Grafana, tracking scheduler heartbeat, parse times, executor queue depth, and task durations. (2) **Alerting** via Prometheus Alertmanager with rules for scheduler downtime, high failure rates, SLA misses, and metadata DB growth. (3) **Business metrics** using custom DAG callbacks to track data freshness, row counts, and pipeline throughput. (4) **Centralized logging** with remote logging to S3/GCS, aggregated via ELK or CloudWatch. (5) **Dashboard per team** showing their DAGs' health, SLA compliance, and resource utilization. At 1,000+ DAGs, I'd also implement pool management to prevent resource contention and use priority weights to ensure critical pipelines run first.

**Q6: Your Airflow metadata DB has grown to 500 GB and the UI is slow. What do you do?**

**A:** Immediate actions: (1) Identify the largest tables using `pg_total_relation_size`. Usually `task_instance`, `xcom`, `log`, and `dag_run` are the culprits. (2) Run `airflow db clean` to remove records older than the retention period. (3) If XCom is large, migrate to a custom XCom backend (S3/GCS). (4) Add indexes on frequently queried columns. (5) Consider table partitioning for `task_instance` by date. Long-term: set up automated cleanup DAGs, configure retention policies, and monitor DB growth via Prometheus alerts.

---

## Summary

| Practice | Why | How |
|----------|-----|-----|
| **Idempotency** | Safe retries & backfills | Delete-then-insert, overwrite mode |
| **Atomicity** | Consistent data | Database transactions, staging dirs |
| **Incremental processing** | Performance | data_interval_start/end, watermarks |
| **Secrets management** | Security | Vault, AWS Secrets Manager |
| **CI/CD** | Reliability | Tests, linting, staging environment |
| **Monitoring** | Visibility | StatsD, Prometheus, Grafana |
| **Alerting** | Fast response | Callbacks, SLA misses, PagerDuty |
| **DB maintenance** | Performance | Automated cleanup, retention policies |
| **Pools** | Resource protection | Limit concurrent access to shared resources |
| **Timeouts** | Prevent hung tasks | execution_timeout, dagrun_timeout |

---

**[← Previous: Dynamic Task Mapping](11-dynamic-task-mapping.md) | [Home](../README.md) | [Next →: Airflow on Kubernetes](13-airflow-on-kubernetes.md)**
