[🏠 Home](../../README.md) | [⬅️ Linked Lists](../06-linked-lists/00-overview.md) | [➡️ Trees](../08-trees/00-overview.md)

# 📚 Stacks & Queues

> LIFO and FIFO data structures for order-dependent problems

---

## 🎯 When to Use

### Stack (LIFO)
| Clue | Pattern |
|------|---------|
| "Next greater/smaller" | Monotonic Stack |
| "Matching parentheses" | Classic Stack |
| "Undo operations" | Stack |
| "Expression evaluation" | Stack |
| "Backtracking" | Implicit Stack |

### Queue (FIFO)
| Clue | Pattern |
|------|---------|
| "Level order traversal" | BFS Queue |
| "Sliding window max" | Monotonic Deque |
| "Process in order" | Queue |

---

## 🧠 WHY Stacks & Queues Are Powerful: Developer's Guide

> **🎯 For Beginners:** Understanding LIFO vs FIFO unlocks many "hard" problems!

### The Core Insight: Order of Processing

```
STACK (LIFO - Last In, First Out):
  
  Push: 1, 2, 3
  Stack: [1, 2, 3]  ← Top
  
  Pop: 3, 2, 1  (reverse order!)
  
  Use when: Need to process MOST RECENT first
  Real life: Ctrl+Z (undo), browser back button

QUEUE (FIFO - First In, First Out):
  
  Enqueue: 1, 2, 3
  Queue: [1, 2, 3]
         ↑ Front
         
  Dequeue: 1, 2, 3  (same order!)
  
  Use when: Need to process in ORDER
  Real life: Print queue, BFS traversal
```

### Why Monotonic Stack is Magical

```
Problem: "Next Greater Element"
  For each element, find the next larger one

❌ Brute Force O(n²):
   For each i, scan all elements to the right

✅ Monotonic Stack O(n):
   
   nums = [2, 1, 2, 4, 3]
   
   Key Insight: Keep stack DECREASING
   When we find something bigger, it's the answer
   for everything smaller in the stack!
   
   Process 4:
     Stack has [2, 1, 2]
     4 > 2 → pop 2, answer[2] = 4
     4 > 1 → pop 1, answer[1] = 4  
     4 > 2 → pop 2, answer[0] = 4
     
   One pass handles multiple elements!
```

### When Stack vs Queue?

```
Ask yourself: What order do I need?

STACK situations:
  ├── Matching parentheses (most recent open)
  ├── Next greater/smaller (waiting for answer)
  ├── Expression evaluation (operators wait)
  └── Recursion simulation (call stack)

QUEUE situations:
  ├── BFS / Level order (process layer by layer)
  ├── Sliding window max (with Deque)
  └── Process tasks in order
```

### The Deque Secret: Best of Both Worlds

```
Deque = Double-Ended Queue

Can add/remove from BOTH ends in O(1)!

┌─────────────────────────────┐
│  addFirst  ←  [A B C D]  ← addLast
│ removeFirst →           → removeLast
└─────────────────────────────┘

Perfect for: Sliding Window Maximum
  - Add new elements at back
  - Remove old elements from front
  - Keep it monotonic by removing smaller from back
```

### Thought Process Template

```
🧠 "Should I use Stack or Queue?"

1. Need to match something recently seen?
   → Stack (parentheses, tags)

2. Need NEXT greater/smaller element?
   → Monotonic Stack

3. Level-by-level or shortest path?
   → Queue (BFS)

4. Need max/min in sliding window?
   → Monotonic Deque
```

---

## 🔧 Core Techniques

### 1. Monotonic Stack

Maintain a stack where elements are always in increasing or decreasing order.

**Next Greater Element Template**:
```java
public int[] nextGreaterElement(int[] nums) {
    int n = nums.length;
    int[] result = new int[n];
    Arrays.fill(result, -1);
    
    Stack<Integer> stack = new Stack<>();  // Store indices
    
    for (int i = 0; i < n; i++) {
        // Pop smaller elements - nums[i] is their next greater
        while (!stack.isEmpty() && nums[stack.peek()] < nums[i]) {
            result[stack.pop()] = nums[i];
        }
        stack.push(i);
    }
    return result;
}
```

**Visualization**:
```
nums = [2, 1, 2, 4, 3]
result = [-1, -1, -1, -1, -1]

i=0: stack=[0]      (push 2)
i=1: stack=[0,1]    (push 1)
i=2: 2 > nums[1]=1  → result[1]=2, stack=[0,2]
i=3: 4 > nums[2]=2  → result[2]=4
     4 > nums[0]=2  → result[0]=4, stack=[3]
i=4: stack=[3,4]    (push 3)

result = [4, 2, 4, -1, -1]
```

---

### 2. Valid Parentheses Pattern

```java
public boolean isValid(String s) {
    Stack<Character> stack = new Stack<>();
    Map<Character, Character> pairs = Map.of(')', '(', ']', '[', '}', '{');
    
    for (char c : s.toCharArray()) {
        if (pairs.containsKey(c)) {
            // Closing bracket
            if (stack.isEmpty() || stack.pop() != pairs.get(c)) {
                return false;
            }
        } else {
            // Opening bracket
            stack.push(c);
        }
    }
    return stack.isEmpty();
}
```

---

### 3. Min Stack

```java
class MinStack {
    private Stack<Integer> stack;
    private Stack<Integer> minStack;
    
    public MinStack() {
        stack = new Stack<>();
        minStack = new Stack<>();
    }
    
    public void push(int val) {
        stack.push(val);
        int min = minStack.isEmpty() ? val : Math.min(val, minStack.peek());
        minStack.push(min);
    }
    
    public void pop() {
        stack.pop();
        minStack.pop();
    }
    
    public int top() {
        return stack.peek();
    }
    
    public int getMin() {
        return minStack.peek();
    }
}
```

---

## 💻 Core Problems

### Problem 1: Daily Temperatures

```java
// Days until warmer temperature
public int[] dailyTemperatures(int[] temperatures) {
    int n = temperatures.length;
    int[] result = new int[n];
    Stack<Integer> stack = new Stack<>();  // Decreasing stack
    
    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && temperatures[i] > temperatures[stack.peek()]) {
            int prevIndex = stack.pop();
            result[prevIndex] = i - prevIndex;
        }
        stack.push(i);
    }
    return result;
}
```

---

### Problem 2: Largest Rectangle in Histogram

```java
public int largestRectangleArea(int[] heights) {
    Stack<Integer> stack = new Stack<>();
    int maxArea = 0;
    
    for (int i = 0; i <= heights.length; i++) {
        int h = (i == heights.length) ? 0 : heights[i];
        
        while (!stack.isEmpty() && h < heights[stack.peek()]) {
            int height = heights[stack.pop()];
            int width = stack.isEmpty() ? i : i - stack.peek() - 1;
            maxArea = Math.max(maxArea, height * width);
        }
        stack.push(i);
    }
    return maxArea;
}
```

**Key Insight**: For each bar, find how far left and right it extends.

---

### Problem 3: Evaluate Reverse Polish Notation

```java
public int evalRPN(String[] tokens) {
    Stack<Integer> stack = new Stack<>();
    Set<String> ops = Set.of("+", "-", "*", "/");
    
    for (String token : tokens) {
        if (ops.contains(token)) {
            int b = stack.pop();
            int a = stack.pop();
            switch (token) {
                case "+": stack.push(a + b); break;
                case "-": stack.push(a - b); break;
                case "*": stack.push(a * b); break;
                case "/": stack.push(a / b); break;
            }
        } else {
            stack.push(Integer.parseInt(token));
        }
    }
    return stack.pop();
}
```

---

### Problem 4: Sliding Window Maximum (Monotonic Deque)

```java
public int[] maxSlidingWindow(int[] nums, int k) {
    Deque<Integer> deque = new ArrayDeque<>();  // Store indices
    int[] result = new int[nums.length - k + 1];
    
    for (int i = 0; i < nums.length; i++) {
        // Remove indices outside window
        if (!deque.isEmpty() && deque.peekFirst() <= i - k) {
            deque.pollFirst();
        }
        
        // Remove smaller elements (they can never be max)
        while (!deque.isEmpty() && nums[deque.peekLast()] < nums[i]) {
            deque.pollLast();
        }
        
        deque.offerLast(i);
        
        // Start recording results when window is full
        if (i >= k - 1) {
            result[i - k + 1] = nums[deque.peekFirst()];
        }
    }
    return result;
}
```

---

## 🧠 Monotonic Stack Patterns

```
┌─────────────────────────────────────────────────────┐
│              MONOTONIC STACK USAGE                   │
├─────────────────────────────────────────────────────┤
│ Next Greater Element:                                │
│   → Decreasing stack (pop when curr > top)          │
│                                                      │
│ Next Smaller Element:                                │
│   → Increasing stack (pop when curr < top)          │
│                                                      │
│ Previous Greater Element:                            │
│   → Iterate right to left, decreasing stack         │
│                                                      │
│ Previous Smaller Element:                            │
│   → Iterate right to left, increasing stack         │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Complexity Summary

| Problem | Time | Space |
|---------|------|-------|
| Valid Parentheses | O(n) | O(n) |
| Min Stack | O(1) all ops | O(n) |
| Daily Temperatures | O(n) | O(n) |
| Largest Rectangle | O(n) | O(n) |
| Sliding Window Max | O(n) | O(k) |

---

## 📝 Practice Problems

| # | Problem | Difficulty | Link | Key Insight |
|---|---------|------------|------|-------------|
| 1 | Valid Parentheses | 🟢 Easy | [LeetCode](https://leetcode.com/problems/valid-parentheses/) | Match pairs |
| 2 | Min Stack | 🟡 Medium | [LeetCode](https://leetcode.com/problems/min-stack/) | Parallel min stack |
| 3 | Evaluate RPN | 🟡 Medium | [LeetCode](https://leetcode.com/problems/evaluate-reverse-polish-notation/) | Operator stack |
| 4 | Daily Temperatures | 🟡 Medium | [LeetCode](https://leetcode.com/problems/daily-temperatures/) | Monotonic decreasing |
| 5 | Car Fleet | 🟡 Medium | [LeetCode](https://leetcode.com/problems/car-fleet/) | Stack + collision |
| 6 | Largest Rectangle | 🔴 Hard | [LeetCode](https://leetcode.com/problems/largest-rectangle-in-histogram/) | Monotonic + area |

---

*Next: [Trees →](../08-trees/00-overview.md)*
