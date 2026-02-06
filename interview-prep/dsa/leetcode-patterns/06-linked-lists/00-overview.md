[🏠 Home](../../README.md) | [⬅️ Binary Search](../05-binary-search/00-overview.md) | [➡️ Stacks](../07-stacks-queues/00-overview.md)

# 🔗 Linked List Patterns

> Pointer manipulation and in-place operations

---

## 🎯 When to Use

| Clue | Pattern |
|------|---------|
| "Find middle of list" | Fast & Slow pointers |
| "Detect cycle" | Fast & Slow pointers |
| "Reverse a list" | In-place reversal |
| "Merge sorted lists" | Two-pointer merge |
| "Kth from end" | Two pointers with gap |

---

## 🧠 WHY Linked Lists Matter: Key Insights for Developers

> **🎯 For Beginners:** Linked Lists test your pointer manipulation skills - master these and interviews become easier!

### The Core Advantage: O(1) Insert/Delete

```
ArrayList (Array-backed):
  Insert at middle: [1, 2, 3, 4, 5]
                       ↓ Insert 9
                    [1, 2, 9, 3, 4, 5]
  
  Must shift ALL elements after insert point = O(n)

LinkedList:
  Insert at middle: 1 → 2 → 3 → 4 → 5
                         ↓ Insert 9
                    1 → 2 → 9 → 3 → 4 → 5
  
  Just rewire 2 pointers = O(1) *

  * Finding the position is O(n), but insertion itself is O(1)
```

### Why "Dummy Node" is Your Best Friend

```
❌ Without Dummy Node (Edge case nightmare):
   if (head == null) return newNode;
   if (position == 0) { newNode.next = head; return newNode; }
   // Different logic for head vs middle...

✅ With Dummy Node (Clean and uniform):
   ListNode dummy = new ListNode(0);
   dummy.next = head;
   // Now treat ALL positions the same way!
   return dummy.next;

The dummy eliminates special cases for head operations.
```

### Fast & Slow Pointer: The Magic Ratio

```
Why does Fast/Slow find the middle?

Fast moves 2x speed:
  When fast reaches end (traveled 2n)
  Slow has traveled n (half)
  
  slow: 1 step/iteration
  fast: 2 steps/iteration
  
  After k iterations:
    slow position: k
    fast position: 2k
    
  When 2k = n (end): k = n/2 (middle!)
```

### Common Mistake: Losing Your Reference

```
❌ WRONG - Lost the list!
   head = head.next;  // Original head is gone forever!

✅ CORRECT - Use a pointer
   ListNode curr = head;
   curr = curr.next;  // head still points to original
```

### Thought Process Template

```
🧠 "How do I solve this linked list problem?"

1. Do I need to modify the head?
   → Yes: Use a dummy node

2. Do I need to find middle/cycle?
   → Yes: Fast & Slow pointers

3. Do I need to reverse?
   → Remember: prev, curr, next pattern

4. Do I need Kth from end?
   → Two pointers with K gap

5. Am I modifying links?
   → ALWAYS save .next before changing it!
```

---

## 🔧 Core Techniques

### 1. Fast & Slow Pointers (Floyd's Algorithm)

**Use Cases**: Find middle, detect cycle, find cycle start

```java
// Find middle node
public ListNode findMiddle(ListNode head) {
    ListNode slow = head, fast = head;
    
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    return slow;  // Middle (or second middle if even)
}
```

**Visualization**:
```
List: 1 → 2 → 3 → 4 → 5
      s   
      f

Step 1: slow=2, fast=3
Step 2: slow=3, fast=5
Step 3: fast.next = null → STOP

Middle = 3 ✅
```

---

### 2. Cycle Detection

```java
public boolean hasCycle(ListNode head) {
    ListNode slow = head, fast = head;
    
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        
        if (slow == fast) return true;  // Cycle detected
    }
    return false;
}

// Find where cycle starts
public ListNode detectCycle(ListNode head) {
    ListNode slow = head, fast = head;
    
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        
        if (slow == fast) {
            // Reset slow to head, move both at same speed
            slow = head;
            while (slow != fast) {
                slow = slow.next;
                fast = fast.next;
            }
            return slow;  // Cycle start
        }
    }
    return null;
}
```

---

### 3. In-Place Reversal

```java
public ListNode reverseList(ListNode head) {
    ListNode prev = null;
    ListNode curr = head;
    
    while (curr != null) {
        ListNode next = curr.next;  // Save next
        curr.next = prev;           // Reverse link
        prev = curr;                // Move prev
        curr = next;                // Move curr
    }
    return prev;
}
```

**Visualization**:
```
Original: 1 → 2 → 3 → null
          p   c

Step 1:   null ← 1   2 → 3 → null
                 p   c

Step 2:   null ← 1 ← 2   3 → null
                     p   c

Step 3:   null ← 1 ← 2 ← 3   null
                         p   c

Result:   3 → 2 → 1 → null
```

---

### 4. Reverse Between (Partial Reversal)

```java
// Reverse from position m to n
public ListNode reverseBetween(ListNode head, int m, int n) {
    ListNode dummy = new ListNode(0);
    dummy.next = head;
    ListNode prev = dummy;
    
    // Move to position before m
    for (int i = 0; i < m - 1; i++) {
        prev = prev.next;
    }
    
    // Reverse n - m + 1 nodes
    ListNode curr = prev.next;
    for (int i = 0; i < n - m; i++) {
        ListNode next = curr.next;
        curr.next = next.next;
        next.next = prev.next;
        prev.next = next;
    }
    
    return dummy.next;
}
```

---

## 💻 Core Problems

### Problem 1: Merge Two Sorted Lists

```java
public ListNode mergeTwoLists(ListNode l1, ListNode l2) {
    ListNode dummy = new ListNode(0);
    ListNode curr = dummy;
    
    while (l1 != null && l2 != null) {
        if (l1.val <= l2.val) {
            curr.next = l1;
            l1 = l1.next;
        } else {
            curr.next = l2;
            l2 = l2.next;
        }
        curr = curr.next;
    }
    
    curr.next = (l1 != null) ? l1 : l2;
    return dummy.next;
}
```

---

### Problem 2: Remove Nth Node From End

```java
public ListNode removeNthFromEnd(ListNode head, int n) {
    ListNode dummy = new ListNode(0);
    dummy.next = head;
    ListNode slow = dummy, fast = dummy;
    
    // Move fast n+1 steps ahead
    for (int i = 0; i <= n; i++) {
        fast = fast.next;
    }
    
    // Move both until fast reaches end
    while (fast != null) {
        slow = slow.next;
        fast = fast.next;
    }
    
    // Skip the nth node
    slow.next = slow.next.next;
    return dummy.next;
}
```

---

### Problem 3: Reorder List

```java
// 1→2→3→4→5 becomes 1→5→2→4→3
public void reorderList(ListNode head) {
    if (head == null || head.next == null) return;
    
    // Step 1: Find middle
    ListNode slow = head, fast = head;
    while (fast.next != null && fast.next.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    
    // Step 2: Reverse second half
    ListNode second = reverse(slow.next);
    slow.next = null;
    
    // Step 3: Merge alternating
    ListNode first = head;
    while (second != null) {
        ListNode temp1 = first.next;
        ListNode temp2 = second.next;
        first.next = second;
        second.next = temp1;
        first = temp1;
        second = temp2;
    }
}

private ListNode reverse(ListNode head) {
    ListNode prev = null;
    while (head != null) {
        ListNode next = head.next;
        head.next = prev;
        prev = head;
        head = next;
    }
    return prev;
}
```

---

### Problem 4: Add Two Numbers

```java
// Lists represent numbers in reverse (2→4→3 = 342)
public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
    ListNode dummy = new ListNode(0);
    ListNode curr = dummy;
    int carry = 0;
    
    while (l1 != null || l2 != null || carry > 0) {
        int sum = carry;
        if (l1 != null) {
            sum += l1.val;
            l1 = l1.next;
        }
        if (l2 != null) {
            sum += l2.val;
            l2 = l2.next;
        }
        
        carry = sum / 10;
        curr.next = new ListNode(sum % 10);
        curr = curr.next;
    }
    
    return dummy.next;
}
```

---

## 🧠 Common Patterns Summary

```
┌─────────────────────────────────────────────────────┐
│                 LINKED LIST PATTERNS                 │
├─────────────────────────────────────────────────────┤
│ 1. Dummy Node: Use when head might change           │
│    ListNode dummy = new ListNode(0);                │
│    dummy.next = head;                               │
│    return dummy.next;                               │
├─────────────────────────────────────────────────────┤
│ 2. Save Next: Before changing pointers              │
│    ListNode next = curr.next;                       │
│    curr.next = prev;                                │
├─────────────────────────────────────────────────────┤
│ 3. Two Pointers: Gap of k nodes                     │
│    Move fast k steps, then move both                │
├─────────────────────────────────────────────────────┤
│ 4. Fast/Slow: Half speed difference                 │
│    slow = slow.next;                                │
│    fast = fast.next.next;                           │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Complexity Summary

| Problem | Time | Space |
|---------|------|-------|
| Reverse List | O(n) | O(1) |
| Find Middle | O(n) | O(1) |
| Detect Cycle | O(n) | O(1) |
| Merge Two | O(n+m) | O(1) |
| Remove Nth | O(n) | O(1) |

---

## 📝 Practice Problems

| # | Problem | Difficulty | Link | Key Insight |
|---|---------|------------|------|-------------|
| 1 | Reverse Linked List | 🟢 Easy | [LeetCode](https://leetcode.com/problems/reverse-linked-list/) | Prev/Curr/Next |
| 2 | Merge Two Sorted | 🟢 Easy | [LeetCode](https://leetcode.com/problems/merge-two-sorted-lists/) | Dummy node |
| 3 | Linked List Cycle | 🟢 Easy | [LeetCode](https://leetcode.com/problems/linked-list-cycle/) | Fast/Slow |
| 4 | Reorder List | 🟡 Medium | [LeetCode](https://leetcode.com/problems/reorder-list/) | Find mid + reverse |
| 5 | Remove Nth From End | 🟡 Medium | [LeetCode](https://leetcode.com/problems/remove-nth-node-from-end-of-list/) | Gap pointers |
| 6 | Add Two Numbers | 🟡 Medium | [LeetCode](https://leetcode.com/problems/add-two-numbers/) | Carry handling |
| 7 | LRU Cache | 🟡 Medium | [LeetCode](https://leetcode.com/problems/lru-cache/) | Doubly linked + HashMap |
| 8 | Merge K Sorted | 🔴 Hard | [LeetCode](https://leetcode.com/problems/merge-k-sorted-lists/) | Heap + merge |

---

*Next: [Stacks & Queues →](../07-stacks-queues/00-overview.md)*
