# Data Structures & Algorithms (The Citadel of Algorithms) - 35 Questions
# 12 Easy, 14 Medium, 7 Hard, 2 Boss

DSA_QUESTIONS = [
    # EASY (12)
    {
        "question_text": "What is the worst-case time complexity of searching for a target value in a sorted array using Binary Search?",
        "code_snippet": "int binarySearch(int arr[], int l, int r, int x) {\n    while (l <= r) {\n        int m = l + (r - l) / 2;\n        if (arr[m] == x) return m;\n        if (arr[m] < x) l = m + 1;\n        else r = m - 1;\n    }\n    return -1;\n}",
        "options": [
            {"id": "A", "text": "O(1)"},
            {"id": "B", "text": "O(log n)"},
            {"id": "C", "text": "O(n)"},
            {"id": "D", "text": "O(n log n)"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "Binary search repeatedly divides the search interval in half. Halving the problem size n at each iteration gives T(n) = T(n/2) + O(1), which solves to O(log n) via the Master Theorem.",
        "tags": ["Binary Search", "Searching", "Time Complexity"]
    },
    {
        "question_text": "Which fundamental principle governs the order of insertion and deletion operations in a standard Queue data structure?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Last In, First Out (LIFO)"},
            {"id": "B", "text": "First In, First Out (FIFO)"},
            {"id": "C", "text": "Random Access"},
            {"id": "D", "text": "Highest Priority First (HPF)"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "A queue is an abstract data structure that follows the FIFO (First In, First Out) ordering invariant: elements are enqueued at the rear and dequeued from the front in arrival order.",
        "tags": ["Queue", "Abstract Data Types", "Basics"]
    },
    {
        "question_text": "What is the time complexity of accessing an arbitrary element at index k in a standard singly-linked list of n elements?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "O(1)"},
            {"id": "B", "text": "O(k)"},
            {"id": "C", "text": "O(n)"},
            {"id": "D", "text": "O(log n)"}
        ],
        "correct_option_id": "C",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "Unlike contiguous arrays that offer O(1) random pointer arithmetic access, a singly-linked list requires sequential pointer traversal from the head node, taking O(n) worst-case time.",
        "tags": ["Linked List", "Memory Layout", "Array vs List"]
    },
    {
        "question_text": "Which data structure is inherently used by modern computer architectures and compilers to manage function call frames, local variables, and recursion?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Queue"},
            {"id": "B", "text": "Call Stack (LIFO)"},
            {"id": "C", "text": "Binary Search Tree"},
            {"id": "D", "text": "Hash Table"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "The execution call stack operates strictly on Last In, First Out (LIFO) semantics: invoking a function pushes its activation record onto the stack, and returning pops it off.",
        "tags": ["Stack", "Recursion", "Memory Management"]
    },
    {
        "question_text": "In a valid Binary Min-Heap containing n unique numeric keys, where is the minimum element guaranteed to reside?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "At any arbitrary leaf node"},
            {"id": "B", "text": "At the root node (index 0 / 1)"},
            {"id": "C", "text": "At the leftmost leaf node"},
            {"id": "D", "text": "At index n/2"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "The min-heap invariant specifies that parent[i] <= child[i] for all nodes. By transitivity, the global minimum key must reside at the root node.",
        "tags": ["Heap", "Priority Queue", "Tree Properties"]
    },
    {
        "question_text": "What is the auxiliary space complexity of representing an undirected graph G = (V, E) using an Adjacency Matrix?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "O(|V| + |E|)"},
            {"id": "B", "text": "O(|V|^2)"},
            {"id": "C", "text": "O(|E|^2)"},
            {"id": "D", "text": "O(|V| * |E|)"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "An adjacency matrix allocates a 2D array of size |V| x |V| regardless of the number of edges |E|, yielding a strict space footprint of O(|V|^2).",
        "tags": ["Graph", "Adjacency Matrix", "Space Complexity"]
    },
    {
        "question_text": "Under uniform hashing and a load factor alpha < 1, what is the average-case time complexity of key lookup in a Hash Table?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "O(1)"},
            {"id": "B", "text": "O(log n)"},
            {"id": "C", "text": "O(n)"},
            {"id": "D", "text": "O(n^2)"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "Assuming a uniform hash function that disperses keys evenly across buckets, expected bucket chain length is O(1 + alpha) = O(1).",
        "tags": ["Hash Table", "Hashing", "Average Complexity"]
    },
    {
        "question_text": "What is the worst-case number of comparisons performed by Linear Search on an unsorted array of size n?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "1"},
            {"id": "B", "text": "log2(n)"},
            {"id": "C", "text": "n"},
            {"id": "D", "text": "n * (n - 1) / 2"}
        ],
        "correct_option_id": "C",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "When the target item is at the very last index or absent from the array, linear search must examine every single one of the n elements, performing exactly n comparisons.",
        "tags": ["Linear Search", "Arrays", "Basics"]
    },
    {
        "question_text": "What is the maximum height of a strictly balanced Binary Search Tree containing n nodes?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "O(1)"},
            {"id": "B", "text": "O(log n)"},
            {"id": "C", "text": "O(n)"},
            {"id": "D", "text": "O(n^2)"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "Strict self-balancing invariants (such as AVL trees bounding height by ~1.44 log2 n) guarantee that tree height remains O(log n), preventing degenerate linked-list degradation.",
        "tags": ["BST", "Trees", "Height Balance"]
    },
    {
        "question_text": "Which graph traversal strategy uses a FIFO Queue to discover all vertices at distance k before exploring vertices at distance k + 1?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Depth-First Search (DFS)"},
            {"id": "B", "text": "Breadth-First Search (BFS)"},
            {"id": "C", "text": "Topological Sort"},
            {"id": "D", "text": "Iterative Deepening DFS"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "Breadth-First Search (BFS) systematically sweeps outward level-by-level using a FIFO queue, guaranteeing shortest path detection on unweighted graphs.",
        "tags": ["BFS", "Graph Traversal", "Shortest Path"]
    },
    {
        "question_text": "What property defines a 'stable' sorting algorithm?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "It runs in O(n log n) worst-case time"},
            {"id": "B", "text": "It requires zero auxiliary memory (in-place)"},
            {"id": "C", "text": "It preserves the relative order of elements with equal keys"},
            {"id": "D", "text": "It never performs data swaps"}
        ],
        "correct_option_id": "C",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "Stability guarantees that if two items share identical key values (e.g. record A and record B where A.key == B.key and A appears before B in input), A will remain before B in the sorted output.",
        "tags": ["Sorting", "Stability", "Algorithms"]
    },
    {
        "question_text": "In a max-heap stored in an array with 1-based indexing, where are the children of a node at index i located?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "i + 1 and i + 2"},
            {"id": "B", "text": "2*i and 2*i + 1"},
            {"id": "C", "text": "i/2 and i/2 + 1"},
            {"id": "D", "text": "2*i - 1 and 2*i"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "In 1-based binary tree array representations, left_child(i) = 2*i, right_child(i) = 2*i + 1, and parent(i) = floor(i/2).",
        "tags": ["Heap", "Array Indexing", "Binary Trees"]
    },

    # MEDIUM (14)
    {
        "question_text": "In an AVL Tree, when a node has a balance factor of +2 and its left child has a balance factor of -1 (Left-Right / LR case), which rotation sequence restores balance?",
        "code_snippet": "      z (+2)\n     / \n    y (-1)  ==> Requires double rotation!\n     \\\n      x (0)",
        "options": [
            {"id": "A", "text": "A single Right Rotation at z"},
            {"id": "B", "text": "A single Left Rotation at y"},
            {"id": "C", "text": "A Left Rotation at y, followed by a Right Rotation at z"},
            {"id": "D", "text": "A Right Rotation at y, followed by a Left Rotation at z"}
        ],
        "correct_option_id": "C",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "The LR imbalance cannot be resolved by a single rotation. First, a Left Rotation at left-child y converts the tree into an LL (Left-Left) shape. Second, a Right Rotation at root z restores AVL balance in O(1) time.",
        "tags": ["AVL Trees", "Tree Rotations", "Self-Balancing"]
    },
    {
        "question_text": "Why does Dijkstra's algorithm fail to find the correct shortest path on graphs containing negative edge weights?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "It enters an infinite loop and crashes with stack overflow"},
            {"id": "B", "text": "Its greedy choice property assumes that once a vertex is settled, its shortest path cannot be further reduced"},
            {"id": "C", "text": "Priority queues cannot store negative numbers"},
            {"id": "D", "text": "It only works on undirected bipartite graphs"}
        ],
        "correct_option_id": "B",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Dijkstra relies on the invariant that distances in the min-priority queue are monotonically settled. A negative edge can allow a settled node's distance to decrease retrospectively, invalidating Dijkstra's greedy finalization.",
        "tags": ["Dijkstra", "Greedy", "Graph Theory", "Negative Weights"]
    },
    {
        "question_text": "In the 0/1 Knapsack problem with N items and weight capacity W, how can the dynamic programming space complexity be reduced from O(N * W) to O(W)?",
        "code_snippet": "for (int i = 0; i < N; i++) {\n    for (int w = W; w >= weight[i]; w--) {\n        dp[w] = max(dp[w], dp[w - weight[i]] + value[i]);\n    }\n}",
        "options": [
            {"id": "A", "text": "By iterating weight w in ascending order from 0 up to W"},
            {"id": "B", "text": "By iterating weight w in reverse order from W down to weight[i]"},
            {"id": "C", "text": "By sorting items by value-to-weight ratio"},
            {"id": "D", "text": "By computing fractional knapsack using a greedy heap"}
        ],
        "correct_option_id": "B",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Iterating backwards from W down to weight[i] ensures that dp[w - weight[i]] represents the value from the PREVIOUS item state (i-1), preventing any single item from being counted multiple times in the same step.",
        "tags": ["Dynamic Programming", "Knapsack", "Space Optimization"]
    },
    {
        "question_text": "What is the tight asymptotic time complexity of Merge Sort on an array of n items?",
        "code_snippet": "T(n) = 2*T(n/2) + O(n)",
        "options": [
            {"id": "A", "text": "O(n)"},
            {"id": "B", "text": "O(n log n)"},
            {"id": "C", "text": "O(n^2)"},
            {"id": "D", "text": "O(log n)"}
        ],
        "correct_option_id": "B",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "By Master Theorem Case 2: a=2, b=2, f(n)=O(n). log_b(a) = log2(2) = 1. Since f(n) = Theta(n^1), T(n) = Theta(n log n) in all best, average, and worst cases.",
        "tags": ["Merge Sort", "Master Theorem", "Divide and Conquer"]
    },
    {
        "question_text": "In Floyd's Cycle-Finding Algorithm (Tortoise and Hare) on a linked list, if slow moves 1 step and fast moves 2 steps, how is cycle existence proven?",
        "code_snippet": "ListNode *slow = head, *fast = head;\nwhile (fast && fast->next) {\n    slow = slow->next;\n    fast = fast->next->next;\n    if (slow == fast) return true; // Cycle detected\n}",
        "options": [
            {"id": "A", "text": "Fast reaches NULL in O(1) time"},
            {"id": "B", "text": "The relative distance between fast and slow decreases by 1 on each step inside the loop until they collide"},
            {"id": "C", "text": "Slow reaches the end before fast"},
            {"id": "D", "text": "The memory addresses of nodes wrap around to zero"}
        ],
        "correct_option_id": "B",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Once both pointers enter a cycle of length C, fast gains exactly 1 step on slow per iteration ((2 - 1) = 1 mod C). Thus, fast must catch slow in at most C steps without extra memory.",
        "tags": ["Linked List", "Two Pointers", "Cycle Detection"]
    },
    {
        "question_text": "What is the time complexity of the Floyd-Warshall algorithm for finding all-pairs shortest paths in a directed graph with V vertices?",
        "code_snippet": "for (int k = 0; k < V; k++)\n    for (int i = 0; i < V; i++)\n        for (int j = 0; j < V; j++)\n            dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]);",
        "options": [
            {"id": "A", "text": "O(V + E)"},
            {"id": "B", "text": "O(V * E)"},
            {"id": "C", "text": "O(V^3)"},
            {"id": "D", "text": "O(V^2 log V)"}
        ],
        "correct_option_id": "C",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Floyd-Warshall executes three strictly nested loops from 0 to V-1 over intermediate node k, source node i, and destination node j, leading to O(V^3) operations.",
        "tags": ["Floyd-Warshall", "Dynamic Programming", "All-Pairs Shortest Path"]
    },
    {
        "question_text": "In a Disjoint Set Union (DSU) data structure implementing both Union by Rank and Path Compression, what is the amortized time complexity per operation?",
        "code_snippet": "int find(int i) {\n    if (parent[i] == i) return i;\n    return parent[i] = find(parent[i]); // Path compression\n}",
        "options": [
            {"id": "A", "text": "O(1)"},
            {"id": "B", "text": "O(alpha(n)), where alpha is the inverse Ackermann function"},
            {"id": "C", "text": "O(log n)"},
            {"id": "D", "text": "O(n)"}
        ],
        "correct_option_id": "B",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Tarjan proved that combining union by rank/size with path compression bounds the amortized time per operation to O(alpha(n)), which is practically <= 4 for any physical input size.",
        "tags": ["DSU", "Disjoint Set", "Amortized Analysis"]
    },
    {
        "question_text": "How does Open Addressing with Quadratic Probing mitigate the primary clustering issue found in Linear Probing?",
        "code_snippet": "index = (hash(key) + c1 * i + c2 * i^2) % TABLE_SIZE;",
        "options": [
            {"id": "A", "text": "By using a second hash function to rehash colliding keys"},
            {"id": "B", "text": "By probing slots at quadratic offsets i^2 rather than consecutive linear steps i, breaking contiguous cluster blocks"},
            {"id": "C", "text": "By storing linked lists in each bucket"},
            {"id": "D", "text": "By dynamically doubling table size on every collision"}
        ],
        "correct_option_id": "B",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Linear probing suffers from primary clustering because occupied blocks grow longer and attract more collisions. Quadratic probing uses quadratic step increments (i^2), skipping over contiguous clusters.",
        "tags": ["Hashing", "Collision Resolution", "Quadratic Probing"]
    },
    {
        "question_text": "In Kahn's Algorithm for Topological Sorting of a Directed Acyclic Graph (DAG), which vertices are initially pushed onto the working queue?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Vertices with Out-Degree equal to 0"},
            {"id": "B", "text": "Vertices with In-Degree equal to 0"},
            {"id": "C", "text": "The vertex with the highest numerical key"},
            {"id": "D", "text": "Any arbitrary root vertex"}
        ],
        "correct_option_id": "B",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Kahn's algorithm begins by enqueueing all vertices with an in-degree of 0 (no prerequisite edges). As each vertex is removed from the queue, incoming edge counts of its neighbors are decremented.",
        "tags": ["Topological Sort", "DAG", "Graph Algorithms"]
    },
    {
        "question_text": "What is the recurrence relation for finding the Longest Common Subsequence (LCS) of strings X[0..m-1] and Y[0..n-1] when X[i-1] == Y[j-1]?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "LCS[i][j] = LCS[i-1][j-1] + 1"},
            {"id": "B", "text": "LCS[i][j] = max(LCS[i-1][j], LCS[i][j-1])"},
            {"id": "C", "text": "LCS[i][j] = LCS[i-1][j-1] * 2"},
            {"id": "D", "text": "LCS[i][j] = min(LCS[i-1][j], LCS[i][j-1]) + 1"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "When the current characters match (X[i-1] == Y[j-1]), this matching character extends the longest common subsequence of prefixes X[0..i-2] and Y[0..j-2] by exactly 1.",
        "tags": ["Dynamic Programming", "LCS", "Strings"]
    },
    {
        "question_text": "What is the height property of a Red-Black tree that bounds its maximum height to 2 * log2(n + 1)?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Every path from root to leaf has exactly the same number of red nodes"},
            {"id": "B", "text": "No two red nodes can appear consecutively, and every simple path from root to leaf contains identical black nodes"},
            {"id": "C", "text": "The tree cannot have more than 3 levels"},
            {"id": "D", "text": "All leaves must be colored red"}
        ],
        "correct_option_id": "B",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Since no two red nodes can be adjacent, red nodes must alternate with black nodes. This guarantees the longest path (alternating red-black) is at most twice the shortest path (all black), bounding height to 2 * log2(n + 1).",
        "tags": ["Red-Black Tree", "Invariants", "Trees"]
    },
    {
        "question_text": "When extracting the minimum element from a Binary Min-Heap of size n, what is the time complexity of the heapify-down operation?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "O(1)"},
            {"id": "B", "text": "O(log n)"},
            {"id": "C", "text": "O(n)"},
            {"id": "D", "text": "O(n log n)"}
        ],
        "correct_option_id": "B",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Extracting the min replaces the root with the last leaf element, then percolates down by swapping with the smaller child until heap order is restored. This traverses at most the tree height: O(log n).",
        "tags": ["Heap", "Heapify", "Priority Queue"]
    },
    {
        "question_text": "Which condition allows the Two-Pointer technique to solve the 'Two Sum' problem in O(n) time and O(1) extra space?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "The input array must already be sorted in non-decreasing order"},
            {"id": "B", "text": "The elements must all be positive integers"},
            {"id": "C", "text": "The array must contain an even number of elements"},
            {"id": "D", "text": "A hash table must be maintained alongside the pointers"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "In a sorted array, placing one pointer at start and one at end allows monotonic decisions: if sum < target, increment left pointer; if sum > target, decrement right pointer.",
        "tags": ["Two Pointers", "Array", "Optimization"]
    },
    {
        "question_text": "What is the worst-case time complexity of QuickSelect to find the k-th smallest element when using naive pivot selection?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "O(n) average, but O(n^2) worst case"},
            {"id": "B", "text": "O(log n) always"},
            {"id": "C", "text": "O(n log n) strictly"},
            {"id": "D", "text": "O(1)"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "QuickSelect exhibits average O(n) time via T(n) = T(n/2) + O(n). However, if an extreme pivot (e.g. smallest or largest element) is picked repeatedly, it degrades to T(n) = T(n-1) + O(n) = O(n^2).",
        "tags": ["QuickSelect", "Pivot", "Order Statistics"]
    },

    # HARD (7)
    {
        "question_text": "In a Fenwick Tree (Binary Indexed Tree / BIT), how does the update operation index += (index & -index) compute parent responsibility?",
        "code_snippet": "void update(int index, int val) {\n    for (; index <= n; index += (index & -index))\n        tree[index] += val;\n}",
        "options": [
            {"id": "A", "text": "It isolates the least significant set bit (LSB) and adds it to traverse upward to all covering ranges"},
            {"id": "B", "text": "It multiplies the index by 2 to jump to the right child"},
            {"id": "C", "text": "It calculates the square root of n"},
            {"id": "D", "text": "It computes the bitwise NOT to reverse the traversal direction"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "(index & -index) extracts the lowest set bit (2's complement trick). Adding this value advances the index to the next responsible ancestor range containing the updated position, executing in O(log n).",
        "tags": ["Fenwick Tree", "Binary Indexed Tree", "Bit Manipulation", "Advanced Data Structures"]
    },
    {
        "question_text": "In a Segment Tree with Lazy Propagation, what is the primary purpose of maintaining a separate 'lazy' array?",
        "code_snippet": "void updateRange(int node, int start, int end, int l, int r, int val) {\n    if (lazy[node] != 0) {\n        tree[node] += (end - start + 1) * lazy[node];\n        if (start != end) {\n            lazy[2*node] += lazy[node];\n            lazy[2*node+1] += lazy[node];\n        }\n        lazy[node] = 0;\n    }\n    // ...\n}",
        "options": [
            {"id": "A", "text": "To defer updating child subtrees until those nodes are explicitly queried, keeping range update time at O(log n)"},
            {"id": "B", "text": "To double the tree storage capacity dynamically"},
            {"id": "C", "text": "To convert the segment tree into a binary search tree"},
            {"id": "D", "text": "To calculate moving averages in O(1) time"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "Without lazy propagation, updating a range [L, R] takes O(n) because all descendant leaf nodes must be modified. Lazy propagation postpones child updates until accessed, maintaining O(log n) range operations.",
        "tags": ["Segment Tree", "Lazy Propagation", "Range Queries"]
    },
    {
        "question_text": "How does the Bellman-Ford algorithm reliably detect the existence of a negative-weight cycle reachable from the source vertex?",
        "code_snippet": "for (int i = 1; i <= V - 1; i++) {\n    for (auto edge : edges) relax(edge);\n}\nfor (auto edge : edges) {\n    if (dist[edge.u] + edge.weight < dist[edge.v]) {\n        // Negative cycle detected!\n    }\n}",
        "options": [
            {"id": "A", "text": "By checking if any vertex distance remains infinity after iteration 1"},
            {"id": "B", "text": "By performing a V-th relaxation pass; if any edge can still be relaxed after V-1 passes, a negative cycle exists"},
            {"id": "C", "text": "By computing the determinant of the adjacency matrix"},
            {"id": "D", "text": "By using a depth-first search cycle detector on the original graph"}
        ],
        "correct_option_id": "B",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "A shortest path in a graph without negative cycles contains at most V-1 edges. If distance can still decrease on the V-th relaxation attempt, an indefinitely decreasing negative cycle must be present.",
        "tags": ["Bellman-Ford", "Negative Cycle", "Graph Algorithms"]
    },
    {
        "question_text": "In Tarjan's Strongly Connected Components (SCC) algorithm, what does the 'low-link' value low[u] represent?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "The out-degree of vertex u"},
            {"id": "B", "text": "The smallest discovery time reachable from u through its DFS subtree including at most one back-edge to a node on the stack"},
            {"id": "C", "text": "The length of the shortest path from the source node to u"},
            {"id": "D", "text": "The number of child nodes under u in the spanning tree"}
        ],
        "correct_option_id": "B",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "low[u] tracks the earliest visited ancestor reachable from u via tree edges and cross/back-edges still on the active recursion stack. If disc[u] == low[u], u is the root of an SCC.",
        "tags": ["Tarjan", "SCC", "DFS", "Graph Theory"]
    },
    {
        "question_text": "In the Knuth-Morris-Pratt (KMP) string matching algorithm, what does the prefix function value pi[i] store for pattern P[0..m-1]?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "The hash of substring P[0..i]"},
            {"id": "B", "text": "The length of the longest proper prefix of P[0..i] that is also a suffix of P[0..i]"},
            {"id": "C", "text": "The index of the first mismatching character in the text"},
            {"id": "D", "text": "The number of distinct characters in P[0..i]"}
        ],
        "correct_option_id": "B",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "The pi table defines the longest proper prefix of P[0..i] that is also a suffix of P[0..i]. On mismatch at P[j], the search pointer falls back to pi[j-1] without re-examining matched text characters, yielding O(n + m) time.",
        "tags": ["KMP", "String Matching", "Prefix Function"]
    },
    {
        "question_text": "For the A* search algorithm to guarantee finding the optimal shortest path on graphs, what mathematical property must its heuristic function h(n) satisfy?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "h(n) must equal 0 for all nodes"},
            {"id": "B", "text": "h(n) must be admissible (never overestimate true cost to goal) and consistent/monotonic (h(n) <= c(n, p) + h(p))"},
            {"id": "C", "text": "h(n) must strictly overestimate distance by at least 10%"},
            {"id": "D", "text": "h(n) must be calculated using Euclidean distance squared"}
        ],
        "correct_option_id": "B",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "Admissibility (h(n) <= h*(n)) guarantees optimality in tree search. Consistency (triangle inequality: h(u) <= cost(u, v) + h(v)) guarantees optimality in graph search without re-opening closed nodes.",
        "tags": ["A* Search", "Heuristics", "Graph Search"]
    },
    {
        "question_text": "In the Matrix Chain Multiplication dynamic programming problem with matrices A1..An of dimensions p0 x p1..pn-1 x pn, what is the state recurrence for m[i, j]?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "m[i, j] = min_{i <= k < j} (m[i, k] + m[k+1, j] + p_{i-1} * p_k * p_j)"},
            {"id": "B", "text": "m[i, j] = m[i, j-1] + p_i * p_j"},
            {"id": "C", "text": "m[i, j] = max_{i <= k < j} (m[i, k] * m[k+1, j])"},
            {"id": "D", "text": "m[i, j] = m[i+1, j-1] + p_0 * p_n"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "To multiply chain Ai..Aj, we split at index k. The cost is the scalar multiplications to evaluate Ai..k, plus k+1..j, plus multiplying the two resulting matrices (dimensions p_{i-1} * p_k * p_j).",
        "tags": ["Matrix Chain Multiplication", "Dynamic Programming", "Interval DP"]
    },

    # BOSS (2)
    {
        "question_text": "BOSS BATTLE // THE CITADEL COLOSSUS:\nIn a Treap (Tree + Heap) with randomized priorities, how are the split(T, k) and merge(L, R) operations implemented to guarantee O(log n) expected time for all dynamic set operations?",
        "code_snippet": "void split(Node* t, Key k, Node*& l, Node*& r) {\n    if (!t) l = r = nullptr;\n    else if (k < t->key)\n        split(t->left, k, l, t->left), r = t;\n    else\n        split(t->right, k, t->right, r), l = t;\n}",
        "options": [
            {"id": "A", "text": "By maintaining BST order on keys and max-heap order on assigned priorities, split partitions tree T into L (keys <= k) and R (keys > k) by recursive descent along the search path"},
            {"id": "B", "text": "By converting all nodes into a doubly linked list and applying quicksort on priorities"},
            {"id": "C", "text": "By calculating AVL height balances on both subtrees simultaneously"},
            {"id": "D", "text": "By using splay operations to bring the median priority node to the root"}
        ],
        "correct_option_id": "A",
        "difficulty": "Boss",
        "xp_reward": 500,
        "time_limit_seconds": 90,
        "explanation": "A Treap maintains dual invariants: BST order on keys and Heap order on uniformly random priorities. The split(T, k) operation cuts T into two treaps L and R along the key boundary in O(tree height) = O(log n) expected time, enabling lock-free and rope-like dynamic array operations.",
        "tags": ["Treap", "Randomized Data Structures", "Boss Challenge", "Binary Trees"]
    },
    {
        "question_text": "BOSS BATTLE // THE DUAL-ROTATE EMPEROR:\nIn a Red-Black Tree insertion, when node z is inserted as a right child of a left child (LR case) and z's uncle is BLACK, which combined structural transformations restore all Red-Black invariants?",
        "code_snippet": "        grandparent (B)\n           /\n       parent (R)\n           \\\n            z (R)  [Uncle is BLACK]",
        "options": [
            {"id": "A", "text": "Left-rotate parent, right-rotate grandparent, then swap colors of parent and grandparent"},
            {"id": "B", "text": "Recolor uncle and parent to black, recolor grandparent to red, without any tree rotations"},
            {"id": "C", "text": "Perform a single right rotation at grandparent, then recolor all leaf nodes"},
            {"id": "D", "text": "Delete node z and re-insert it as a root node"}
        ],
        "correct_option_id": "A",
        "difficulty": "Boss",
        "xp_reward": 500,
        "time_limit_seconds": 90,
        "explanation": "When uncle is black in an LR violation: 1) Left rotation at parent converts it into an LL (Left-Left) shape. 2) Right rotation at grandparent lifts the new node to root position. 3) Swapping original colors (new root becomes Black, former grandparent becomes Red) restores black-height and no-consecutive-red invariants in O(1) rotation time.",
        "tags": ["Red-Black Tree", "Tree Rotations", "Boss Challenge", "Invariants"]
    }
]
