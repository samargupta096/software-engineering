# NAB Interview Process Guide

## 📋 Interview Overview

NAB follows a structured interview process typically completed in **2-3 weeks**.

```
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 1: Online Assessment (Day 1-3)                          │
│  • MCQs: OOPs, DBMS, OS, Networking                            │
│  • Aptitude & Reasoning                                         │
│  • Coding Problems (HackerRank/Similar)                         │
├─────────────────────────────────────────────────────────────────┤
│  STAGE 2: Technical Round 1 (Day 5-7)                          │
│  • Resume Deep Dive                                             │
│  • DSA Problems (Medium-Hard)                                   │
│  • Core Java & OOP Concepts                                     │
├─────────────────────────────────────────────────────────────────┤
│  STAGE 3: Technical Round 2 (Day 8-12)                         │
│  • System Design                                                │
│  • Microservices Architecture                                   │
│  • Experience-based Discussion                                  │
├─────────────────────────────────────────────────────────────────┤
│  STAGE 4: HR Round (Day 14-18)                                 │
│  • Behavioral Questions                                         │
│  • Culture Fit Assessment                                       │
│  • Offer Discussion                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🖥️ Stage 1: Online Assessment

### What to Expect
| Section | Details | Duration |
|---------|---------|----------|
| **MCQs** | OOPs, DBMS, OS, Networking, Java | 45-60 min |
| **Aptitude** | Logical reasoning, quantitative | 20-30 min |
| **Coding** | 2-3 problems on HackerRank | 60-90 min |

### Sample MCQ Topics

**Object-Oriented Programming:**
- Inheritance vs Composition
- Polymorphism types
- Abstract classes vs Interfaces
- SOLID principles

**Database Management:**
- Normalization forms
- ACID properties
- Indexes and their types
- SQL query optimization

**Operating Systems:**
- Process vs Thread
- Deadlock conditions
- Memory management
- Scheduling algorithms

**Networking:**
- TCP vs UDP
- HTTP methods
- REST principles
- Load balancing concepts

### Coding Problem Patterns
1. **Array/String Manipulation** - Rotation, sliding window
2. **Stack/Queue** - Implementation, expression evaluation
3. **LinkedList** - Reversal, cycle detection
4. **Trees** - Traversals, BST operations
5. **Graphs** - BFS/DFS basics

### Example Problems
```
Q1: Rotate an array by K positions with O(1) space
Q2: Find the first missing positive integer
Q3: Implement a stack using two queues
Q4: Validate a balanced parentheses string
```

---

## 💻 Stage 2: Technical Round 1

### Duration: 45-60 minutes

### Structure
1. **Introduction** (5 min) - Brief about yourself
2. **Resume Discussion** (15 min) - Deep dive into projects
3. **DSA Problems** (25-30 min) - Live coding
4. **Core Java** (10 min) - Conceptual questions
5. **Questions for Interviewer** (5 min)

### DSA Topics to Focus

| Topic | Difficulty | Common Questions |
|-------|------------|------------------|
| Arrays | Medium | Two pointers, sliding window |
| Strings | Medium | Pattern matching, manipulation |
| Stacks | Medium | Expression parsing, next greater |
| Trees | Medium-Hard | Traversals, BST operations |
| Graphs | Medium | BFS/DFS applications |
| Dynamic Programming | Medium | Classic patterns |

### Sample Problems (with hints)

**Problem 1: Array Rotation**
```java
// Rotate array by K positions with O(1) space
// Hint: Use reverse approach
// 1. Reverse entire array
// 2. Reverse first K elements
// 3. Reverse remaining elements
```

**Problem 2: First Missing Positive**
```java
// Find smallest missing positive integer
// Input: [3, 4, -1, 1] → Output: 2
// Hint: Use array indices as hash
```

**Problem 3: Stack with Two Queues**
```java
// Implement push, pop, peek
// Hint: Make push expensive or pop expensive
```

### Core Java Questions Expected

| Area | Sample Questions |
|------|------------------|
| **Collections** | HashMap internals, ConcurrentHashMap |
| **Multithreading** | Thread states, synchronization, ExecutorService |
| **Java 8+** | Streams, Lambda, Optional, CompletableFuture |
| **Memory** | Heap vs Stack, Garbage Collection, memory leaks |
| **Exception Handling** | Checked vs Unchecked, custom exceptions |

---

## 🏗️ Stage 3: Technical Round 2 (System Design)

### Duration: 60-75 minutes

### Structure for Senior (8-14 years)
1. **System Design Problem** (40-45 min)
2. **Microservices Deep Dive** (15-20 min)
3. **Experience Discussion** (10-15 min)

### System Design Topics

| Topic | What They'll Assess |
|-------|---------------------|
| **Design a Data Pipeline** | Big data knowledge, streaming |
| **Design URL Shortener** | Database design, caching |
| **Real-time Analytics** | Event streaming, aggregations |
| **Design API Rate Limiter** | Distributed systems |
| **Design Notification System** | Async processing, queues |

### System Design Framework

```
1. CLARIFY (5 min)
   • Functional requirements
   • Non-functional requirements (scale, latency, availability)
   • Constraints and assumptions

2. ESTIMATE (5 min)
   • Traffic estimates
   • Storage estimates
   • Bandwidth estimates

3. HIGH-LEVEL DESIGN (10 min)
   • Components overview
   • Data flow diagram
   • API design

4. DEEP DIVE (20 min)
   • Database schema
   • Component details
   • Scaling strategies
   • Failure handling

5. WRAP UP (5 min)
   • Trade-offs discussed
   • Future improvements
   • Questions to interviewer
```

### Microservices Questions to Expect

1. How do you handle distributed transactions?
2. Explain your approach to service discovery
3. How do you implement circuit breaker pattern?
4. Describe your logging and tracing strategy
5. How do you handle data consistency across services?

### Experience-Based Questions

Prepare STAR-format stories for:
- **Most challenging technical problem** you solved
- **Performance optimization** you implemented
- **Team conflict** you resolved
- **Mentoring/leadership** experience
- **Production incident** you handled

---

## 👔 Stage 4: HR Round

### Duration: 30-45 minutes

### Common Questions

| Category | Questions |
|----------|-----------|
| **About You** | Tell me about yourself, Why NAB? |
| **Career** | Where do you see yourself in 5 years? |
| **Strengths** | What are your biggest strengths/weaknesses? |
| **Work Style** | How do you handle pressure/deadlines? |
| **Team** | Describe your ideal work environment |
| **Switching** | Why are you leaving current role? |

### NAB-Specific Questions

1. What do you know about NAB?
2. What interests you about our Ada platform?
3. How do you align with our customer-first culture?
4. Tell me about your experience with Agile
5. How do you approach mentoring junior developers?

### Questions to Ask HR

1. What does the onboarding process look like?
2. How does the team in Gurugram collaborate with Australia?
3. What are the growth opportunities within NAB?
4. Can you describe the team structure?
5. What's NAB's approach to work-life balance?

---

## ✅ Preparation Checklist

### Week Before Interview
- [ ] Review your resume - be ready to discuss everything
- [ ] Practice 5-10 DSA problems daily
- [ ] Review one system design problem per day
- [ ] Prepare 5 STAR-format stories
- [ ] Research NAB recent news

### Day Before Interview
- [ ] Test your equipment (camera, mic, internet)
- [ ] Prepare your interview space
- [ ] Keep resume and notes handy
- [ ] Get good sleep!

### Interview Day
- [ ] Join 5 minutes early
- [ ] Keep water nearby
- [ ] Have pen and paper for notes
- [ ] Think aloud during coding
- [ ] Ask clarifying questions

---

## 💡 Pro Tips

1. **For Online Assessment**
   - Read all questions before starting
   - Don't get stuck on one problem
   - Partial solutions are better than no solution

2. **For Technical Rounds**
   - Think aloud - interviewers want to understand your thought process
   - Ask clarifying questions before coding
   - Test your code with examples

3. **For System Design**
   - Start with clarifying requirements
   - Draw diagrams (use screen share)
   - Discuss trade-offs explicitly
   - Connect to NAB's context (banking, data platform)

4. **For HR Round**
   - Be genuine and authentic
   - Show enthusiasm for NAB
   - Have thoughtful questions prepared

