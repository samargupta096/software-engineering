[🏠 Home](../README.md) | [⬅️ Bit Manipulation](./15-bit-manipulation/00-overview.md)

# 📝 Technical Interview Q&A

> Behavioral & Technical Tips for Success

---

## 🧠 General Problem Solving (UMPIRE)

### 1. Understand (5 min)
- Ask clarifying questions:
    - "Can the input be null or empty?"
    - "Is the array sorted?"
    - "Can there be duplicates?"
    - "What is the range of values?"
    - "Is it a directed or undirected graph?"
- Confirm input/output format.

### 2. Match (2 min)
- Match to patterns (see [Roadmap](./00-dsa-roadmap.md)).
- "Since it's a sorted array and we need a target, I'll use Binary Search."

### 3. Plan (5-10 min)
- Talk through your approach BEFORE coding.
- Discuss Time & Space Complexity.
- Write pseudocode or comments.

### 4. Implement (15-20 min)
- Write clean, modular code.
- Use meaningful variable names (`curr`, `slow`, `fast`, `visited`).
- Handle edge cases upfront.

### 5. Review (5 min)
- Dry run with a small example (`nums = [1, 2, 3]`).
- Check strict inequalities (`<` vs `<=`).
- Double-check complexity.

### 6. Evaluate
- "This solution is O(n) time because we pass once, and O(1) space."
- "We could optimize space by using..."

---

## 💬 Common Java Interview Questions

### Q: ArrayList vs LinkedList?
| Feature | ArrayList | LinkedList |
|---------|-----------|------------|
| Access | O(1) | O(n) |
| Insert (End) | O(1) amortized | O(1) |
| Insert (Middle) | O(n) | O(1) (if ref known) |
| Memory | Contiguous | Nodes + Pointers |

### Q: HashMap Internals?
- Uses an array of buckets (Node<K,V>[] table).
- Computes `key.hashCode() % capacity`.
- Handling collisions:
    - **Chaining**: Linked List in each bucket.
    - **Treeifying**: Converts list to Red-Black Tree if bucket size > 8 (Java 8+).
- Time: O(1) avg, O(n) worst (or O(log n) with trees).

### Q: Comparable vs Comparator?
- `Comparable`: Natural ordering (`compareTo` in the class).
- `Comparator`: Custom ordering (`compare` in separate class/lambda).

```java
// Comparable
class Student implements Comparable<Student> {
    public int compareTo(Student s) { ... }
}

// Comparator
Collections.sort(students, (s1, s2) -> s1.age - s2.age);
```

### Q: PriorityQueue vs TreeSet?
- **PriorityQueue**: Min/Max element access in O(1). Insert/Remove O(log n). No total ordering. Duplicates allowed.
- **TreeSet**: Total ordering. No duplicates. O(log n) access/insert/remove.

---

## 🚀 Behavioral Tips (STAR Method)

Situation, Task, Action, Result.

- **Situation**: "Last year, our API latency spiked to 500ms..."
- **Task**: "I needed to optimize the database queries..."
- **Action**: "I implemented Redis caching and optimized SQL indexes..."
- **Result**: "Latency dropped to 50ms, improving user retention by 10%."

---

## ❌ Red Flags to Avoid

1. **Jumping to code immediately**: Always plan first.
2. **Silence**: Keep talking. Explain your thought process.
3. **Ignoring hints**: If the interviewer asks "Are you sure?", re-evaluate.
4. **Messy code**: Use helper functions if logic gets complex.
5. **Giving up**: Even if stuck, brute force first -> then optimize.

---

# 🎓 Final Checklist

- [ ] Big O Analysis (Time/Space)
- [ ] Edge Cases (Empty, Null, Single element, Max/Min int)
- [ ] Variable Naming
- [ ] Dry Run
- [ ] Confidence!

---

*Happy Coding! You got this! 🚀*
