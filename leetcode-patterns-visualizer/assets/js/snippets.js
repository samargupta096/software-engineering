window.PATTERN_SNIPPETS = {
    'sliding-window': [
        {
            shortTitle: 'Max Subarray',
            snippet: `class SlidingWindow {
  public int maxSubArray(int[] nums, int k) {
    int maxSum = 0, windowSum = 0;
    
    // Step 1: Compute sum of first window
    for (int i = 0; i < k; i++) {
      windowSum += nums[i];
    }
    maxSum = windowSum;
    
    // Step 2: Slide the window
    for (int right = k; right < nums.length; right++) {
      // Add right element, subtract left element
      windowSum += nums[right] - nums[right - k];
      maxSum = Math.max(maxSum, windowSum);
    }
    
    return maxSum;
  }
}`
        },
        {
            shortTitle: 'Smallest Subarray sum ≥ S',
            snippet: `class MinSizeSubArraySum {
  public int minSubArrayLen(int target, int[] nums) {
    int minLength = Integer.MAX_VALUE;
    int windowSum = 0;
    int windowStart = 0;
    
    for (int windowEnd = 0; windowEnd < nums.length; windowEnd++) {
      windowSum += nums[windowEnd]; // add the next element
      
      // shrink the window until the sum is smaller than target
      while (windowSum >= target) {
        minLength = Math.min(minLength, windowEnd - windowStart + 1);
        windowSum -= nums[windowStart]; // subtract the element going out
        windowStart++; // slide the window ahead
      }
    }
    
    return minLength == Integer.MAX_VALUE ? 0 : minLength;
  }
}`
        },
        {
            shortTitle: 'Longest Substring K Distinct',
            snippet: `class LongestSubstringKDistinct {
  public int findLength(String str, int k) {
    if (str == null || str.length() == 0) return 0;
    
    int maxLength = 0, windowStart = 0;
    Map<Character, Integer> charFrequencyMap = new HashMap<>();
    
    for (int windowEnd = 0; windowEnd < str.length(); windowEnd++) {
      char rightChar = str.charAt(windowEnd);
      charFrequencyMap.put(rightChar, charFrequencyMap.getOrDefault(rightChar, 0) + 1);
      
      while (charFrequencyMap.size() > k) {
        char leftChar = str.charAt(windowStart);
        charFrequencyMap.put(leftChar, charFrequencyMap.get(leftChar) - 1);
        if (charFrequencyMap.get(leftChar) == 0) {
          charFrequencyMap.remove(leftChar);
        }
        windowStart++; // shrink the window
      }
      maxLength = Math.max(maxLength, windowEnd - windowStart + 1);
    }
    return maxLength;
  }
}`
        },
        {
            shortTitle: 'Fruits into Baskets',
            snippet: `class MaxFruitCountOf2Types {
  public int findLength(char[] arr) {
    int maxLength = 0, windowStart = 0;
    Map<Character, Integer> fruitFrequencyMap = new HashMap<>();
    
    for (int windowEnd = 0; windowEnd < arr.length; windowEnd++) {
      fruitFrequencyMap.put(arr[windowEnd], fruitFrequencyMap.getOrDefault(arr[windowEnd], 0) + 1);
      
      while (fruitFrequencyMap.size() > 2) {
        fruitFrequencyMap.put(arr[windowStart], fruitFrequencyMap.get(arr[windowStart]) - 1);
        if (fruitFrequencyMap.get(arr[windowStart]) == 0) {
          fruitFrequencyMap.remove(arr[windowStart]);
        }
        windowStart++; // shrink the window
      }
      maxLength = Math.max(maxLength, windowEnd - windowStart + 1);
    }
    return maxLength;
  }
}`
        }
    ],
    'two-pointers': [
        {
            shortTitle: 'Pair with Target Sum',
            snippet: `class TwoPointers {
  public int[] twoSum(int[] numbers, int target) {
    int left = 0;
    int right = numbers.length - 1;
    
    while (left < right) {
      int currentSum = numbers[left] + numbers[right];
      
      if (currentSum == target) {
        return new int[]{left + 1, right + 1}; // Found it
      } else if (currentSum < target) {
        left++; // Need larger sum
      } else {
        right--; // Need smaller sum
      }
    }
    
    return new int[]{-1, -1};
  }
}`
        },
        {
            shortTitle: 'Remove Duplicates',
            snippet: `class RemoveDuplicates {
  public int remove(int[] arr) {
    if (arr.length == 0) return 0;
    
    int nextNonDuplicate = 1; // index of the next non-duplicate element
    for (int i = 1; i < arr.length; i++) {
      if (arr[nextNonDuplicate - 1] != arr[i]) {
        arr[nextNonDuplicate] = arr[i];
        nextNonDuplicate++;
      }
    }
    
    return nextNonDuplicate;
  }
}`
        },
        {
            shortTitle: 'Squaring a Sorted Array',
            snippet: `class SortedArraySquares {
  public int[] makeSquares(int[] arr) {
    int n = arr.length;
    int[] squares = new int[n];
    int highestSquareIdx = n - 1;
    int left = 0, right = n - 1;
    
    while (left <= right) {
      int leftSquare = arr[left] * arr[left];
      int rightSquare = arr[right] * arr[right];
      
      if (leftSquare > rightSquare) {
        squares[highestSquareIdx--] = leftSquare;
        left++;
      } else {
        squares[highestSquareIdx--] = rightSquare;
        right--;
      }
    }
    return squares;
  }
}`
        },
        {
            shortTitle: 'Triplet Sum to Zero',
            snippet: `class TripletSumToZero {
  public List<List<Integer>> searchTriplets(int[] arr) {
    Arrays.sort(arr);
    List<List<Integer>> triplets = new ArrayList<>();
    
    for (int i = 0; i < arr.length - 2; i++) {
      if (i > 0 && arr[i] == arr[i - 1]) continue; // skip duplicate element
      searchPair(arr, -arr[i], i + 1, triplets);
    }
    return triplets;
  }
  
  private void searchPair(int[] arr, int targetSum, int left, List<List<Integer>> triplets) {
    int right = arr.length - 1;
    while (left < right) {
      int currentSum = arr[left] + arr[right];
      if (currentSum == targetSum) {
        triplets.add(Arrays.asList(-targetSum, arr[left], arr[right]));
        left++; right--;
        while (left < right && arr[left] == arr[left - 1]) left++; // skip duplicates
        while (left < right && arr[right] == arr[right + 1]) right--; // skip duplicates
      } else if (targetSum > currentSum) {
        left++; // need a bigger pair sum
      } else {
        right--; // need a smaller pair sum
      }
    }
  }
}`
        }
    ],
    'fast-slow-pointers': [
        {
            shortTitle: 'LinkedList Cycle',
            snippet: `class FastSlowPointers {
  public boolean hasCycle(ListNode head) {
    if (head == null || head.next == null) return false;
    
    ListNode slow = head;
    ListNode fast = head.next;
    
    while (slow != fast) {
      if (fast == null || fast.next == null) {
        return false; // Reached end, no cycle
      }
      slow = slow.next;         // Moves 1 step
      fast = fast.next.next;    // Moves 2 steps
    }
    
    return true; // Fast met slow
  }
}`
        },
        {
            shortTitle: 'Start of Cycle',
            snippet: `class LinkedListCycleStart {
  public ListNode findCycleStart(ListNode head) {
    ListNode slow = head;
    ListNode fast = head;
    
    while (fast != null && fast.next != null) {
      slow = slow.next;
      fast = fast.next.next;
      if (slow == fast) { // found the cycle
        ListNode pointer = head;
        while (pointer != slow) {
          pointer = pointer.next;
          slow = slow.next;
        }
        return slow; // both pointers meet at the cycle start
      }
    }
    return null;
  }
}`
        },
        {
            shortTitle: 'Happy Number',
            snippet: `class HappyNumber {
  public boolean find(int num) {
    int slow = num, fast = num;
    do {
      slow = findSquareSum(slow); // move one step
      fast = findSquareSum(findSquareSum(fast)); // move two steps
    } while (slow != fast);
    
    return slow == 1; // if both met at 1, it's a happy number
  }

  private int findSquareSum(int num) {
    int sum = 0, digit;
    while (num > 0) {
      digit = num % 10;
      sum += digit * digit;
      num /= 10;
    }
    return sum;
  }
}`
        },
        {
            shortTitle: 'Middle of LinkedList',
            snippet: `class MiddleOfLinkedList {
  public ListNode findMiddle(ListNode head) {
    ListNode slow = head;
    ListNode fast = head;
    
    while (fast != null && fast.next != null) {
      slow = slow.next;
      fast = fast.next.next;
    }
    
    return slow; // slow is at the middle
  }
}`
        }
    ],
    'merge-intervals': [
        {
            shortTitle: 'Merge Intervals',
            snippet: `class MergeIntervals {
  public int[][] merge(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
    List<int[]> merged = new ArrayList<>();
    
    int[] currentInterval = intervals[0];
    merged.add(currentInterval);
    
    for (int[] interval : intervals) {
      int currentEnd = currentInterval[1];
      int nextBegin = interval[0];
      int nextEnd = interval[1];
      
      if (currentEnd >= nextBegin) {
        // Overlapping intervals, merge them
        currentInterval[1] = Math.max(currentEnd, nextEnd);
      } else {
        // Disjoint intervals, add the new interval
        currentInterval = interval;
        merged.add(currentInterval);
      }
    }
    return merged.toArray(new int[merged.size()][]);
  }
}`
        },
        {
            shortTitle: 'Insert Interval',
            snippet: `class InsertInterval {
  public int[][] insert(int[][] intervals, int[] newInterval) {
    List<int[]> merged = new ArrayList<>();
    int i = 0;

    // Add all intervals ending before newInterval starts
    while (i < intervals.length && intervals[i][1] < newInterval[0])
      merged.add(intervals[i++]);

    // Merge all overlapping intervals to one mutually exclusive interval
    while (i < intervals.length && intervals[i][0] <= newInterval[1]) {
      newInterval[0] = Math.min(intervals[i][0], newInterval[0]);
      newInterval[1] = Math.max(intervals[i][1], newInterval[1]);
      i++;
    }
    merged.add(newInterval); // insert the new interval

    // Add all the remaining intervals to the result
    while (i < intervals.length)
      merged.add(intervals[i++]);

    return merged.toArray(new int[merged.size()][]);
  }
}`
        },
        {
            shortTitle: 'Intervals Intersection',
            snippet: `class IntervalsIntersection {
  public int[][] intervalIntersection(int[][] arr1, int[][] arr2) {
    List<int[]> result = new ArrayList<>();
    int i = 0, j = 0;

    while (i < arr1.length && j < arr2.length) {
      // check if the intervals overlap
      if ((arr1[i][0] >= arr2[j][0] && arr1[i][0] <= arr2[j][1]) || 
          (arr2[j][0] >= arr1[i][0] && arr2[j][0] <= arr1[i][1])) {
        // Find intersecting area
        result.add(new int[]{
          Math.max(arr1[i][0], arr2[j][0]), 
          Math.min(arr1[i][1], arr2[j][1])
        });
      }

      // move next from the interval which is finishing first
      if (arr1[i][1] < arr2[j][1]) {
        i++;
      } else {
        j++;
      }
    }
    return result.toArray(new int[result.size()][]);
  }
}`
        },
        {
            shortTitle: 'Conflicting Appointments',
            snippet: `class ConflictingAppointments {
  public boolean canAttendAllAppointments(int[][] intervals) {
    // Sort the intervals by start time
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));

    // Find any overlapping appointment
    for (int i = 1; i < intervals.length; i++) {
      if (intervals[i][0] < intervals[i - 1][1]) { // please note the comparison
        return false;
      }
    }
    return true;
  }
}`
        }
    ],
    'cyclic-sort': [
        {
            shortTitle: 'Cyclic Sort',
            snippet: `class CyclicSort {
  public void sort(int[] nums) {
    int i = 0;
    while (i < nums.length) {
      int j = nums[i] - 1; // Expected index
      if (nums[i] != nums[j]) {
        swap(nums, i, j);
      } else {
        i++;
      }
    }
  }

  private void swap(int[] arr, int i, int j) {
    int temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
}`
        },
        {
            shortTitle: 'Find Missing Number',
            snippet: `class FindMissingNumber {
  public int findMissingNumber(int[] nums) {
    int i = 0;
    while (i < nums.length) {
      if (nums[i] < nums.length && nums[i] != nums[nums[i]])
        swap(nums, i, nums[i]);
      else
        i++;
    }

    // find the first number missing from its index
    for (i = 0; i < nums.length; i++) {
      if (nums[i] != i) return i;
    }

    return nums.length; // array had 0 to n-1, missing is n
  }

  private void swap(int[] arr, int i, int j) {
    int temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
}`
        },
        {
            shortTitle: 'Find All Missing Numbers',
            snippet: `class FindAllMissingNumbers {
  public List<Integer> findNumbers(int[] nums) {
    int i = 0;
    while (i < nums.length) {
      if (nums[i] != nums[nums[i] - 1])
        swap(nums, i, nums[i] - 1);
      else
        i++;
    }

    List<Integer> missingNumbers = new ArrayList<>();
    for (i = 0; i < nums.length; i++) {
      if (nums[i] != i + 1)
        missingNumbers.add(i + 1);
    }
    return missingNumbers;
  }

  private void swap(int[] arr, int i, int j) {
    int temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
}`
        },
        {
            shortTitle: 'Find Duplicate Number',
            snippet: `class FindDuplicateNumber {
  public int findDuplicate(int[] nums) {
    int i = 0;
    while (i < nums.length) {
      if (nums[i] != i + 1) { // number is not at correct index
        if (nums[i] != nums[nums[i] - 1])
          swap(nums, i, nums[i] - 1); // place it at correct index
        else // we found the duplicate
          return nums[i];
      } else {
        i++;
      }
    }
    return -1; // duplicate not found
  }

  private void swap(int[] arr, int i, int j) {
    int temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
}`
        }
    ],
    'linked-list-reversal': [
        {
            shortTitle: 'Reverse LL',
            snippet: `class LinkedListReversal {
  public ListNode reverseList(ListNode head) {
    ListNode prev = null;
    ListNode current = head;
    ListNode next = null;
    
    while (current != null) {
      next = current.next;     // Store next node
      current.next = prev;     // Reverse the link
      prev = current;          // Move prev forward
      current = next;          // Move current forward
    }
    
    return prev; // New head
  }
}`
        },
        {
            shortTitle: 'Reverse SUB-LL',
            snippet: `class ReverseSubList {
  public ListNode reverseBetween(ListNode head, int left, int right) {
    if (left == right) return head;

    // Skip the first left-1 nodes
    ListNode current = head, previous = null;
    for (int i = 0; current != null && i < left - 1; ++i) {
      previous = current;
      current = current.next;
    }

    // Nodes connecting to sub-list
    ListNode lastNodeOfFirstPart = previous;
    ListNode lastNodeOfSubList = current;
    ListNode next = null;

    // Reverse nodes between left and right
    for (int i = 0; current != null && i < right - left + 1; ++i) {
      next = current.next;
      current.next = previous;
      previous = current;
      current = next;
    }

    // reconnect
    if (lastNodeOfFirstPart != null)
      lastNodeOfFirstPart.next = previous; 
    else
      head = previous; 
      
    lastNodeOfSubList.next = current;
    return head;
  }
}`
        },
        {
            shortTitle: 'Reverse k-element Sub-list',
            snippet: `class ReverseEveryKElements {
  public ListNode reverseKGroup(ListNode head, int k) {
    if (k <= 1 || head == null) return head;

    ListNode current = head, previous = null;
    
    while (true) {
      ListNode lastNodeOfFirstPart = previous;
      ListNode lastNodeOfSubList = current;
      ListNode next = null;
      
      // Reverse k nodes
      int i = 0;
      for (; current != null && i < k; ++i) {
        next = current.next;
        current.next = previous;
        previous = current;
        current = next;
      }
      
      // We didn't have enough k nodes? Stop there! (depending on problem rules)
      
      // Connect with the previous part
      if (lastNodeOfFirstPart != null)
        lastNodeOfFirstPart.next = previous;
      else
        head = previous;

      // Connect with the next part
      lastNodeOfSubList.next = current;

      if (current == null) break;
      previous = lastNodeOfSubList;
    }
    return head;
  }
}`
        },
        {
            shortTitle: 'Rotate LinkedList',
            snippet: `class RotateLinkedList {
  public ListNode rotateRight(ListNode head, int k) {
    if (head == null || head.next == null || k <= 0) return head;

    // find list length
    ListNode lastNode = head;
    int listLength = 1;
    while (lastNode.next != null) {
      lastNode = lastNode.next;
      listLength++;
    }

    lastNode.next = head; // connect last to head
    k %= listLength; 
    int skipLength = listLength - k;

    ListNode lastNodeOfRotatedList = head;
    for (int i = 0; i < skipLength - 1; i++)
      lastNodeOfRotatedList = lastNodeOfRotatedList.next;

    // set new head and break cycle
    head = lastNodeOfRotatedList.next;
    lastNodeOfRotatedList.next = null;
    
    return head;
  }
}`
        }
    ],
    'tree-bfs': [
        {
            shortTitle: 'Level Order Travers.',
            snippet: `class TreeBFS {
  public List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;
    
    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);
    
    while (!queue.isEmpty()) {
      int levelSize = queue.size();
      List<Integer> currentLevel = new ArrayList<>();
      
      for (int i = 0; i < levelSize; i++) {
        TreeNode currentNode = queue.poll();
        currentLevel.add(currentNode.val);
        
        if (currentNode.left != null) queue.offer(currentNode.left);
        if (currentNode.right != null) queue.offer(currentNode.right);
      }
      result.add(currentLevel);
    }
    return result;
  }
}`
        },
        {
            shortTitle: 'Reverse Level Order',
            snippet: `class ReverseLevelOrderTraversal {
  public List<List<Integer>> traverse(TreeNode root) {
    List<List<Integer>> result = new LinkedList<>();
    if (root == null) return result;

    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);
    
    while (!queue.isEmpty()) {
      int levelSize = queue.size();
      List<Integer> currentLevel = new ArrayList<>();
      for (int i = 0; i < levelSize; i++) {
        TreeNode currentNode = queue.poll();
        currentLevel.add(currentNode.val);
        if (currentNode.left != null) queue.offer(currentNode.left);
        if (currentNode.right != null) queue.offer(currentNode.right);
      }
      result.add(0, currentLevel); // Insert at beginning of result list
    }
    return result;
  }
}`
        },
        {
            shortTitle: 'Zigzag Traversal',
            snippet: `class ZigzagTraversal {
  public List<List<Integer>> traverse(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;

    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);
    boolean leftToRight = true;
    
    while (!queue.isEmpty()) {
      int levelSize = queue.size();
      List<Integer> currentLevel = new LinkedList<>();
      
      for (int i = 0; i < levelSize; i++) {
        TreeNode currentNode = queue.poll();
        if (leftToRight)
          currentLevel.add(currentNode.val);
        else
          currentLevel.add(0, currentNode.val); // add to head

        if (currentNode.left != null) queue.offer(currentNode.left);
        if (currentNode.right != null) queue.offer(currentNode.right);
      }
      result.add(currentLevel);
      leftToRight = !leftToRight; // swap direction
    }
    return result;
  }
}`
        },
        {
            shortTitle: 'Level Averages',
            snippet: `class LevelAverages {
  public List<Double> findLevelAverages(TreeNode root) {
    List<Double> result = new ArrayList<>();
    if (root == null) return result;

    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);
    
    while (!queue.isEmpty()) {
      int levelSize = queue.size();
      double levelSum = 0;
      
      for (int i = 0; i < levelSize; i++) {
        TreeNode currentNode = queue.poll();
        levelSum += currentNode.val;
        
        if (currentNode.left != null) queue.offer(currentNode.left);
        if (currentNode.right != null) queue.offer(currentNode.right);
      }
      result.add(levelSum / levelSize); // append average
    }
    return result;
  }
}`
        }
    ],
    'tree-dfs': [
        {
            shortTitle: 'Tree Path Sum',
            snippet: `class TreeDFS {
  public boolean hasPathSum(TreeNode root, int targetSum) {
    if (root == null) {
      return false;
    }
    
    // Check if it's a leaf node and value matches target
    if (root.left == null && root.right == null && root.val == targetSum) {
      return true;
    }
    
    // Recursive DFS for left and right
    return hasPathSum(root.left, targetSum - root.val) || 
           hasPathSum(root.right, targetSum - root.val);
  }
}`
        },
        {
            shortTitle: 'All Paths for a Sum',
            snippet: `class FindAllTreePaths {
  public List<List<Integer>> findPaths(TreeNode root, int sum) {
    List<List<Integer>> allPaths = new ArrayList<>();
    List<Integer> currentPath = new ArrayList<>();
    findPathsRecursive(root, sum, currentPath, allPaths);
    return allPaths;
  }

  private void findPathsRecursive(TreeNode root, int sum, List<Integer> currentPath, 
      List<List<Integer>> allPaths) {
    if (root == null) return;
    
    currentPath.add(root.val);
    if (root.val == sum && root.left == null && root.right == null) {
      allPaths.add(new ArrayList<>(currentPath)); // Valid path found
    } else {
      findPathsRecursive(root.left, sum - root.val, currentPath, allPaths);
      findPathsRecursive(root.right, sum - root.val, currentPath, allPaths);
    }
    
    // backtrack
    currentPath.remove(currentPath.size() - 1);
  }
}`
        },
        {
            shortTitle: 'Sum of Path Numbers',
            snippet: `class SumOfPathNumbers {
  public int findSumOfPathNumbers(TreeNode root) {
    return findRootToLeafPathNumbers(root, 0);
  }

  private int findRootToLeafPathNumbers(TreeNode currentNode, int pathSum) {
    if (currentNode == null) return 0;
    
    // Calculate the path number
    pathSum = 10 * pathSum + currentNode.val;
    
    // leaf node! 
    if (currentNode.left == null && currentNode.right == null) {
      return pathSum;
    }
    
    // sum from both sub-trees
    return findRootToLeafPathNumbers(currentNode.left, pathSum) +
           findRootToLeafPathNumbers(currentNode.right, pathSum);
  }
}`
        },
        {
            shortTitle: 'Path with Seq.',
            snippet: `class PathWithGivenSequence {
  public boolean findPath(TreeNode root, int[] sequence) {
    if (root == null) return sequence.length == 0;
    return findPathRecursive(root, sequence, 0);
  }

  private boolean findPathRecursive(TreeNode currentNode, int[] sequence, int sequenceIndex) {
    if (currentNode == null) return false;
    
    if (sequenceIndex >= sequence.length || currentNode.val != sequence[sequenceIndex])
      return false;

    // if it's a leaf node and matches the last sequence element
    if (currentNode.left == null && currentNode.right == null 
        && sequenceIndex == sequence.length - 1)
      return true;

    // recursively call left and right
    return findPathRecursive(currentNode.left, sequence, sequenceIndex + 1)
        || findPathRecursive(currentNode.right, sequence, sequenceIndex + 1);
  }
}`
        }
    ],
    'two-heaps': [
        {
            shortTitle: 'Median of Stream',
            snippet: `class MedianFinder {
  PriorityQueue<Integer> maxHeap; // Lower half
  PriorityQueue<Integer> minHeap; // Upper half
  
  public MedianFinder() {
    maxHeap = new PriorityQueue<>((a, b) -> b - a);
    minHeap = new PriorityQueue<>();
  }
  
  public void addNum(int num) {
    maxHeap.offer(num);
    minHeap.offer(maxHeap.poll());
    
    if (maxHeap.size() < minHeap.size()) {
      maxHeap.offer(minHeap.poll());
    }
  }
  
  public double findMedian() {
    if (maxHeap.size() > minHeap.size()) {
      return maxHeap.peek();
    }
    return (maxHeap.peek() + minHeap.peek()) / 2.0;
  }
}`
        },
        {
            shortTitle: 'Sliding Window Med.',
            snippet: `class SlidingWindowMedian {
  PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
  PriorityQueue<Integer> minHeap = new PriorityQueue<>();

  public double[] medianSlidingWindow(int[] nums, int k) {
    double[] result = new double[nums.length - k + 1];
    for (int i = 0; i < nums.length; i++) {
      if (maxHeap.size() == 0 || maxHeap.peek() >= nums[i]) {
        maxHeap.add(nums[i]);
      } else {
        minHeap.add(nums[i]);
      }
      rebalanceHeaps();

      if (i - k + 1 >= 0) { // we have a complete window
        if (maxHeap.size() == minHeap.size()) {
          result[i - k + 1] = maxHeap.peek() / 2.0 + minHeap.peek() / 2.0;
        } else {
          result[i - k + 1] = maxHeap.peek();
        }

        int elementToBeRemoved = nums[i - k + 1]; // remove the outgoing
        if (elementToBeRemoved <= maxHeap.peek()) {
          maxHeap.remove(elementToBeRemoved);
        } else {
          minHeap.remove(elementToBeRemoved);
        }
        rebalanceHeaps();
      }
    }
    return result;
  }
  
  private void rebalanceHeaps() {
    if (maxHeap.size() > minHeap.size() + 1)
      minHeap.add(maxHeap.poll());
    else if (maxHeap.size() < minHeap.size())
      maxHeap.add(minHeap.poll());
  }
}`
        },
        {
            shortTitle: 'Maximize Capital',
            snippet: `class MaximizeCapital {
  public int findMaximizedCapital(int k, int w, int[] profits, int[] capital) {
    PriorityQueue<Integer> minCapitalHeap = new PriorityQueue<>((i1, i2) -> capital[i1] - capital[i2]);
    PriorityQueue<Integer> maxProfitHeap = new PriorityQueue<>((i1, i2) -> profits[i2] - profits[i1]);

    for (int i = 0; i < profits.length; i++) 
      minCapitalHeap.offer(i); // insert indices

    int availableCapital = w;
    for (int i = 0; i < k; i++) {
      // Find all projects that can be done and add to profit heap
      while (!minCapitalHeap.isEmpty() && capital[minCapitalHeap.peek()] <= availableCapital) {
        maxProfitHeap.add(minCapitalHeap.poll());
      }
      // If we can't afford any more projects, break
      if (maxProfitHeap.isEmpty()) break;
      
      availableCapital += profits[maxProfitHeap.poll()]; // add profit to capital
    }
    return availableCapital;
  }
}`
        },
        {
            shortTitle: 'Next Interval',
            snippet: `class NextInterval {
  public int[] findRightInterval(int[][] intervals) {
    PriorityQueue<Integer> maxStartHeap = new PriorityQueue<>((i1, i2) -> intervals[i2][0] - intervals[i1][0]);
    PriorityQueue<Integer> maxEndHeap = new PriorityQueue<>((i1, i2) -> intervals[i2][1] - intervals[i1][1]);
    
    int[] result = new int[intervals.length];
    for (int i = 0; i < intervals.length; i++) {
        maxStartHeap.offer(i);  // Heap stores indices 
        maxEndHeap.offer(i);
    }
    
    for (int i = 0; i < intervals.length; i++) {
        int topEnd = maxEndHeap.poll(); // Get interval with max end
        result[topEnd] = -1; // Default
        
        // Find interval with start >= to topEnd
        if (intervals[maxStartHeap.peek()][0] >= intervals[topEnd][1]) {
            int topStart = maxStartHeap.poll();
            // keep popping to find the closest start
            while (!maxStartHeap.isEmpty() && intervals[maxStartHeap.peek()][0] >= intervals[topEnd][1]) {
                topStart = maxStartHeap.poll();
            }
            result[topEnd] = topStart;
            maxStartHeap.add(topStart); // put it back for others
        }
    }
    return result;
  }
}`
        }
    ],
    'subsets': [
        {
            shortTitle: 'Subsets',
            snippet: `class Subsets {
  public List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(result, new ArrayList<>(), nums, 0);
    return result;
  }
  
  private void backtrack(List<List<Integer>> result, List<Integer> tempList, int[] nums, int start) {
    result.add(new ArrayList<>(tempList));
    
    for (int i = start; i < nums.length; i++) {
      tempList.add(nums[i]);                  // Include
      backtrack(result, tempList, nums, i + 1); // Recurse
      tempList.remove(tempList.size() - 1);   // Backtrack
    }
  }
}`
        },
        {
            shortTitle: 'Subsets With Dupes',
            snippet: `class SubsetsWithDuplicates {
  public List<List<Integer>> subsetsWithDup(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(nums); // Must sort to handle duplicates
    backtrack(result, new ArrayList<>(), nums, 0);
    return result;
  }

  private void backtrack(List<List<Integer>> result, List<Integer> tempList, int [] nums, int start) {
    result.add(new ArrayList<>(tempList));
    for (int i = start; i < nums.length; i++) {
      if (i > start && nums[i] == nums[i-1]) continue; // skip duplicates
      tempList.add(nums[i]);
      backtrack(result, tempList, nums, i + 1);
      tempList.remove(tempList.size() - 1); // backtrack
    }
  }
}`
        },
        {
            shortTitle: 'Permutations',
            snippet: `class Permutations {
  public List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(result, new ArrayList<>(), nums);
    return result;
  }

  private void backtrack(List<List<Integer>> result, List<Integer> tempList, int [] nums) {
    if (tempList.size() == nums.length) {
      result.add(new ArrayList<>(tempList));
      return; 
    }
    for (int i = 0; i < nums.length; i++) { 
      if (tempList.contains(nums[i])) continue; // element already exists, skip
      tempList.add(nums[i]);
      backtrack(result, tempList, nums);
      tempList.remove(tempList.size() - 1); // backtrack
    }
  }
}`
        },
        {
            shortTitle: 'String Permutations',
            snippet: `class StringPermutations {
  public List<String> letterCasePermutation(String s) {
    List<String> result = new ArrayList<>();
    backtrack(s.toCharArray(), 0, result);
    return result;
  }

  private void backtrack(char[] chars, int index, List<String> result) {
    if (index == chars.length) {
      result.add(new String(chars));
      return;
    }
    
    if (Character.isLetter(chars[index])) {
      chars[index] = Character.toLowerCase(chars[index]);
      backtrack(chars, index + 1, result); // Lowercase path
      
      chars[index] = Character.toUpperCase(chars[index]);
      backtrack(chars, index + 1, result); // Uppercase path
    } else {
      backtrack(chars, index + 1, result); // Just a digit, move on
    }
  }
}`
        }
    ]
};
