[🏠 Home](../README.md) | [⬅️ Roadmap](./00-dsa-roadmap.md) | [➡️ Arrays & Hashing](./02-arrays-hashing/00-overview.md)

# ⏱️ Time & Space Complexity

> Understanding Big O notation for interview success

---

## 📊 Big O Complexity Chart

```
        Horrible  Bad    Fair   Good  Excellent
          O(n!)  O(2ⁿ)  O(n²)  O(n log n)  O(n)  O(log n)  O(1)
           |      |      |        |         |       |       |
Time  ███████████████████████████████████████████████████████▓
           ← Slower                              Faster →
```

---

## 🎯 Common Complexities

### Time Complexity (Best to Worst)

| Notation | Name | Example | 1000 elements |
|----------|------|---------|---------------|
| O(1) | Constant | Array access, HashMap get | 1 op |
| O(log n) | Logarithmic | Binary search | 10 ops |
| O(n) | Linear | Loop through array | 1,000 ops |
| O(n log n) | Linearithmic | Merge sort, Heap sort | 10,000 ops |
| O(n²) | Quadratic | Nested loops, Bubble sort | 1,000,000 ops |
| O(2ⁿ) | Exponential | Recursive Fibonacci | 10^301 ops |
| O(n!) | Factorial | Permutations | ∞ |

### Visual Growth

```
n=10:
O(1)       : *
O(log n)   : ***
O(n)       : **********
O(n log n) : *********************************
O(n²)      : ****************************************************************************************************
```

---

## 🧮 How to Calculate

### Rule 1: Drop Constants
```java
// O(2n) → O(n)
for (int i = 0; i < n; i++) { }
for (int i = 0; i < n; i++) { }
```

### Rule 2: Drop Non-Dominant Terms
```java
// O(n² + n) → O(n²)
for (int i = 0; i < n; i++) {
    for (int j = 0; j < n; j++) { }
}
for (int k = 0; k < n; k++) { }
```

### Rule 3: Different Inputs = Different Variables
```java
// O(a * b), NOT O(n²)
void process(int[] arr1, int[] arr2) {
    for (int i : arr1) {        // O(a)
        for (int j : arr2) { }  // O(b)
    }
}
```

---

## 📝 Common Patterns

### O(1) - Constant
```java
int getFirst(int[] arr) {
    return arr[0];  // Direct access
}

map.get(key);      // HashMap lookup
stack.push(x);     // Stack push
```

### O(log n) - Logarithmic
```java
// Binary Search - halves search space each iteration
int binarySearch(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}
```

### O(n) - Linear
```java
// Single loop through n elements
int sum(int[] arr) {
    int total = 0;
    for (int num : arr) {  // n iterations
        total += num;
    }
    return total;
}
```

### O(n log n) - Linearithmic
```java
// Sorting algorithms (Merge Sort, Heap Sort)
Arrays.sort(arr);  // Java uses Dual-Pivot Quicksort

// Divide and conquer
void mergeSort(int[] arr, int left, int right) {
    if (left < right) {
        int mid = (left + right) / 2;
        mergeSort(arr, left, mid);      // T(n/2)
        mergeSort(arr, mid + 1, right); // T(n/2)
        merge(arr, left, mid, right);   // O(n)
    }
}
// T(n) = 2*T(n/2) + O(n) = O(n log n)
```

### O(n²) - Quadratic
```java
// Nested loops
void printPairs(int[] arr) {
    for (int i = 0; i < arr.length; i++) {
        for (int j = 0; j < arr.length; j++) {
            System.out.println(arr[i] + ", " + arr[j]);
        }
    }
}
```

### O(2ⁿ) - Exponential
```java
// Recursive without memoization
int fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);  // Two recursive calls
}
```

---

## 💾 Space Complexity

### What Counts as Space?
1. Variables
2. Data structures (arrays, maps, stacks)
3. Function call stack (recursion)

### Examples

```java
// O(1) Space - In-place
void reverse(int[] arr) {
    int left = 0, right = arr.length - 1;
    while (left < right) {
        int temp = arr[left];
        arr[left++] = arr[right];
        arr[right--] = temp;
    }
}

// O(n) Space - Linear
int[] copy(int[] arr) {
    int[] result = new int[arr.length];  // n extra space
    for (int i = 0; i < arr.length; i++) {
        result[i] = arr[i];
    }
    return result;
}

// O(n) Space - Recursion Stack
void printReverse(int[] arr, int i) {
    if (i == arr.length) return;
    printReverse(arr, i + 1);  // n recursive calls
    System.out.println(arr[i]);
}
```

---

## 🎯 Interview Quick Reference

### Sorting Algorithms

| Algorithm | Time (Best) | Time (Avg) | Time (Worst) | Space | Stable |
|-----------|-------------|------------|--------------|-------|--------|
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) | ✅ |
| Selection Sort | O(n²) | O(n²) | O(n²) | O(1) | ❌ |
| Insertion Sort | O(n) | O(n²) | O(n²) | O(1) | ✅ |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | ✅ |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) | ❌ |
| Heap Sort | O(n log n) | O(n log n) | O(n log n) | O(1) | ❌ |

### Data Structure Operations

| Structure | Access | Search | Insert | Delete |
|-----------|--------|--------|--------|--------|
| Array | O(1) | O(n) | O(n) | O(n) |
| Linked List | O(n) | O(n) | O(1) | O(1) |
| Stack | O(n) | O(n) | O(1) | O(1) |
| Queue | O(n) | O(n) | O(1) | O(1) |
| HashMap | N/A | O(1) | O(1) | O(1) |
| BST | O(log n) | O(log n) | O(log n) | O(log n) |
| Heap | O(1)* | O(n) | O(log n) | O(log n) |

*Only for min/max element

---

## 🧠 Memory Visualization

### Stack vs Heap Memory

```
┌─────────────────────────────────────┐
│           STACK MEMORY              │  ← Function calls, local variables
│  ┌─────────────────────────────┐    │
│  │ main()                      │    │
│  │   int x = 5                 │    │
│  ├─────────────────────────────┤    │
│  │ helper()                    │    │
│  │   int y = 10                │    │
│  └─────────────────────────────┘    │
├─────────────────────────────────────┤
│           HEAP MEMORY               │  ← Objects, arrays
│  ┌─────────────────────────────┐    │
│  │ int[] arr = [1, 2, 3, 4, 5] │    │
│  │ HashMap<K,V> map            │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

---

## 📝 Practice Problems

| Problem | Analyze Time | Analyze Space |
|---------|--------------|---------------|
| Two Sum (HashMap) | O(n) | O(n) |
| Two Sum (Brute Force) | O(n²) | O(1) |
| Binary Search | O(log n) | O(1) |
| Merge Sort | O(n log n) | O(n) |
| DFS on Tree | O(n) | O(h) |
| BFS on Graph | O(V + E) | O(V) |

---

*Next: [Arrays & Hashing →](./02-arrays-hashing/00-overview.md)*
