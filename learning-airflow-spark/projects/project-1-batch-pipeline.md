# Project 1: Building a Production Batch ETL Pipeline

> **Scenario:** You're a data engineer at a mid-size bank. Every day, millions of transaction records land from 6 different source systems — ATMs, mobile banking, wire transfers, POS terminals, online payments, and branch operations. Your job is to build a pipeline that ingests all of this, validates it, enriches it with customer and merchant metadata, computes daily aggregates, and writes everything to a Parquet-based data lake that the analytics team queries via Trino/Presto.

---

## 🎯 What You'll Build

```mermaid
graph LR
    subgraph Sources
        A1["ATM CSV Files"]
        A2["Mobile JSON Logs"]
        A3["Wire Transfer XML"]
        A4["POS Terminal CSVs"]
        A5["Online Payment API"]
        A6["Branch Operations DB"]
    end

    subgraph "Airflow Orchestration"
        B["DAG: daily_bank_etl"]
        B1["Task: validate_sources"]
        B2["Task: extract_data"]
        B3["Task: transform_data"]
        B4["Task: quality_checks"]
        B5["Task: load_to_warehouse"]
        B6["Task: generate_reports"]
        B7["Task: send_notifications"]
    end

    subgraph "Data Lake (S3/HDFS)"
        C1["Bronze Layer<br/>Raw Parquet"]
        C2["Silver Layer<br/>Cleaned & Enriched"]
        C3["Gold Layer<br/>Aggregated Tables"]
    end

    A1 & A2 & A3 & A4 & A5 & A6 --> B1
    B1 --> B2 --> B3 --> B4
    B4 --> B5 --> B6 --> B7
    B2 --> C1
    B3 --> C2
    B5 --> C3

    style B fill:#017CEE,color:#fff
    style C1 fill:#cd7f32,color:#fff
    style C2 fill:#c0c0c0,color:#000
    style C3 fill:#ffd700,color:#000
```

---

## 📁 Project Structure

```
bank-etl-pipeline/
├── dags/
│   ├── daily_bank_etl.py              # Main DAG definition
│   ├── configs/
│   │   ├── pipeline_config.yaml       # Pipeline configuration
│   │   └── data_quality_rules.yaml    # DQ rules per source
│   └── utils/
│       ├── alerting.py                # Slack/PagerDuty notifications
│       └── dag_helpers.py             # Shared DAG utilities
├── spark_jobs/
│   ├── extract/
│   │   ├── extract_csv_sources.py     # CSV extraction (ATM, POS)
│   │   ├── extract_json_sources.py    # JSON extraction (Mobile)
│   │   └── extract_db_sources.py      # JDBC extraction (Branch ops)
│   ├── transform/
│   │   ├── clean_transactions.py      # Data cleaning & validation
│   │   ├── enrich_transactions.py     # Join with dimension tables
│   │   └── aggregate_transactions.py  # Daily/hourly aggregates
│   ├── quality/
│   │   └── data_quality_checks.py     # Programmatic DQ checks
│   └── common/
│       ├── schemas.py                 # PySpark schema definitions
│       ├── transformations.py         # Reusable transformations
│       └── spark_session.py           # Session factory
├── tests/
│   ├── test_transformations.py        # Unit tests for transforms
│   ├── test_data_quality.py           # DQ check tests
│   ├── test_dag_integrity.py          # DAG validation tests
│   └── fixtures/
│       ├── sample_atm_data.csv
│       ├── sample_mobile_data.json
│       └── expected_outputs/
├── docker/
│   ├── docker-compose.yml             # Local dev environment
│   ├── Dockerfile.airflow
│   └── Dockerfile.spark
├── configs/
│   ├── spark-defaults.conf
│   └── log4j.properties
├── Makefile
├── requirements.txt
└── README.md
```

---

## 🏗️ Data Modeling

### The Medallion Architecture

This pipeline uses the **Bronze → Silver → Gold** layered approach. Here's why this matters in production:

```mermaid
graph TD
    subgraph "Bronze Layer — Raw Ingestion"
        B1["Append-only raw data"]
        B2["Schema: source schema + metadata"]
        B3["Partition: ingestion_date"]
        B4["Purpose: Audit trail, reprocessing"]
    end

    subgraph "Silver Layer — Cleaned & Enriched"
        S1["Deduplicated, validated"]
        S2["Schema: canonical transaction schema"]
        S3["Partition: transaction_date, source_system"]
        S4["Purpose: Single source of truth"]
    end

    subgraph "Gold Layer — Business Aggregates"
        G1["Pre-computed aggregates"]
        G2["Schema: business-specific"]
        G3["Partition: report_date"]
        G4["Purpose: Fast queries, dashboards"]
    end

    B1 --> S1 --> G1

    style B1 fill:#cd7f32,color:#fff
    style B2 fill:#cd7f32,color:#fff
    style B3 fill:#cd7f32,color:#fff
    style B4 fill:#cd7f32,color:#fff
    style S1 fill:#c0c0c0,color:#000
    style S2 fill:#c0c0c0,color:#000
    style S3 fill:#c0c0c0,color:#000
    style S4 fill:#c0c0c0,color:#000
    style G1 fill:#ffd700,color:#000
    style G2 fill:#ffd700,color:#000
    style G3 fill:#ffd700,color:#000
    style G4 fill:#ffd700,color:#000
```

### Schema Definitions

```python
# spark_jobs/common/schemas.py
"""
Canonical schema definitions for the bank ETL pipeline.

Why define schemas explicitly?
1. Catch schema drift early — a new column in source shouldn't silently break downstream
2. Enforce types — "amount" as string vs double is a $10M bug waiting to happen
3. Documentation — schemas ARE documentation that never goes stale
"""

from pyspark.sql.types import (
    StructType, StructField, StringType, DoubleType,
    TimestampType, IntegerType, LongType, BooleanType, DateType
)

# ──────────────────────────────────────────────
# Bronze Layer Schemas (per source system)
# ──────────────────────────────────────────────

ATM_RAW_SCHEMA = StructType([
    StructField("transaction_id", StringType(), nullable=False),
    StructField("atm_id", StringType(), nullable=False),
    StructField("card_number", StringType(), nullable=False),
    StructField("transaction_type", StringType(), nullable=True),   # WITHDRAWAL, DEPOSIT, BALANCE_CHECK
    StructField("amount", StringType(), nullable=True),              # String in source — we'll cast later
    StructField("currency", StringType(), nullable=True),
    StructField("timestamp", StringType(), nullable=True),           # ISO-8601 string from source
    StructField("status", StringType(), nullable=True),              # SUCCESS, FAILED, TIMEOUT
    StructField("error_code", StringType(), nullable=True),
])

MOBILE_RAW_SCHEMA = StructType([
    StructField("event_id", StringType(), nullable=False),
    StructField("user_id", StringType(), nullable=False),
    StructField("action", StringType(), nullable=True),
    StructField("amount", DoubleType(), nullable=True),
    StructField("recipient_account", StringType(), nullable=True),
    StructField("device_type", StringType(), nullable=True),
    StructField("app_version", StringType(), nullable=True),
    StructField("event_timestamp", StringType(), nullable=True),
    StructField("ip_address", StringType(), nullable=True),
    StructField("geo_lat", DoubleType(), nullable=True),
    StructField("geo_lon", DoubleType(), nullable=True),
])

# ──────────────────────────────────────────────
# Silver Layer Schema (canonical)
# ──────────────────────────────────────────────

CANONICAL_TRANSACTION_SCHEMA = StructType([
    StructField("transaction_id", StringType(), nullable=False),
    StructField("source_system", StringType(), nullable=False),      # ATM, MOBILE, WIRE, POS, ONLINE, BRANCH
    StructField("customer_id", StringType(), nullable=False),
    StructField("account_id", StringType(), nullable=True),
    StructField("transaction_type", StringType(), nullable=False),   # Normalized: DEBIT, CREDIT, TRANSFER
    StructField("amount", DoubleType(), nullable=False),
    StructField("currency", StringType(), nullable=False),
    StructField("amount_usd", DoubleType(), nullable=True),         # Converted to USD
    StructField("transaction_timestamp", TimestampType(), nullable=False),
    StructField("transaction_date", DateType(), nullable=False),     # Partition column
    StructField("merchant_id", StringType(), nullable=True),
    StructField("merchant_category", StringType(), nullable=True),
    StructField("status", StringType(), nullable=False),
    StructField("is_flagged", BooleanType(), nullable=False),        # Fraud flag
    StructField("flag_reason", StringType(), nullable=True),
    StructField("processing_timestamp", TimestampType(), nullable=False),
    StructField("batch_id", StringType(), nullable=False),           # For lineage tracking
])

# ──────────────────────────────────────────────
# Gold Layer Schemas
# ──────────────────────────────────────────────

DAILY_SUMMARY_SCHEMA = StructType([
    StructField("report_date", DateType(), nullable=False),
    StructField("source_system", StringType(), nullable=False),
    StructField("transaction_type", StringType(), nullable=False),
    StructField("total_count", LongType(), nullable=False),
    StructField("total_amount_usd", DoubleType(), nullable=False),
    StructField("avg_amount_usd", DoubleType(), nullable=False),
    StructField("max_amount_usd", DoubleType(), nullable=False),
    StructField("failed_count", LongType(), nullable=False),
    StructField("flagged_count", LongType(), nullable=False),
    StructField("unique_customers", LongType(), nullable=False),
])
```

---

## 🔧 Step 1: Spark Session Factory

```python
# spark_jobs/common/spark_session.py
"""
SparkSession factory with production-grade configuration.

Why a factory?
- Consistent configuration across all jobs
- Easy to switch between local/cluster modes
- Centralized tuning parameters
"""

from pyspark.sql import SparkSession
import os


def create_spark_session(
    app_name: str,
    master: str = None,
    enable_hive: bool = False,
    extra_configs: dict = None,
) -> SparkSession:
    """
    Create a SparkSession with production defaults.

    Args:
        app_name: Name shown in Spark UI — use something descriptive like
                  'bank-etl-extract-atm-2024-01-15'
        master: Spark master URL. None = use spark-defaults.conf
        enable_hive: Whether to enable Hive metastore support
        extra_configs: Additional Spark config overrides
    """
    builder = SparkSession.builder.appName(app_name)

    if master:
        builder = builder.master(master)

    if enable_hive:
        builder = builder.enableHiveSupport()

    # Production defaults — these prevent 80% of common issues
    default_configs = {
        # Adaptive Query Execution — let Spark auto-tune at runtime
        "spark.sql.adaptive.enabled": "true",
        "spark.sql.adaptive.coalescePartitions.enabled": "true",
        "spark.sql.adaptive.skewJoin.enabled": "true",

        # Parquet optimizations
        "spark.sql.parquet.compression.codec": "snappy",
        "spark.sql.parquet.mergeSchema": "false",       # Expensive — disable unless needed
        "spark.sql.parquet.filterPushdown": "true",

        # Memory safety
        "spark.sql.broadcastTimeout": "600",             # 10 minutes for large broadcasts
        "spark.sql.autoBroadcastJoinThreshold": "50MB",  # Auto-broadcast tables < 50MB

        # Shuffle tuning
        "spark.sql.shuffle.partitions": "200",           # Default 200, override per job
        "spark.shuffle.compress": "true",

        # Fault tolerance
        "spark.task.maxFailures": "4",
        "spark.speculation": "true",                     # Kill slow tasks, re-run them
        "spark.speculation.quantile": "0.9",

        # Timezone consistency — critical for financial data
        "spark.sql.session.timeZone": "UTC",
    }

    # Apply defaults, then overrides
    for key, value in default_configs.items():
        builder = builder.config(key, value)

    if extra_configs:
        for key, value in extra_configs.items():
            builder = builder.config(key, value)

    spark = builder.getOrCreate()

    # Set log level — INFO is too noisy in production
    spark.sparkContext.setLogLevel("WARN")

    return spark
```

---

## 🔧 Step 2: Extraction Layer

```python
# spark_jobs/extract/extract_csv_sources.py
"""
Extract CSV data from ATM and POS terminal sources.

Production considerations:
- Files may arrive late or not at all
- Files may be corrupt (partial writes, encoding issues)
- Schema may drift without notice
- Same file may be delivered twice (idempotency!)
"""

import sys
import logging
from datetime import datetime
from pyspark.sql import SparkSession, DataFrame
from pyspark.sql.functions import (
    col, lit, current_timestamp, input_file_name,
    sha2, concat_ws
)

# Add common modules to path
sys.path.insert(0, '/opt/spark-jobs/common')
from schemas import ATM_RAW_SCHEMA
from spark_session import create_spark_session

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def extract_csv_with_validation(
    spark: SparkSession,
    source_path: str,
    schema: StructType,
    source_system: str,
    processing_date: str,
    batch_id: str,
) -> DataFrame:
    """
    Extract CSV files with production-grade error handling.

    This function handles:
    1. Missing files (no data for today)
    2. Schema validation (reject rows that don't match)
    3. Corrupt records (capture them separately)
    4. Metadata enrichment (add lineage columns)
    5. Deduplication (same file delivered twice)
    """

    logger.info(f"Extracting {source_system} data from: {source_path}")

    # Read with PERMISSIVE mode — don't fail on bad records
    # Instead, put the entire malformed row into _corrupt_record
    raw_df = (
        spark.read
        .option("header", "true")
        .option("mode", "PERMISSIVE")
        .option("columnNameOfCorruptRecord", "_corrupt_record")
        .option("dateFormat", "yyyy-MM-dd")
        .option("timestampFormat", "yyyy-MM-dd'T'HH:mm:ss")
        .option("encoding", "UTF-8")
        .option("multiLine", "false")        # One record per line
        .option("ignoreLeadingWhiteSpace", "true")
        .option("ignoreTrailingWhiteSpace", "true")
        .schema(schema.add("_corrupt_record", "string"))
        .csv(source_path)
    )

    # Separate valid and corrupt records
    valid_df = raw_df.filter(col("_corrupt_record").isNull()).drop("_corrupt_record")
    corrupt_df = raw_df.filter(col("_corrupt_record").isNotNull())

    corrupt_count = corrupt_df.count()
    if corrupt_count > 0:
        logger.warning(f"Found {corrupt_count} corrupt records in {source_system}")

        # Write corrupt records for investigation
        corrupt_path = f"s3://bank-data/quarantine/{source_system}/{processing_date}/"
        corrupt_df.write.mode("overwrite").json(corrupt_path)

    # Add metadata columns for lineage tracking
    enriched_df = (
        valid_df
        .withColumn("_source_system", lit(source_system))
        .withColumn("_source_file", input_file_name())
        .withColumn("_processing_timestamp", current_timestamp())
        .withColumn("_batch_id", lit(batch_id))
        .withColumn("_processing_date", lit(processing_date))
        # Create a row hash for deduplication
        .withColumn("_row_hash", sha2(
            concat_ws("|", *[col(c) for c in valid_df.columns]),
            256
        ))
    )

    record_count = enriched_df.count()
    logger.info(f"Extracted {record_count} valid records from {source_system}")

    return enriched_df


def write_to_bronze(df: DataFrame, source_system: str, processing_date: str):
    """
    Write to Bronze layer with idempotent overwrite.

    Why overwrite mode for a specific partition?
    - If the pipeline fails and reruns, we don't want duplicates
    - Overwriting just today's partition is safe because Bronze is append-by-date
    - This is the "idempotent write" pattern — run it 10 times, same result
    """

    bronze_path = f"s3://bank-data/bronze/{source_system}"

    (
        df.write
        .mode("overwrite")
        .partitionBy("_processing_date")
        .option("path", bronze_path)
        .parquet(bronze_path)
    )

    logger.info(f"Written to Bronze: {bronze_path}/_processing_date={processing_date}")


def main():
    """Entry point when called via spark-submit."""

    # Arguments passed from Airflow via SparkSubmitOperator
    processing_date = sys.argv[1]  # e.g., "2024-01-15"
    batch_id = sys.argv[2]         # e.g., "batch-2024-01-15-001"

    spark = create_spark_session(
        app_name=f"bank-etl-extract-csv-{processing_date}",
        extra_configs={
            "spark.sql.shuffle.partitions": "50",  # CSV extraction doesn't need many
        }
    )

    try:
        # Extract ATM transactions
        atm_path = f"s3://bank-raw/atm/{processing_date}/*.csv"
        atm_df = extract_csv_with_validation(
            spark, atm_path, ATM_RAW_SCHEMA, "ATM", processing_date, batch_id
        )
        write_to_bronze(atm_df, "atm", processing_date)

        # Extract POS transactions
        pos_path = f"s3://bank-raw/pos/{processing_date}/*.csv"
        # POS uses same schema structure as ATM in this example
        pos_df = extract_csv_with_validation(
            spark, pos_path, ATM_RAW_SCHEMA, "POS", processing_date, batch_id
        )
        write_to_bronze(pos_df, "pos", processing_date)

        logger.info(f"CSV extraction complete for {processing_date}")

    except Exception as e:
        logger.error(f"Extraction failed: {str(e)}", exc_info=True)
        sys.exit(1)
    finally:
        spark.stop()


if __name__ == "__main__":
    main()
```

---

## 🔧 Step 3: Transformation Layer

```python
# spark_jobs/transform/clean_transactions.py
"""
Clean and normalize transaction data from all sources into a canonical schema.

This is where 70% of data engineering bugs live. Real-world data is messy:
- Amounts as strings with currency symbols: "$1,234.56"
- Timestamps in 15 different formats
- Null vs empty string vs "N/A" vs "null"
- Duplicate records from source system retries
- Unicode garbage in text fields
"""

import sys
import logging
from pyspark.sql import SparkSession, DataFrame
from pyspark.sql.functions import (
    col, when, lit, regexp_replace, trim, upper, lower,
    to_timestamp, to_date, coalesce, current_timestamp,
    row_number, sha2, concat_ws, broadcast, round as spark_round
)
from pyspark.sql.window import Window
from pyspark.sql.types import DoubleType, TimestampType

sys.path.insert(0, '/opt/spark-jobs/common')
from spark_session import create_spark_session

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def clean_amount(df: DataFrame, amount_col: str) -> DataFrame:
    """
    Clean monetary amounts from various source formats.

    Real examples we've seen in production:
    - "$1,234.56"  → 1234.56
    - "1.234,56"   → 1234.56 (European format)
    - "(500.00)"   → -500.00 (accounting negative)
    - "N/A"        → null
    - ""           → null
    """
    return df.withColumn(
        amount_col,
        when(
            col(amount_col).rlike(r"^[\s]*$") | col(amount_col).isNull() |
            (upper(col(amount_col)) == "N/A") | (upper(col(amount_col)) == "NULL"),
            lit(None).cast(DoubleType())
        )
        .otherwise(
            regexp_replace(
                regexp_replace(
                    regexp_replace(col(amount_col), r"[$€£¥,]", ""),  # Remove currency symbols
                    r"\(([0-9.]+)\)", "-$1"                            # (500) → -500
                ),
                r"[^\d.\-]", ""                                        # Remove remaining non-numeric
            ).cast(DoubleType())
        )
    )


def normalize_timestamp(df: DataFrame, ts_col: str, output_col: str) -> DataFrame:
    """
    Parse timestamps from multiple formats into a consistent UTC timestamp.

    Source systems use different formats:
    - ATM:    "2024-01-15T14:30:00"
    - Mobile: "2024-01-15 14:30:00.000Z"
    - POS:    "01/15/2024 02:30:00 PM"
    - Wire:   "20240115143000"        (compact format)
    """
    return df.withColumn(
        output_col,
        coalesce(
            to_timestamp(col(ts_col), "yyyy-MM-dd'T'HH:mm:ss"),
            to_timestamp(col(ts_col), "yyyy-MM-dd HH:mm:ss.SSS'Z'"),
            to_timestamp(col(ts_col), "yyyy-MM-dd HH:mm:ss"),
            to_timestamp(col(ts_col), "MM/dd/yyyy hh:mm:ss a"),
            to_timestamp(col(ts_col), "yyyyMMddHHmmss"),
        )
    )


def deduplicate_transactions(df: DataFrame) -> DataFrame:
    """
    Remove duplicate transactions using a deterministic dedup strategy.

    Why this is tricky:
    - Same transaction can arrive from multiple source files
    - Source system retries can generate duplicate records
    - We need to keep exactly ONE copy, deterministically

    Strategy: Partition by transaction_id, keep the record with the
    latest processing timestamp. If tied, use row hash as tiebreaker.
    """
    window = Window.partitionBy("transaction_id").orderBy(
        col("_processing_timestamp").desc(),
        col("_row_hash").asc()
    )

    return (
        df
        .withColumn("_row_num", row_number().over(window))
        .filter(col("_row_num") == 1)
        .drop("_row_num")
    )


def normalize_transaction_type(df: DataFrame) -> DataFrame:
    """
    Map source-specific transaction types to canonical categories.

    Each source system has its own vocabulary:
    - ATM: WITHDRAWAL, DEPOSIT, BALANCE_CHECK
    - Mobile: P2P_SEND, P2P_RECEIVE, BILL_PAY
    - POS: PURCHASE, REFUND, VOID
    """
    type_mapping = {
        # ATM types
        "WITHDRAWAL": "DEBIT",
        "DEPOSIT": "CREDIT",
        "BALANCE_CHECK": "INQUIRY",
        # Mobile types
        "P2P_SEND": "DEBIT",
        "P2P_RECEIVE": "CREDIT",
        "BILL_PAY": "DEBIT",
        # POS types
        "PURCHASE": "DEBIT",
        "REFUND": "CREDIT",
        "VOID": "REVERSAL",
        # Wire types
        "WIRE_OUT": "DEBIT",
        "WIRE_IN": "CREDIT",
    }

    # Build a CASE WHEN expression from the mapping
    mapping_expr = col("transaction_type")  # default: keep original
    for source_type, canonical_type in type_mapping.items():
        mapping_expr = when(
            upper(col("transaction_type")) == source_type,
            lit(canonical_type)
        ).otherwise(mapping_expr)
        # Note: This builds a nested when chain. For large mappings,
        # consider a broadcast join with a mapping table instead.

    return df.withColumn("transaction_type", mapping_expr)


def enrich_with_currency_conversion(
    spark: SparkSession,
    transactions_df: DataFrame,
    processing_date: str,
) -> DataFrame:
    """
    Convert all amounts to USD using daily exchange rates.

    Why broadcast join?
    - Exchange rate table is small (~200 rows per day)
    - Transaction table is large (millions of rows)
    - Broadcast avoids shuffle entirely
    """
    # Load exchange rates — small table, perfect for broadcast
    rates_df = (
        spark.read.parquet("s3://bank-reference/exchange_rates/")
        .filter(col("rate_date") == processing_date)
        .select("currency_code", "usd_rate")
    )

    return (
        transactions_df
        .join(
            broadcast(rates_df),
            transactions_df.currency == rates_df.currency_code,
            "left"
        )
        .withColumn(
            "amount_usd",
            spark_round(col("amount") * coalesce(col("usd_rate"), lit(1.0)), 2)
        )
        .drop("currency_code", "usd_rate")
    )


def flag_suspicious_transactions(df: DataFrame) -> DataFrame:
    """
    Basic fraud flagging rules applied during ETL.

    These are simple deterministic rules — the ML fraud model runs separately.
    But catching obvious cases here saves downstream processing time.
    """
    return df.withColumn(
        "is_flagged",
        when(col("amount_usd") > 10000, lit(True))                    # Large transaction
        .when(col("amount_usd") < 0, lit(True))                       # Negative amount
        .when(col("status") == "FAILED", lit(False))                   # Failed txns aren't flagged
        .when(col("transaction_type") == "REVERSAL", lit(False))       # Reversals are expected
        .otherwise(lit(False))
    ).withColumn(
        "flag_reason",
        when(col("amount_usd") > 10000, lit("LARGE_TRANSACTION"))
        .when(col("amount_usd") < 0, lit("NEGATIVE_AMOUNT"))
        .otherwise(lit(None))
    )


def main():
    processing_date = sys.argv[1]
    batch_id = sys.argv[2]

    spark = create_spark_session(
        app_name=f"bank-etl-transform-{processing_date}",
        extra_configs={
            "spark.sql.shuffle.partitions": "200",
        }
    )

    try:
        # Read all Bronze sources
        sources = ["atm", "pos", "mobile", "wire", "online", "branch"]
        all_dfs = []

        for source in sources:
            bronze_path = f"s3://bank-data/bronze/{source}/_processing_date={processing_date}"
            try:
                df = spark.read.parquet(bronze_path)
                all_dfs.append(df)
                logger.info(f"Read {df.count()} records from {source}")
            except Exception as e:
                logger.warning(f"No data found for source {source}: {e}")

        if not all_dfs:
            raise ValueError(f"No data found for any source on {processing_date}")

        # Union all sources
        from functools import reduce
        combined_df = reduce(DataFrame.unionByName, all_dfs)

        # Apply transformation pipeline
        result_df = (
            combined_df
            .transform(lambda df: clean_amount(df, "amount"))
            .transform(lambda df: normalize_timestamp(df, "timestamp", "transaction_timestamp"))
            .transform(deduplicate_transactions)
            .transform(normalize_transaction_type)
            .transform(lambda df: enrich_with_currency_conversion(spark, df, processing_date))
            .transform(flag_suspicious_transactions)
            .withColumn("transaction_date", to_date(col("transaction_timestamp")))
            .withColumn("batch_id", lit(batch_id))
            .withColumn("processing_timestamp", current_timestamp())
        )

        # Write to Silver layer — partition by date and source
        silver_path = "s3://bank-data/silver/transactions"
        (
            result_df.write
            .mode("overwrite")
            .partitionBy("transaction_date", "source_system")
            .parquet(silver_path)
        )

        final_count = result_df.count()
        logger.info(f"Transformation complete: {final_count} records written to Silver")

    except Exception as e:
        logger.error(f"Transformation failed: {str(e)}", exc_info=True)
        sys.exit(1)
    finally:
        spark.stop()


if __name__ == "__main__":
    main()
```

---

## 🔧 Step 4: Data Quality Checks

```python
# spark_jobs/quality/data_quality_checks.py
"""
Data quality framework for the bank ETL pipeline.

Quality checks are NOT optional in financial data pipelines.
A single incorrect transaction amount can cause regulatory issues.

Our DQ framework checks:
1. Completeness — Are required fields populated?
2. Validity    — Do values fall within expected ranges?
3. Consistency — Do cross-field rules hold?
4. Timeliness  — Is data arriving within expected windows?
5. Uniqueness  — Are there unexpected duplicates?
"""

import sys
import json
import logging
from dataclasses import dataclass, asdict
from typing import List, Optional
from datetime import datetime
from pyspark.sql import SparkSession, DataFrame
from pyspark.sql.functions import (
    col, count, sum as spark_sum, when, isnan, isnull,
    min as spark_min, max as spark_max, countDistinct, lit
)

sys.path.insert(0, '/opt/spark-jobs/common')
from spark_session import create_spark_session

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class DQCheckResult:
    """Result of a single data quality check."""
    check_name: str
    check_type: str         # COMPLETENESS, VALIDITY, CONSISTENCY, UNIQUENESS, TIMELINESS
    table_name: str
    column_name: Optional[str]
    expected_value: str
    actual_value: str
    passed: bool
    severity: str           # CRITICAL, WARNING, INFO
    details: Optional[str] = None


class DataQualityChecker:
    """
    Runs data quality checks against a DataFrame and collects results.

    Usage:
        checker = DataQualityChecker("silver_transactions", df)
        checker.check_not_null("transaction_id")
        checker.check_not_null("amount")
        checker.check_range("amount", min_val=0, max_val=1_000_000)
        checker.check_uniqueness("transaction_id")

        results = checker.get_results()
        checker.fail_on_critical()  # Raises if any CRITICAL check fails
    """

    def __init__(self, table_name: str, df: DataFrame):
        self.table_name = table_name
        self.df = df
        self.results: List[DQCheckResult] = []
        self.total_rows = df.count()

        logger.info(f"DQ Checker initialized for {table_name} ({self.total_rows} rows)")

    def check_not_null(
        self, column: str, max_null_pct: float = 0.0, severity: str = "CRITICAL"
    ):
        """Check that a column has no (or few) null values."""
        null_count = self.df.filter(
            col(column).isNull() | isnan(col(column))
        ).count()

        null_pct = (null_count / self.total_rows * 100) if self.total_rows > 0 else 0

        self.results.append(DQCheckResult(
            check_name=f"not_null_{column}",
            check_type="COMPLETENESS",
            table_name=self.table_name,
            column_name=column,
            expected_value=f"null_pct <= {max_null_pct}%",
            actual_value=f"{null_pct:.2f}% ({null_count} nulls)",
            passed=null_pct <= max_null_pct,
            severity=severity,
        ))

    def check_range(
        self, column: str, min_val: float = None, max_val: float = None,
        severity: str = "CRITICAL"
    ):
        """Check that numeric values fall within expected bounds."""
        stats = self.df.agg(
            spark_min(col(column)).alias("min_val"),
            spark_max(col(column)).alias("max_val"),
        ).collect()[0]

        actual_min = stats["min_val"]
        actual_max = stats["max_val"]

        passed = True
        if min_val is not None and actual_min is not None:
            passed = passed and (actual_min >= min_val)
        if max_val is not None and actual_max is not None:
            passed = passed and (actual_max <= max_val)

        self.results.append(DQCheckResult(
            check_name=f"range_{column}",
            check_type="VALIDITY",
            table_name=self.table_name,
            column_name=column,
            expected_value=f"[{min_val}, {max_val}]",
            actual_value=f"[{actual_min}, {actual_max}]",
            passed=passed,
            severity=severity,
        ))

    def check_uniqueness(self, column: str, severity: str = "CRITICAL"):
        """Check that a column has no duplicate values."""
        distinct_count = self.df.select(countDistinct(col(column))).collect()[0][0]
        dup_count = self.total_rows - distinct_count

        self.results.append(DQCheckResult(
            check_name=f"unique_{column}",
            check_type="UNIQUENESS",
            table_name=self.table_name,
            column_name=column,
            expected_value="0 duplicates",
            actual_value=f"{dup_count} duplicates",
            passed=dup_count == 0,
            severity=severity,
        ))

    def check_accepted_values(
        self, column: str, accepted: List[str], severity: str = "WARNING"
    ):
        """Check that all values are from an accepted set."""
        invalid_count = self.df.filter(
            ~col(column).isin(accepted) & col(column).isNotNull()
        ).count()

        self.results.append(DQCheckResult(
            check_name=f"accepted_values_{column}",
            check_type="VALIDITY",
            table_name=self.table_name,
            column_name=column,
            expected_value=f"values in {accepted}",
            actual_value=f"{invalid_count} invalid values",
            passed=invalid_count == 0,
            severity=severity,
        ))

    def check_row_count(
        self, min_rows: int, max_rows: int = None, severity: str = "CRITICAL"
    ):
        """Check that the total row count is within expected bounds."""
        passed = self.total_rows >= min_rows
        if max_rows:
            passed = passed and (self.total_rows <= max_rows)

        self.results.append(DQCheckResult(
            check_name="row_count",
            check_type="COMPLETENESS",
            table_name=self.table_name,
            column_name=None,
            expected_value=f"[{min_rows}, {max_rows or 'inf'}]",
            actual_value=str(self.total_rows),
            passed=passed,
            severity=severity,
        ))

    def check_referential_integrity(
        self, column: str, reference_df: DataFrame, ref_column: str,
        severity: str = "WARNING"
    ):
        """Check that all values in column exist in a reference table."""
        orphan_count = (
            self.df.select(column)
            .distinct()
            .join(reference_df.select(ref_column), col(column) == col(ref_column), "left_anti")
            .count()
        )

        self.results.append(DQCheckResult(
            check_name=f"ref_integrity_{column}",
            check_type="CONSISTENCY",
            table_name=self.table_name,
            column_name=column,
            expected_value="0 orphaned records",
            actual_value=f"{orphan_count} orphaned records",
            passed=orphan_count == 0,
            severity=severity,
        ))

    def get_results(self) -> List[DQCheckResult]:
        """Return all check results."""
        return self.results

    def get_summary(self) -> dict:
        """Return a summary of all checks."""
        total = len(self.results)
        passed = sum(1 for r in self.results if r.passed)
        failed = total - passed
        critical_failures = sum(
            1 for r in self.results if not r.passed and r.severity == "CRITICAL"
        )

        return {
            "table": self.table_name,
            "total_checks": total,
            "passed": passed,
            "failed": failed,
            "critical_failures": critical_failures,
            "pass_rate": f"{(passed/total*100):.1f}%" if total > 0 else "N/A",
            "results": [asdict(r) for r in self.results],
        }

    def fail_on_critical(self):
        """Raise an exception if any CRITICAL check failed."""
        critical_failures = [r for r in self.results if not r.passed and r.severity == "CRITICAL"]
        if critical_failures:
            failure_msgs = [f"  - {r.check_name}: expected {r.expected_value}, got {r.actual_value}"
                           for r in critical_failures]
            msg = f"CRITICAL DQ failures in {self.table_name}:\n" + "\n".join(failure_msgs)
            logger.error(msg)
            raise ValueError(msg)


def main():
    processing_date = sys.argv[1]

    spark = create_spark_session(app_name=f"bank-etl-dq-{processing_date}")

    try:
        # Load Silver layer data
        silver_df = spark.read.parquet(
            f"s3://bank-data/silver/transactions/transaction_date={processing_date}"
        )

        # Run quality checks
        checker = DataQualityChecker("silver_transactions", silver_df)

        # Completeness checks
        checker.check_not_null("transaction_id", severity="CRITICAL")
        checker.check_not_null("customer_id", severity="CRITICAL")
        checker.check_not_null("amount", severity="CRITICAL")
        checker.check_not_null("transaction_timestamp", severity="CRITICAL")
        checker.check_not_null("merchant_id", max_null_pct=30.0, severity="WARNING")

        # Validity checks
        checker.check_range("amount", min_val=-100_000, max_val=10_000_000)
        checker.check_range("amount_usd", min_val=-100_000, max_val=10_000_000)
        checker.check_accepted_values("status", ["SUCCESS", "FAILED", "PENDING", "REVERSED"])
        checker.check_accepted_values("transaction_type", ["DEBIT", "CREDIT", "TRANSFER", "INQUIRY", "REVERSAL"])
        checker.check_accepted_values("source_system", ["ATM", "MOBILE", "WIRE", "POS", "ONLINE", "BRANCH"])

        # Uniqueness checks
        checker.check_uniqueness("transaction_id")

        # Volume check — expect at least 100K transactions daily
        checker.check_row_count(min_rows=100_000, max_rows=50_000_000)

        # Save results
        summary = checker.get_summary()
        results_path = f"s3://bank-data/dq_results/{processing_date}/results.json"

        results_json = json.dumps(summary, indent=2, default=str)
        spark.sparkContext.parallelize([results_json]).saveAsTextFile(results_path)

        logger.info(f"DQ Summary: {summary['passed']}/{summary['total_checks']} checks passed")

        # Fail the job if critical checks fail
        checker.fail_on_critical()

    except Exception as e:
        logger.error(f"Data quality checks failed: {str(e)}", exc_info=True)
        sys.exit(1)
    finally:
        spark.stop()


if __name__ == "__main__":
    main()
```

---

## 🔧 Step 5: Aggregation Layer

```python
# spark_jobs/transform/aggregate_transactions.py
"""
Build Gold layer aggregation tables for dashboards and reporting.

These tables are what the business actually looks at.
The analytics team queries these via Trino/Presto — so they need to be:
1. Pre-aggregated (fast queries)
2. Properly partitioned (partition pruning)
3. Well-documented (column comments, metadata)
"""

import sys
import logging
from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col, count, sum as spark_sum, avg, max as spark_max,
    min as spark_min, countDistinct, when, lit,
    round as spark_round, current_timestamp
)

sys.path.insert(0, '/opt/spark-jobs/common')
from spark_session import create_spark_session

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def build_daily_summary(spark, processing_date: str):
    """
    Aggregate transactions by date, source, and type.
    This is the primary report table used by operations.
    """
    silver_df = spark.read.parquet(
        f"s3://bank-data/silver/transactions/transaction_date={processing_date}"
    )

    daily_summary = (
        silver_df
        .groupBy("transaction_date", "source_system", "transaction_type")
        .agg(
            count("*").alias("total_count"),
            spark_round(spark_sum("amount_usd"), 2).alias("total_amount_usd"),
            spark_round(avg("amount_usd"), 2).alias("avg_amount_usd"),
            spark_round(spark_max("amount_usd"), 2).alias("max_amount_usd"),
            spark_round(spark_min("amount_usd"), 2).alias("min_amount_usd"),
            spark_sum(when(col("status") == "FAILED", 1).otherwise(0)).alias("failed_count"),
            spark_sum(when(col("is_flagged") == True, 1).otherwise(0)).alias("flagged_count"),
            countDistinct("customer_id").alias("unique_customers"),
        )
        .withColumn("report_generated_at", current_timestamp())
    )

    # Write to Gold layer
    gold_path = "s3://bank-data/gold/daily_summary"
    (
        daily_summary.write
        .mode("overwrite")
        .partitionBy("transaction_date")
        .parquet(gold_path)
    )

    logger.info(f"Daily summary written: {daily_summary.count()} rows")
    return daily_summary


def build_customer_daily_profile(spark, processing_date: str):
    """
    Per-customer daily spending profile.
    Used for personalization and anomaly detection.
    """
    silver_df = spark.read.parquet(
        f"s3://bank-data/silver/transactions/transaction_date={processing_date}"
    )

    customer_profile = (
        silver_df
        .filter(col("status") == "SUCCESS")
        .groupBy("transaction_date", "customer_id")
        .agg(
            count("*").alias("transaction_count"),
            spark_round(spark_sum("amount_usd"), 2).alias("total_spent_usd"),
            spark_round(avg("amount_usd"), 2).alias("avg_transaction_usd"),
            spark_round(spark_max("amount_usd"), 2).alias("max_transaction_usd"),
            countDistinct("source_system").alias("channels_used"),
            countDistinct("merchant_category").alias("merchant_categories"),
            spark_sum(when(col("is_flagged"), 1).otherwise(0)).alias("flagged_transactions"),
        )
    )

    gold_path = "s3://bank-data/gold/customer_daily_profile"
    (
        customer_profile.write
        .mode("overwrite")
        .partitionBy("transaction_date")
        .parquet(gold_path)
    )

    logger.info(f"Customer profiles written: {customer_profile.count()} rows")


def main():
    processing_date = sys.argv[1]

    spark = create_spark_session(
        app_name=f"bank-etl-aggregate-{processing_date}",
        extra_configs={
            "spark.sql.shuffle.partitions": "100",
        }
    )

    try:
        build_daily_summary(spark, processing_date)
        build_customer_daily_profile(spark, processing_date)
        logger.info(f"All aggregations complete for {processing_date}")
    except Exception as e:
        logger.error(f"Aggregation failed: {str(e)}", exc_info=True)
        sys.exit(1)
    finally:
        spark.stop()


if __name__ == "__main__":
    main()
```

---

## 🔧 Step 6: The Airflow DAG

```python
# dags/daily_bank_etl.py
"""
Production DAG: Daily Bank Transaction ETL Pipeline

This DAG orchestrates the full ETL pipeline:
1. Validate that source files exist
2. Extract from all source systems (parallel)
3. Transform and clean data
4. Run data quality checks
5. Build Gold layer aggregates
6. Generate reports
7. Send notifications

Design decisions:
- Each Spark job is a separate task for granular retry/monitoring
- Tasks use SparkSubmitOperator (not PythonOperator) for resource isolation
- Idempotent: re-running for the same date produces the same result
- SLA: Pipeline must complete by 6 AM UTC
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator, BranchPythonOperator
from airflow.operators.empty import EmptyOperator
from airflow.providers.apache.spark.operators.spark_submit import SparkSubmitOperator
from airflow.providers.slack.operators.slack_webhook import SlackWebhookOperator
from airflow.sensors.s3_key_sensor import S3KeySensor
from airflow.utils.trigger_rule import TriggerRule
from airflow.models import Variable
import logging

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
# DAG Configuration
# ──────────────────────────────────────────────

SPARK_CONN_ID = "spark_cluster"
S3_CONN_ID = "aws_default"
SLACK_CONN_ID = "slack_data_alerts"

SPARK_JOBS_PATH = "/opt/spark-jobs"

# Default arguments — applied to ALL tasks in this DAG
default_args = {
    "owner": "data-engineering",
    "depends_on_past": False,           # Don't wait for yesterday's run
    "email": ["data-team@bank.com"],
    "email_on_failure": True,
    "email_on_retry": False,
    "retries": 2,                       # Retry failed tasks twice
    "retry_delay": timedelta(minutes=5),
    "retry_exponential_backoff": True,
    "max_retry_delay": timedelta(minutes=30),
    "execution_timeout": timedelta(hours=2),  # Kill task if it runs > 2 hours
    "sla": timedelta(hours=4),          # Alert if task takes > 4 hours
}

# ──────────────────────────────────────────────
# DAG Definition
# ──────────────────────────────────────────────

with DAG(
    dag_id="daily_bank_etl",
    default_args=default_args,
    description="Daily bank transaction ETL: Extract → Transform → Quality → Aggregate",
    schedule_interval="0 2 * * *",       # Run at 2 AM UTC daily
    start_date=datetime(2024, 1, 1),
    catchup=False,                       # Don't backfill on deploy
    max_active_runs=1,                   # Only one run at a time
    tags=["production", "etl", "banking", "daily"],
    doc_md=__doc__,
) as dag:

    # ── Batch ID for lineage tracking ──
    # Uses the logical date (execution_date) for idempotency
    BATCH_ID = "{{ 'batch-' ~ ds_nodash ~ '-001' }}"
    PROCESSING_DATE = "{{ ds }}"         # YYYY-MM-DD format

    # ──────────────────────────────────────────
    # Task: Check Source File Availability
    # ──────────────────────────────────────────

    check_atm_files = S3KeySensor(
        task_id="check_atm_files",
        bucket_name="bank-raw",
        bucket_key=f"atm/{PROCESSING_DATE}/",
        wildcard_match=True,
        aws_conn_id=S3_CONN_ID,
        timeout=3600,                    # Wait up to 1 hour for files
        poke_interval=300,               # Check every 5 minutes
        mode="reschedule",               # Free up worker while waiting
    )

    check_pos_files = S3KeySensor(
        task_id="check_pos_files",
        bucket_name="bank-raw",
        bucket_key=f"pos/{PROCESSING_DATE}/",
        wildcard_match=True,
        aws_conn_id=S3_CONN_ID,
        timeout=3600,
        poke_interval=300,
        mode="reschedule",
    )

    sources_ready = EmptyOperator(
        task_id="sources_ready",
        trigger_rule=TriggerRule.ALL_SUCCESS,
    )

    # ──────────────────────────────────────────
    # Task: Extract Data (Spark Jobs)
    # ──────────────────────────────────────────

    # Common Spark submit configuration
    spark_common_conf = {
        "spark.sql.adaptive.enabled": "true",
        "spark.sql.session.timeZone": "UTC",
        "spark.eventLog.enabled": "true",
        "spark.eventLog.dir": "s3://bank-spark-logs/event-logs/",
    }

    extract_csv = SparkSubmitOperator(
        task_id="extract_csv_sources",
        application=f"{SPARK_JOBS_PATH}/extract/extract_csv_sources.py",
        conn_id=SPARK_CONN_ID,
        application_args=[PROCESSING_DATE, BATCH_ID],
        conf=spark_common_conf,
        name=f"bank-etl-extract-csv-{PROCESSING_DATE}",
        num_executors=4,
        executor_cores=2,
        executor_memory="4g",
        driver_memory="2g",
        py_files=f"{SPARK_JOBS_PATH}/common/*.py",
        verbose=False,
    )

    extract_json = SparkSubmitOperator(
        task_id="extract_json_sources",
        application=f"{SPARK_JOBS_PATH}/extract/extract_json_sources.py",
        conn_id=SPARK_CONN_ID,
        application_args=[PROCESSING_DATE, BATCH_ID],
        conf=spark_common_conf,
        name=f"bank-etl-extract-json-{PROCESSING_DATE}",
        num_executors=4,
        executor_cores=2,
        executor_memory="4g",
        driver_memory="2g",
        py_files=f"{SPARK_JOBS_PATH}/common/*.py",
        verbose=False,
    )

    extract_db = SparkSubmitOperator(
        task_id="extract_db_sources",
        application=f"{SPARK_JOBS_PATH}/extract/extract_db_sources.py",
        conn_id=SPARK_CONN_ID,
        application_args=[PROCESSING_DATE, BATCH_ID],
        conf={
            **spark_common_conf,
            "spark.jars": "/opt/spark/jars/postgresql-42.6.0.jar",  # JDBC driver
        },
        name=f"bank-etl-extract-db-{PROCESSING_DATE}",
        num_executors=2,
        executor_cores=2,
        executor_memory="4g",
        driver_memory="2g",
        py_files=f"{SPARK_JOBS_PATH}/common/*.py",
        verbose=False,
    )

    extraction_complete = EmptyOperator(
        task_id="extraction_complete",
        trigger_rule=TriggerRule.ALL_SUCCESS,
    )

    # ──────────────────────────────────────────
    # Task: Transform Data
    # ──────────────────────────────────────────

    transform = SparkSubmitOperator(
        task_id="transform_data",
        application=f"{SPARK_JOBS_PATH}/transform/clean_transactions.py",
        conn_id=SPARK_CONN_ID,
        application_args=[PROCESSING_DATE, BATCH_ID],
        conf=spark_common_conf,
        name=f"bank-etl-transform-{PROCESSING_DATE}",
        num_executors=8,                 # More executors for heavy transform
        executor_cores=4,
        executor_memory="8g",
        driver_memory="4g",
        py_files=f"{SPARK_JOBS_PATH}/common/*.py",
        verbose=False,
    )

    # ──────────────────────────────────────────
    # Task: Data Quality Checks
    # ──────────────────────────────────────────

    quality_checks = SparkSubmitOperator(
        task_id="data_quality_checks",
        application=f"{SPARK_JOBS_PATH}/quality/data_quality_checks.py",
        conn_id=SPARK_CONN_ID,
        application_args=[PROCESSING_DATE],
        conf=spark_common_conf,
        name=f"bank-etl-dq-{PROCESSING_DATE}",
        num_executors=4,
        executor_cores=2,
        executor_memory="4g",
        driver_memory="2g",
        py_files=f"{SPARK_JOBS_PATH}/common/*.py",
        verbose=False,
    )

    # ──────────────────────────────────────────
    # Task: Build Aggregations (Gold Layer)
    # ──────────────────────────────────────────

    aggregate = SparkSubmitOperator(
        task_id="build_aggregations",
        application=f"{SPARK_JOBS_PATH}/transform/aggregate_transactions.py",
        conn_id=SPARK_CONN_ID,
        application_args=[PROCESSING_DATE],
        conf=spark_common_conf,
        name=f"bank-etl-aggregate-{PROCESSING_DATE}",
        num_executors=6,
        executor_cores=4,
        executor_memory="8g",
        driver_memory="4g",
        py_files=f"{SPARK_JOBS_PATH}/common/*.py",
        verbose=False,
    )

    # ──────────────────────────────────────────
    # Task: Notifications
    # ──────────────────────────────────────────

    def _build_success_message(**context):
        ds = context["ds"]
        return (
            f":white_check_mark: *Bank ETL Pipeline Completed Successfully*\n"
            f"• Date: `{ds}`\n"
            f"• DAG Run: `{context['run_id']}`\n"
            f"• Duration: `{context['dag_run'].end_date - context['dag_run'].start_date}`\n"
        )

    notify_success = SlackWebhookOperator(
        task_id="notify_success",
        slack_webhook_conn_id=SLACK_CONN_ID,
        message=_build_success_message,
        trigger_rule=TriggerRule.ALL_SUCCESS,
    )

    notify_failure = SlackWebhookOperator(
        task_id="notify_failure",
        slack_webhook_conn_id=SLACK_CONN_ID,
        message=(
            ":red_circle: *Bank ETL Pipeline FAILED*\n"
            f"• Date: `{PROCESSING_DATE}`\n"
            "• Check Airflow UI for details\n"
            "• @oncall-data-eng"
        ),
        trigger_rule=TriggerRule.ONE_FAILED,
    )

    pipeline_end = EmptyOperator(
        task_id="pipeline_end",
        trigger_rule=TriggerRule.NONE_FAILED_MIN_ONE_SUCCESS,
    )

    # ──────────────────────────────────────────
    # Task Dependencies (the actual DAG)
    # ──────────────────────────────────────────

    # Source checks (parallel)
    [check_atm_files, check_pos_files] >> sources_ready

    # Extraction (parallel after sources ready)
    sources_ready >> [extract_csv, extract_json, extract_db] >> extraction_complete

    # Sequential processing pipeline
    extraction_complete >> transform >> quality_checks >> aggregate

    # Notifications (parallel at the end)
    aggregate >> notify_success >> pipeline_end
    aggregate >> notify_failure >> pipeline_end
```

### DAG Execution Flow

```mermaid
graph TD
    A1["check_atm_files<br/>(S3KeySensor)"] --> B["sources_ready"]
    A2["check_pos_files<br/>(S3KeySensor)"] --> B

    B --> C1["extract_csv_sources<br/>(SparkSubmit)"]
    B --> C2["extract_json_sources<br/>(SparkSubmit)"]
    B --> C3["extract_db_sources<br/>(SparkSubmit)"]

    C1 --> D["extraction_complete"]
    C2 --> D
    C3 --> D

    D --> E["transform_data<br/>(SparkSubmit)"]
    E --> F["data_quality_checks<br/>(SparkSubmit)"]
    F --> G["build_aggregations<br/>(SparkSubmit)"]

    G --> H1["notify_success<br/>(Slack)"]
    G --> H2["notify_failure<br/>(Slack)"]

    H1 --> I["pipeline_end"]
    H2 --> I

    style A1 fill:#f39c12,color:#000
    style A2 fill:#f39c12,color:#000
    style C1 fill:#e74c3c,color:#fff
    style C2 fill:#e74c3c,color:#fff
    style C3 fill:#e74c3c,color:#fff
    style E fill:#3498db,color:#fff
    style F fill:#2ecc71,color:#fff
    style G fill:#9b59b6,color:#fff
    style H1 fill:#27ae60,color:#fff
    style H2 fill:#e74c3c,color:#fff
```

---

## 🔧 Step 7: Idempotent Design

This is one of the most critical concepts in production data engineering. Here's how every component achieves idempotency:

```mermaid
graph LR
    subgraph "What Makes This Pipeline Idempotent?"
        A["Same Input +<br/>Same Date"] --> B["Same Output<br/>Every Time"]
    end

    subgraph "Techniques Used"
        C1["Partition Overwrite<br/>Write only today's partition"]
        C2["Deterministic Batch ID<br/>batch-YYYYMMDD-001"]
        C3["Dedup by transaction_id<br/>Window function"]
        C4["No auto-increment IDs<br/>Use natural keys"]
        C5["UTC timestamps<br/>No timezone ambiguity"]
    end

    B --> C1 & C2 & C3 & C4 & C5
```

### The Golden Rule of Idempotency

```python
# WRONG — append mode creates duplicates on re-run
df.write.mode("append").parquet(path)

# RIGHT — overwrite only today's partition
df.write.mode("overwrite").partitionBy("processing_date").parquet(path)

# EVEN BETTER — use insertInto with overwrite for Hive tables
spark.conf.set("spark.sql.sources.partitionOverwriteMode", "dynamic")
df.write.mode("overwrite").insertInto("database.table")
```

---

## 🔧 Step 8: Unit Tests

```python
# tests/test_transformations.py
"""
Unit tests for transformation functions.

These tests run without a cluster — using local Spark.
They're fast (seconds, not minutes) and catch 80% of bugs.

Testing strategy:
1. Test each transformation function in isolation
2. Use small, handcrafted DataFrames as input
3. Assert on exact output values
4. Test edge cases: nulls, empty strings, extreme values
"""

import pytest
from pyspark.sql import SparkSession
from pyspark.sql.types import StructType, StructField, StringType, DoubleType

# Import functions under test
import sys
sys.path.insert(0, 'spark_jobs/transform')
sys.path.insert(0, 'spark_jobs/common')


@pytest.fixture(scope="session")
def spark():
    """
    Create a SparkSession for testing.

    scope="session" means ONE SparkSession for ALL tests in this file.
    Creating SparkSession is expensive (~5 seconds), so we reuse it.
    """
    spark = (
        SparkSession.builder
        .master("local[2]")          # 2 threads, enough for tests
        .appName("bank-etl-tests")
        .config("spark.sql.shuffle.partitions", "2")   # Small for tests
        .config("spark.ui.enabled", "false")             # No UI needed
        .config("spark.sql.session.timeZone", "UTC")
        .getOrCreate()
    )
    yield spark
    spark.stop()


class TestCleanAmount:
    """Tests for the clean_amount transformation."""

    def test_normal_amount(self, spark):
        """Standard numeric amounts pass through correctly."""
        from clean_transactions import clean_amount

        df = spark.createDataFrame(
            [("1234.56",), ("0.01",), ("999999.99",)],
            ["amount"]
        )
        result = clean_amount(df, "amount")
        values = [row.amount for row in result.collect()]

        assert values == [1234.56, 0.01, 999999.99]

    def test_currency_symbols(self, spark):
        """Currency symbols are stripped correctly."""
        from clean_transactions import clean_amount

        df = spark.createDataFrame(
            [("$1,234.56",), ("€500.00",), ("£1,000.00",)],
            ["amount"]
        )
        result = clean_amount(df, "amount")
        values = [row.amount for row in result.collect()]

        assert values == [1234.56, 500.00, 1000.00]

    def test_null_values(self, spark):
        """Null, N/A, and empty strings become null."""
        from clean_transactions import clean_amount

        df = spark.createDataFrame(
            [(None,), ("N/A",), ("",), ("  ",), ("null",)],
            schema=StructType([StructField("amount", StringType())])
        )
        result = clean_amount(df, "amount")
        values = [row.amount for row in result.collect()]

        assert all(v is None for v in values)

    def test_negative_accounting_format(self, spark):
        """Accounting-style negatives (500.00) are converted."""
        from clean_transactions import clean_amount

        df = spark.createDataFrame(
            [("(500.00)",), ("(1234.56)",)],
            ["amount"]
        )
        result = clean_amount(df, "amount")
        values = [row.amount for row in result.collect()]

        assert values == [-500.00, -1234.56]


class TestDeduplication:
    """Tests for the deduplication logic."""

    def test_removes_exact_duplicates(self, spark):
        """Identical records are deduplicated to one."""
        from clean_transactions import deduplicate_transactions
        from pyspark.sql.functions import lit

        df = spark.createDataFrame(
            [
                ("txn-001", "ATM", 100.0, "2024-01-15 10:00:00"),
                ("txn-001", "ATM", 100.0, "2024-01-15 10:00:01"),  # Same txn, later processing
                ("txn-002", "POS", 200.0, "2024-01-15 11:00:00"),
            ],
            ["transaction_id", "source_system", "amount", "_processing_timestamp"]
        ).withColumn("_row_hash", lit("hash"))

        result = deduplicate_transactions(df)
        assert result.count() == 2  # txn-001 and txn-002

    def test_keeps_latest_record(self, spark):
        """When duplicated, the record with the latest processing time wins."""
        from clean_transactions import deduplicate_transactions
        from pyspark.sql.functions import lit, to_timestamp

        df = spark.createDataFrame(
            [
                ("txn-001", 100.0, "2024-01-15 10:00:00"),
                ("txn-001", 150.0, "2024-01-15 10:05:00"),  # Updated amount, later time
            ],
            ["transaction_id", "amount", "_processing_timestamp"]
        ).withColumn("_row_hash", lit("hash"))

        # Convert timestamp string to actual timestamp
        df = df.withColumn(
            "_processing_timestamp",
            to_timestamp("_processing_timestamp")
        )

        result = deduplicate_transactions(df)
        row = result.collect()[0]
        assert row.amount == 150.0  # Latest record wins


class TestDAGIntegrity:
    """
    Tests that validate the DAG itself — not the business logic.

    These catch deployment bugs like:
    - Import errors in DAG file
    - Circular dependencies
    - Missing connections
    """

    def test_dag_loads_without_errors(self):
        """The DAG file can be imported without errors."""
        from airflow.models import DagBag

        dag_bag = DagBag(dag_folder="dags/", include_examples=False)
        assert len(dag_bag.import_errors) == 0, f"DAG import errors: {dag_bag.import_errors}"

    def test_dag_has_expected_tasks(self):
        """The DAG contains all expected tasks."""
        from airflow.models import DagBag

        dag_bag = DagBag(dag_folder="dags/", include_examples=False)
        dag = dag_bag.get_dag("daily_bank_etl")

        expected_tasks = [
            "check_atm_files", "check_pos_files", "sources_ready",
            "extract_csv_sources", "extract_json_sources", "extract_db_sources",
            "extraction_complete", "transform_data", "data_quality_checks",
            "build_aggregations", "notify_success", "notify_failure", "pipeline_end",
        ]

        actual_tasks = [t.task_id for t in dag.tasks]
        for task in expected_tasks:
            assert task in actual_tasks, f"Missing task: {task}"

    def test_no_circular_dependencies(self):
        """The DAG has no cycles."""
        from airflow.models import DagBag

        dag_bag = DagBag(dag_folder="dags/", include_examples=False)
        dag = dag_bag.get_dag("daily_bank_etl")

        # Airflow validates this during load, but let's be explicit
        assert dag is not None
        # If there were cycles, the DAG wouldn't load at all
```

---

## ⚠️ Failure Scenarios & Recovery

### What Goes Wrong in Production

```mermaid
graph TD
    subgraph "Common Failures"
        F1["Source files arrive late"]
        F2["Schema drift in source"]
        F3["Spark OOM during transform"]
        F4["Data quality check fails"]
        F5["S3 throttling"]
        F6["Spark cluster down"]
    end

    subgraph "Recovery Actions"
        R1["S3KeySensor waits<br/>with timeout + alert"]
        R2["PERMISSIVE mode captures<br/>corrupt records, alerts team"]
        R3["Tune executor memory,<br/>add more partitions"]
        R4["Pipeline stops,<br/>alerts sent, manual review"]
        R5["Exponential backoff<br/>in retries"]
        R6["Retry with backoff,<br/>fail after 3 attempts"]
    end

    F1 --> R1
    F2 --> R2
    F3 --> R3
    F4 --> R4
    F5 --> R5
    F6 --> R6
```

| Failure | Detection | Impact | Recovery |
|---------|-----------|--------|----------|
| Source files missing | S3KeySensor timeout | Pipeline delayed | Alert on-call, wait or skip source |
| Schema drift | PERMISSIVE mode, DQ checks | Bad data in Silver layer | Quarantine bad records, fix schema |
| Spark OOM | Task failure in Airflow | Transform step fails | Increase memory, add partitions, retry |
| DQ check fails | `fail_on_critical()` | Pipeline halts before Gold | Review failures, fix data, re-run |
| Duplicate delivery | Dedup logic in transform | None — handled automatically | No action needed |
| Network timeout (S3) | Spark task failure | Intermittent task failure | Auto-retry (configured in DAG) |

### Handling Backfills

```python
# When you need to reprocess historical data:
# Option 1: Use Airflow CLI
# airflow dags backfill daily_bank_etl --start-date 2024-01-01 --end-date 2024-01-31

# Option 2: Trigger specific date via API
# curl -X POST "http://airflow:8080/api/v1/dags/daily_bank_etl/dagRuns" \
#   -H "Content-Type: application/json" \
#   -d '{"logical_date": "2024-01-15T00:00:00Z"}'

# Because our pipeline is idempotent (partition overwrite),
# backfills are safe — they just re-process and overwrite.
```

---

## 📊 Monitoring & Observability

### Key Metrics to Track

```mermaid
graph LR
    subgraph "Pipeline Metrics"
        M1["Pipeline Duration<br/>Target: < 2 hours"]
        M2["Record Count<br/>Alert if < 100K"]
        M3["DQ Pass Rate<br/>Target: 100% critical"]
        M4["Error Rate<br/>Alert if > 1%"]
    end

    subgraph "Spark Metrics"
        S1["Executor Memory Usage<br/>Alert if > 80%"]
        S2["Shuffle Spill<br/>Alert if > 0"]
        S3["Task Duration<br/>P99 < 5 min"]
        S4["Failed Tasks<br/>Alert if > 0"]
    end

    subgraph "Infrastructure"
        I1["S3 API Errors"]
        I2["Cluster CPU Usage"]
        I3["Airflow Worker Health"]
        I4["Metastore Latency"]
    end
```

### Custom Airflow Callbacks

```python
# dags/utils/alerting.py
"""
Production alerting integration for the bank ETL pipeline.
"""

from airflow.providers.slack.hooks.slack_webhook import SlackWebhookHook
import json


def on_failure_callback(context):
    """Called when any task fails."""
    task_instance = context['task_instance']
    dag_id = context['dag'].dag_id
    task_id = task_instance.task_id
    execution_date = context['ds']
    log_url = task_instance.log_url

    slack_hook = SlackWebhookHook(slack_webhook_conn_id='slack_data_alerts')
    slack_hook.send(
        text=(
            f":rotating_light: *Task Failed*\n"
            f"• DAG: `{dag_id}`\n"
            f"• Task: `{task_id}`\n"
            f"• Date: `{execution_date}`\n"
            f"• Logs: {log_url}\n"
            f"• Action: @data-oncall please investigate"
        )
    )


def on_sla_miss_callback(dag, task_list, blocking_task_list, slas, blocking_tis):
    """Called when a task misses its SLA."""
    slack_hook = SlackWebhookHook(slack_webhook_conn_id='slack_data_alerts')
    task_names = [t.task_id for t in task_list]
    slack_hook.send(
        text=(
            f":warning: *SLA Miss*\n"
            f"• DAG: `{dag.dag_id}`\n"
            f"• Tasks: `{', '.join(task_names)}`\n"
            f"• This pipeline should complete within 4 hours\n"
            f"• Action: Check if data volumes are abnormally high"
        )
    )
```

---

## 💰 Cost Optimization

| Technique | Savings | Implementation |
|-----------|---------|----------------|
| **Right-size Spark executors** | 20-40% | Profile actual memory/CPU usage, don't over-provision |
| **Use Spot/Preemptible instances** | 60-80% | For ETL tasks that can retry on interruption |
| **Partition pruning** | 50-90% query cost | Always filter on partition columns |
| **Parquet + Snappy compression** | 60-80% storage | Columnar format with fast compression |
| **Coalesce before write** | 30-50% S3 costs | Fewer, larger files = fewer API calls |
| **Schedule during off-peak** | 10-30% | Run at 2 AM when compute is cheaper |
| **Cache reference data** | 10-20% | Broadcast exchange rates, don't re-read per task |

### File Size Optimization

```python
# WRONG: Thousands of tiny files (expensive S3 reads, slow queries)
df.write.partitionBy("date", "source", "type").parquet(path)
# Creates: 365 days × 6 sources × 5 types = 10,950 partitions/year!

# RIGHT: Coalesce to target file size (128-256MB per file)
df.coalesce(target_partitions).write.partitionBy("date").parquet(path)

# BEST: Calculate target partitions dynamically
data_size_bytes = spark._jvm.org.apache.hadoop.fs.FileSystem.get(
    spark._jsc.hadoopConfiguration()
).getContentSummary(spark._jvm.org.apache.hadoop.fs.Path(path)).getLength()

target_file_size = 256 * 1024 * 1024  # 256 MB
target_partitions = max(1, data_size_bytes // target_file_size)
df.coalesce(target_partitions).write.parquet(path)
```

---

## 🎤 Interview Relevance

### Questions This Project Prepares You For

| Question | What to Demonstrate |
|----------|-------------------|
| "Design a daily ETL pipeline" | This exact project — end to end |
| "How do you handle data quality?" | The DQ framework with severity levels |
| "How do you make pipelines idempotent?" | Partition overwrite + deterministic batch IDs |
| "How do you handle schema drift?" | PERMISSIVE mode + quarantine + alerting |
| "How do you monitor data pipelines?" | Custom callbacks, DQ metrics, Spark UI |
| "How do you handle late-arriving data?" | Sensors with timeout + alerting |
| "How would you scale this pipeline?" | More executors, better partitioning, AQE |
| "What's your testing strategy?" | Unit tests with local Spark, DAG integrity tests |

### How to Talk About This in Interviews

> "I built a daily ETL pipeline processing 5 million bank transactions across 6 source systems. The pipeline uses a medallion architecture — Bronze for raw ingestion, Silver for cleaned canonical data, and Gold for pre-aggregated business tables. Each Spark job is idempotent through partition overwrite, and we catch data quality issues before they reach the Gold layer using a custom DQ framework with critical vs warning severity levels. The Airflow DAG runs at 2 AM UTC, extracts in parallel from all sources, and completes within 2 hours with SLA monitoring and Slack alerting."

---

## 🏃 Running This Project Locally

### Prerequisites

```bash
# Install Docker and Docker Compose
docker --version   # 20.x+
docker-compose --version   # 1.29+

# Clone this project
git clone https://github.com/your-org/bank-etl-pipeline.git
cd bank-etl-pipeline
```

### Docker Compose Setup

```yaml
# docker/docker-compose.yml
version: '3.8'

services:
  # Airflow Webserver
  airflow-webserver:
    build:
      context: .
      dockerfile: Dockerfile.airflow
    ports:
      - "8080:8080"
    environment:
      - AIRFLOW__CORE__EXECUTOR=LocalExecutor
      - AIRFLOW__CORE__SQL_ALCHEMY_CONN=postgresql+psycopg2://airflow:airflow@postgres/airflow
      - AIRFLOW__CORE__DAGS_FOLDER=/opt/airflow/dags
    volumes:
      - ../dags:/opt/airflow/dags
      - ../spark_jobs:/opt/spark-jobs
    depends_on:
      - postgres
    command: webserver

  # Airflow Scheduler
  airflow-scheduler:
    build:
      context: .
      dockerfile: Dockerfile.airflow
    environment:
      - AIRFLOW__CORE__EXECUTOR=LocalExecutor
      - AIRFLOW__CORE__SQL_ALCHEMY_CONN=postgresql+psycopg2://airflow:airflow@postgres/airflow
    volumes:
      - ../dags:/opt/airflow/dags
      - ../spark_jobs:/opt/spark-jobs
    depends_on:
      - postgres
    command: scheduler

  # Spark Master
  spark-master:
    image: bitnami/spark:3.5
    ports:
      - "7077:7077"
      - "4040:4040"
    environment:
      - SPARK_MODE=master

  # Spark Worker
  spark-worker:
    image: bitnami/spark:3.5
    environment:
      - SPARK_MODE=worker
      - SPARK_MASTER_URL=spark://spark-master:7077
      - SPARK_WORKER_MEMORY=4G
      - SPARK_WORKER_CORES=2
    depends_on:
      - spark-master

  # PostgreSQL (Airflow metadata)
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_USER=airflow
      - POSTGRES_PASSWORD=airflow
      - POSTGRES_DB=airflow
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # MinIO (S3 replacement for local dev)
  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  minio_data:
```

### Running the Pipeline

```bash
# Start all services
docker-compose -f docker/docker-compose.yml up -d

# Generate sample data
python scripts/generate_sample_data.py --date 2024-01-15

# Access Airflow UI
open http://localhost:8080   # admin / admin

# Trigger the DAG
airflow dags trigger daily_bank_etl --conf '{"date": "2024-01-15"}'

# Check Spark UI
open http://localhost:4040

# View results in MinIO
open http://localhost:9001   # minioadmin / minioadmin
```

---

## 📝 Key Takeaways

1. **Medallion Architecture** (Bronze → Silver → Gold) gives you audit trails, reprocessability, and clean interfaces between layers
2. **Idempotency** is non-negotiable — use partition overwrite, deterministic IDs, and deduplication
3. **Schema enforcement** catches 80% of data issues before they become business problems
4. **Data quality checks** are a separate pipeline step, not sprinkled throughout code
5. **Each Spark job is a separate Airflow task** for granular retry, monitoring, and resource allocation
6. **Test transformations with local Spark** — fast feedback, catches most bugs
7. **Monitor everything** — pipeline duration, record counts, DQ pass rates, Spark metrics

---

**[← Back to Projects](../README.md#-projects)**
