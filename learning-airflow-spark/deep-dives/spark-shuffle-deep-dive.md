# 🔀 Spark Shuffle Deep Dive

> **An internal look at how Spark redistributes data across a cluster.**

---

## 1. What is a Shuffle?

A shuffle is the process by which Spark redistributes data across the cluster, grouping data together that shares a common characteristic (like a key). It is the boundary between Stages in an execution plan.

### When does a shuffle happen?
Whenever an operation requires data from multiple partitions to be combined to compute the result:
- **Grouping:** `groupByKey()`, `reduceByKey()`, `aggregateByKey()`
- **Joins:** `join()`, `leftOuterJoin()` (unless broadcasted)
- **Aggregation:** `distinct()`, `countByKey()`
- **Repartitioning:** `repartition()`, `coalesce()` (when increasing partitions)
- **Sorting:** `sortByKey()`, `orderBy()`

---

## 2. Why are Shuffles Expensive?

Shuffles are historically the biggest bottleneck in Spark applications. They involve:
1. **Disk I/O:** Mappers write data to local disk. Reducers read from local or remote disks.
2. **Network I/O:** Reducers must fetch data across the network from mappers on other nodes.
3. **CPU Overhead:** Data must be serialized, hashed, sorted, and deserialized.
4. **Memory Pressure:** Spark must maintain buffers for sorting and aggregating.

---

## 3. The Shuffle Architecture

Spark uses the **SortShuffleManager** (default since Spark 1.2, replacing HashShuffleManager).

### The Map Phase (Shuffle Write)
1. A **ShuffleMapTask** runs on an executor and processes a partition.
2. It hashes the keys of the output records to determine which reducer partition they belong to.
3. It inserts records into an in-memory buffer (`ExternalSorter`).
4. If the buffer fills up, it **spills** to disk, sorting the data by partition ID (and optionally by key).
5. At the end of the task, all spilled files and the remaining buffer are merged into a **single data file** on the executor's local disk.
6. An **index file** is also created, storing the offsets of each partition within the data file.

### The Reduce Phase (Shuffle Read)
1. A **ShuffleBlockFetcherIterator** running in the reduce task queries the driver (MapOutputTracker) to find out where its blocks are located.
2. It fetches blocks from the local disk and from remote executors across the network.
3. It merges the blocks together (often using a priority queue/min-heap) and performs the final aggregation or join.

---

## 4. Shuffle File Formats

- **Data File:** Contains the actual serialized records, ordered by partition ID.
- **Index File:** A small file telling the reducer exactly where to seek in the data file to find its specific partition block.

**Why one file?**
Older Spark versions created a separate file for every (mapper * reducer) combination. If you had 1000 mappers and 1000 reducers, that's 1,000,000 open files per executor, causing massive disk seek thrashing and inode exhaustion. The SortShuffleManager solves this by consolidating to 1 data file and 1 index file per mapper task.

---

## 5. The External Shuffle Service

When an executor fetches shuffle data from another node, it usually talks to the executor process on that node.

**The Problem:** With dynamic allocation, executors scale down when idle. If an executor dies or is scaled down, its local shuffle files are lost! Subsequent stages that need that shuffle data will fail, forcing the driver to recompute the entire previous stage.

**The Solution:** The **External Shuffle Service**.
- It is a long-running NodeManager service (on YARN/K8s) that sits alongside the executors.
- Executors register their local shuffle files with this service.
- Other executors fetch shuffle data from the service, not the executor.
- **Benefit:** Executors can be safely terminated without losing their shuffle data, enabling true dynamic allocation.

---

## 6. Push-Based Shuffle (Spark 3.2+)

Developed by LinkedIn and open-sourced in Spark 3.2 (Magnet).

**The Problem with Pull-Based (Default):**
In large clusters, a single reducer might need to fetch 100,000 tiny blocks from 100,000 mappers. This causes massive network connection overhead and random disk I/O on the sender side.

**The Push-Based Solution:**
1. Mappers don't just wait for reducers to pull data. They actively **push** their shuffle blocks to dedicated "Shuffle Servers".
2. The Shuffle Server merges blocks destined for the same reducer into a single contiguous file.
3. The reducer then pulls one large, contiguous file instead of 100,000 tiny ones.
- **Benefit:** Converts random disk reads into sequential disk reads. Massively improves performance and stability at a very large scale.

---

## 7. Diagnosing Shuffle Problems

### Symptom: OOM during Shuffle Read
- **Cause:** Reducer is receiving too much data for a single key (Data Skew), or the `spark.sql.shuffle.partitions` (default 200) is too low for the data volume.
- **Fix:** Salting for skew, or increase partitions.

### Symptom: Disk Spill during Shuffle Write
- Check the Spark UI -> Stage Details -> "Shuffle Spill (Disk)".
- **Cause:** The `ExternalSorter` memory buffer filled up.
- **Fix:** Increase `spark.executor.memory`, or specifically `spark.memory.fraction` to give execution more room.

### Symptom: "FetchFailedException"
- **Cause:** A reducer tried to fetch a block from an executor that is dead, unresponsive, or experiencing heavy GC pauses.
- **Fix:** Tune GC, increase `spark.network.timeout` (default 120s), or enable External Shuffle Service.

---

## 8. Tuning the Shuffle

1. **`spark.sql.shuffle.partitions`:** The most critical setting. Default is 200. Target ~128MB to 200MB per partition.
2. **`spark.shuffle.file.buffer`:** Default 32k. Increase to 1MB or 2MB to reduce disk seeks during shuffle write.
3. **`spark.reducer.maxSizeInFlight`:** Default 48MB. Increase to 96MB if you have high network bandwidth and plenty of executor memory, allowing faster parallel fetches.
4. **`spark.shuffle.compress` & `spark.shuffle.spill.compress`:** Default true (LZ4). Ensure fast compression codecs (LZ4 or Snappy) are used to trade CPU for reduced disk/network I/O.

---

**[← Back to Deep Dives](../README.md#-deep-dives)**
