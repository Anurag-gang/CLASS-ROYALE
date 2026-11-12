# Database Management Systems (The Vault of Relational Lore) - 35 Questions
# 12 Easy, 14 Medium, 7 Hard, 2 Boss

DBMS_QUESTIONS = [
    # EASY (12)
    {
        "question_text": "What fundamental constraint guarantees that every tuple in a relational database table can be uniquely identified and cannot contain NULL values?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Foreign Key constraint"},
            {"id": "B", "text": "Primary Key constraint"},
            {"id": "C", "text": "Check constraint"},
            {"id": "D", "text": "Default constraint"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "A Primary Key enforces entity integrity: each record must have a distinct identifier, and no column in the primary key can be assigned NULL.",
        "tags": ["Primary Key", "Relational Model", "Constraints"]
    },
    {
        "question_text": "Which ACID property guarantees that all database modifications within a transaction are completed successfully or entirely rolled back if an error occurs?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Atomicity"},
            {"id": "B", "text": "Consistency"},
            {"id": "C", "text": "Isolation"},
            {"id": "D", "text": "Durability"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "Atomicity (the 'All-or-Nothing' rule) guarantees that if any statement inside a transaction aborts or fails, the entire transaction is rolled back as if it never ran.",
        "tags": ["ACID", "Transactions", "Atomicity"]
    },
    {
        "question_text": "What is the primary objective of First Normal Form (1NF) in relational schema design?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Removing partial functional dependencies"},
            {"id": "B", "text": "Ensuring every column contains only atomic (indivisible) values and eliminating repeating groups"},
            {"id": "C", "text": "Removing transitive dependencies"},
            {"id": "D", "text": "Enforcing foreign key cascade constraints"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "1NF requires that all column values are atomic (e.g. no comma-separated lists or nested arrays in a single cell) and every row has unique non-repeating entries.",
        "tags": ["Normalization", "1NF", "Schema Design"]
    },
    {
        "question_text": "Which SQL statement is classified as a Data Definition Language (DDL) command?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "SELECT"},
            {"id": "B", "text": "INSERT"},
            {"id": "C", "text": "CREATE TABLE"},
            {"id": "D", "text": "UPDATE"}
        ],
        "correct_option_id": "C",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "DDL commands define and modify the schema structure of the database (CREATE, ALTER, DROP, TRUNCATE), whereas SELECT, INSERT, UPDATE, and DELETE are DML (Data Manipulation Language).",
        "tags": ["SQL", "DDL", "DML"]
    },
    {
        "question_text": "What is the difference between an INNER JOIN and a LEFT OUTER JOIN in SQL?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "INNER JOIN returns only matching rows from both tables; LEFT OUTER JOIN returns all rows from the left table plus matched rows from the right table"},
            {"id": "B", "text": "INNER JOIN is faster because it deletes non-matching rows from disk"},
            {"id": "C", "text": "LEFT OUTER JOIN returns only NULL rows"},
            {"id": "D", "text": "There is no functional difference between them"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "INNER JOIN discards rows from either table that lack a corresponding match on the join predicate. LEFT OUTER JOIN retains every record from the left table, populating right-side columns with NULL if unmatched.",
        "tags": ["SQL", "Joins", "Relational Algebra"]
    },
    {
        "question_text": "How does a Clustered Index affect the physical storage of rows in a database table?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "It stores index keys in a separate file without altering table order"},
            {"id": "B", "text": "It determines the physical sort order of the actual data rows on disk, allowing only one clustered index per table"},
            {"id": "C", "text": "It compresses the table into zip format"},
            {"id": "D", "text": "It duplicates the entire table into RAM memory"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "Because physical disk blocks can only be ordered in one sequence, a table can possess exactly one clustered index, whose leaf nodes contain the actual physical row records.",
        "tags": ["Indexing", "Clustered Index", "Storage Engine"]
    },
    {
        "question_text": "What does the SQL command TRUNCATE TABLE do compared to DELETE FROM table?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "TRUNCATE deletes the table schema definition itself"},
            {"id": "B", "text": "TRUNCATE deallocates data pages directly as a DDL operation without logging individual row deletions, making it much faster"},
            {"id": "C", "text": "TRUNCATE only works on temporary tables"},
            {"id": "D", "text": "TRUNCATE allows WHERE clauses for selective deletion"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "DELETE logs row-by-row deletions and fires triggers. TRUNCATE is a DDL command that deallocates data extents directly, resets auto-increment sequences, and cannot accept a WHERE clause.",
        "tags": ["SQL", "Truncate vs Delete", "Performance"]
    },
    {
        "question_text": "How do standard SQL aggregate functions (such as COUNT(column_name) or AVG(column_name)) treat NULL values?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "They convert NULLs to 0 and include them in the calculation"},
            {"id": "B", "text": "They ignore (skip) NULL values entirely during aggregation (except COUNT(*))"},
            {"id": "C", "text": "They return NULL as the aggregate output immediately"},
            {"id": "D", "text": "They raise a runtime SQL syntax exception"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "Aggregate functions on specific columns (COUNT(x), SUM(x), AVG(x)) filter out NULL values. In contrast, COUNT(*) counts total row occurrences regardless of nullability.",
        "tags": ["SQL", "Aggregate Functions", "Null Handling"]
    },
    {
        "question_text": "What is a Foreign Key in relational database terminology?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "An encryption key used to access remote databases"},
            {"id": "B", "text": "A field or collection of fields in one table that uniquely identifies a row in another table (referential integrity)"},
            {"id": "C", "text": "A key that cannot be indexed"},
            {"id": "D", "text": "A primary key composed of more than three columns"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "Foreign keys enforce referential integrity between tables, ensuring that relationships between records remain valid and preventing orphan child rows.",
        "tags": ["Foreign Key", "Referential Integrity", "Relational Schema"]
    },
    {
        "question_text": "What is a Database View in SQL?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "A physical backup file saved on secondary storage"},
            {"id": "B", "text": "A virtual table defined by an underlying stored SQL query that computes results on demand"},
            {"id": "C", "text": "A graphical monitor showing active server connections"},
            {"id": "D", "text": "A materialized index cached exclusively in CPU L1 cache"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "A standard View does not store physical data rows; it represents a saved query definition that the database engine evaluates dynamically when queried.",
        "tags": ["Views", "Virtual Tables", "SQL"]
    },
    {
        "question_text": "Which clause in SQL is used to filter groups produced by a GROUP BY clause?",
        "code_snippet": "SELECT department, COUNT(*) FROM employees GROUP BY department HAVING COUNT(*) > 5;",
        "options": [
            {"id": "A", "text": "WHERE"},
            {"id": "B", "text": "HAVING"},
            {"id": "C", "text": "ORDER BY"},
            {"id": "D", "text": "FILTER"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "WHERE filters individual rows BEFORE aggregation occurs; HAVING filters aggregated groups AFTER the GROUP BY aggregation is computed.",
        "tags": ["SQL", "HAVING", "GROUP BY"]
    },
    {
        "question_text": "What is a Candidate Key in relational database theory?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Any column that contains numerical values"},
            {"id": "B", "text": "A minimal superkey capable of uniquely identifying any record in a relation without redundant attributes"},
            {"id": "C", "text": "The key that has the lowest alphabetical character count"},
            {"id": "D", "text": "A temporary foreign key used during data migration"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "A candidate key is a minimal superkey: it possesses uniqueness and minimality (removing any attribute from it destroys its unique identification capability). One candidate key is chosen as the primary key.",
        "tags": ["Candidate Key", "Keys", "Relational Theory"]
    },

    # MEDIUM (14)
    {
        "question_text": "A relational table R(A, B, C, D) has primary key (A, B) and functional dependency B -> C. Which normal form is violated?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "1NF"},
            {"id": "B", "text": "2NF (Second Normal Form)"},
            {"id": "C", "text": "3NF"},
            {"id": "D", "text": "BCNF"}
        ],
        "correct_option_id": "B",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "2NF mandates that all non-prime attributes must be fully functionally dependent on the entire composite primary key. Since C depends solely on subset attribute B (a partial dependency), the relation violates 2NF.",
        "tags": ["Normalization", "2NF", "Functional Dependencies"]
    },
    {
        "question_text": "Why do relational databases prefer B+ Trees over standard Binary Search Trees or B-Trees for disk-backed indexing?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "B+ Trees have fewer nodes than binary trees"},
            {"id": "B", "text": "All data pointers are stored exclusively at leaf nodes, leaf nodes are linked sequentially for rapid range scans, and internal nodes store only routing keys for high fan-out"},
            {"id": "C", "text": "B+ Trees store records in reverse hash order"},
            {"id": "D", "text": "B+ Trees do not require disk I/O operations"}
        ],
        "correct_option_id": "B",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "High fan-out in B+ Tree internal nodes reduces tree depth to 3-4 levels for millions of records. Furthermore, double-linked leaf nodes enable O(1) page traversals during range queries (BETWEEN x AND y).",
        "tags": ["B+ Tree", "Indexing", "Range Queries", "Storage"]
    },
    {
        "question_text": "Under the ANSI SQL standard, what concurrency anomaly is prevented by the REPEATABLE READ isolation level that can still occur in READ COMMITTED?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Dirty Read (reading uncommitted data)"},
            {"id": "B", "text": "Non-Repeatable Read (Fuzzy Read)"},
            {"id": "C", "text": "Transaction Deadlock"},
            {"id": "D", "text": "Hardware disk failure"}
        ],
        "correct_option_id": "B",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "In READ COMMITTED, reading a row, having another transaction update and commit it, and reading it again returns altered data (Non-Repeatable Read). REPEATABLE READ locks or snapshots read rows, ensuring identical values across queries.",
        "tags": ["Isolation Levels", "ACID", "Concurrency Control"]
    },
    {
        "question_text": "In Two-Phase Locking (2PL), what invariant marks the boundary between the Growing Phase and the Shrinking Phase?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Once a transaction releases any single lock, it enters the shrinking phase and is strictly forbidden from acquiring any new locks"},
            {"id": "B", "text": "Locks are acquired only after all updates commit"},
            {"id": "C", "text": "All read locks are converted to shared locks"},
            {"id": "D", "text": "The transaction must restart from the beginning"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "2PL guarantees serializability by segregating execution: in the Growing Phase, locks may be obtained but not released; once the lock point is reached and ANY lock is released, no new locks can ever be acquired.",
        "tags": ["2PL", "Two-Phase Locking", "Serializability"]
    },
    {
        "question_text": "What is the Leftmost Prefix Rule when executing queries against a composite index (col_a, col_b, col_c)?",
        "code_snippet": "CREATE INDEX idx_abc ON users (col_a, col_b, col_c);",
        "options": [
            {"id": "A", "text": "The index can only be used if all three columns are in the WHERE clause"},
            {"id": "B", "text": "The query optimizer can utilize the index for conditions on (col_a), (col_a, col_b), or (col_a, col_b, col_c), but NOT on (col_b) or (col_c) alone"},
            {"id": "C", "text": "The columns must be ordered alphabetically in the SELECT list"},
            {"id": "D", "text": "The index is sorted from right to left"}
        ],
        "correct_option_id": "B",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Composite B-tree indexes sort keys lexicographically starting from the leftmost column. Without a condition constraining col_a, the B-tree cannot be navigated hierarchically for col_b alone.",
        "tags": ["Composite Index", "Query Optimization", "B+ Tree"]
    },
    {
        "question_text": "How does Write-Ahead Logging (WAL) uphold durability and crash recovery in database engines?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "It writes log records to non-volatile disk BEFORE corresponding dirty data pages are flushed from the buffer pool to disk"},
            {"id": "B", "text": "It mirrors the entire database to a cloud replica before executing queries"},
            {"id": "C", "text": "It delays disk writes until system shutdown"},
            {"id": "D", "text": "It eliminates the need for RAM caching"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "WAL guarantees that changes are sequentially appended to a persistent redo log before the data page is written. On crash, the engine replays REDO logs to reconstruct committed states and applies UNDO logs for uncommitted ones.",
        "tags": ["WAL", "Crash Recovery", "Durability", "Storage"]
    },
    {
        "question_text": "A relation is in Third Normal Form (3NF) if for every non-trivial functional dependency X -> Y, which condition holds?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "X must be an index and Y must be an integer"},
            {"id": "B", "text": "Either X is a superkey, or Y is a prime attribute (part of a candidate key)"},
            {"id": "C", "text": "Y must be a foreign key referencing an external table"},
            {"id": "D", "text": "X and Y must contain identical numbers of columns"}
        ],
        "correct_option_id": "B",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "3NF eliminates transitive dependencies. In BCNF, X must strictly be a superkey; 3NF allows the relaxation that Y may be a prime attribute (part of some candidate key), which preserves dependencies.",
        "tags": ["3NF", "Normalization", "Functional Dependencies"]
    },
    {
        "question_text": "In deadlock prevention, what distinguishes the Wait-Die scheme from the Wound-Wait scheme based on transaction timestamps?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Wait-Die is non-preemptive (an older transaction waits for a younger one, but a younger transaction dies); Wound-Wait is preemptive (an older transaction wounds/aborts a younger one)"},
            {"id": "B", "text": "Wait-Die only works in distributed databases"},
            {"id": "C", "text": "Wound-Wait allows transactions to wait forever without timeouts"},
            {"id": "D", "text": "Both schemes immediately abort older transactions on conflict"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "In Wait-Die, if Ti (older) requests a lock held by Tj (younger), Ti is allowed to wait; if Ti is younger, it dies. In Wound-Wait, if Ti is older, it preempts ('wounds') Tj, forcing Tj to abort and rollback.",
        "tags": ["Deadlock", "Concurrency", "Timestamps"]
    },
    {
        "question_text": "What performance problem occurs when executing a Correlated Subquery over a large table compared to an equivalent JOIN?",
        "code_snippet": "SELECT e1.name, e1.salary FROM employees e1 \nWHERE e1.salary > (SELECT AVG(e2.salary) FROM employees e2 WHERE e2.dept_id = e1.dept_id);",
        "options": [
            {"id": "A", "text": "The correlated subquery is re-evaluated for every single candidate row in the outer query, leading to O(N^2) quadratic behavior without query unnesting"},
            {"id": "B", "text": "The database crashes due to memory overflow"},
            {"id": "C", "text": "The query fails with syntax error"},
            {"id": "D", "text": "It locks the entire database table in exclusive mode"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Because the inner subquery references outer alias e1.dept_id, naive execution runs the subquery for every outer row. Modern query optimizers attempt to unnest this into a Hash Join or Window Function (AVG() OVER (PARTITION BY)).",
        "tags": ["SQL", "Subqueries", "Optimization"]
    },
    {
        "question_text": "What is the function of the ARIES recovery algorithm's Analysis pass during crash recovery?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "It rolls back all transactions immediately"},
            {"id": "B", "text": "It scans the log forward from the most recent checkpoint to reconstruct the active transaction table and dirty page table at the time of crash"},
            {"id": "C", "text": "It checks disk bad sectors"},
            {"id": "D", "text": "It writes new checkpoint records to disk"}
        ],
        "correct_option_id": "B",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "ARIES operates in three passes: 1) Analysis pass reconstructs the state of the system at crash time; 2) REDO pass repeats history to restore the database to crash moment; 3) UNDO pass rolls back active transactions.",
        "tags": ["ARIES", "Recovery", "Transactions"]
    },
    {
        "question_text": "Why does Boyce-Codd Normal Form (BCNF) strictly disallow functional dependencies where X -> Y if X is not a superkey?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Because it causes table creation to fail"},
            {"id": "B", "text": "To eliminate all redundancy resulting from functional dependencies, even when Y is a prime attribute"},
            {"id": "C", "text": "Because BCNF tables can only have one column"},
            {"id": "D", "text": "To guarantee that foreign keys are disabled"}
        ],
        "correct_option_id": "B",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "In 3NF, X -> Y is allowed if Y is prime. BCNF removes this exception: every non-trivial determinant X MUST be a superkey, completely eradicating update and deletion anomalies.",
        "tags": ["BCNF", "Normalization", "Relational Theory"]
    },
    {
        "question_text": "What is the difference between Optimistic Concurrency Control (OCC) and Pessimistic Concurrency Control (PCC)?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "OCC assumes conflicts are rare, executing transactions without locking and validating conflicts at commit time; PCC locks data up-front to prevent concurrent conflicts"},
            {"id": "B", "text": "OCC does not support ACID guarantees"},
            {"id": "C", "text": "PCC is only used in NoSQL databases"},
            {"id": "D", "text": "OCC locks the entire table during read operations"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "PCC uses shared and exclusive locks (2PL), preventing conflicts by blocking other transactions. OCC proceeds through Read, Validate, and Write phases without locks, aborting and retrying only if conflict is detected.",
        "tags": ["Concurrency", "OCC vs PCC", "Transactions"]
    },
    {
        "question_text": "In a SQL database using Multi-Version Concurrency Control (MVCC), how do read queries achieve lock-free non-blocking operation?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "By executing against an in-memory replica exclusively"},
            {"id": "B", "text": "By reading older row versions (snapshots) visible to the transaction timestamp without waiting for write locks to release"},
            {"id": "C", "text": "By bypassing foreign keys and transaction logs"},
            {"id": "D", "text": "By converting all write queries to background jobs"}
        ],
        "correct_option_id": "B",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Under MVCC (Postgres, InnoDB), writers create new row versions (xmin/xmax or rollback segments) rather than overwriting in-place. Readers look at a consistent snapshot, meaning 'readers never block writers, and writers never block readers'.",
        "tags": ["MVCC", "Snapshot Isolation", "Lock-Free"]
    },
    {
        "question_text": "What happens when an index has low selectivity (e.g. a column with only 2 distinct values across 1,000,000 rows)?",
        "code_snippet": "CREATE INDEX idx_gender ON users (gender);",
        "options": [
            {"id": "A", "text": "The index accelerates queries by 50%"},
            {"id": "B", "text": "The query optimizer will likely reject the index in favor of a sequential Full Table Scan, because random disk I/O from index lookups costs more than sequential reading"},
            {"id": "C", "text": "The database returns an error on index creation"},
            {"id": "D", "text": "The index automatically converts into a hash table"}
        ],
        "correct_option_id": "B",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Selectivity is the ratio of distinct values to total rows. If an index matches 50% of the table, random page fetches via the index are far slower than a sequential scan reading multiple blocks at once.",
        "tags": ["Index Selectivity", "Query Optimizer", "Performance"]
    },

    # HARD (7)
    {
        "question_text": "Under Snapshot Isolation in MVCC databases, what is the Write Skew anomaly that violates strict serializability?",
        "code_snippet": "-- Invariant: balance_a + balance_b >= 0\n-- T1 reads a ($100) and b ($100), withdraws $150 from a\n-- T2 concurrently reads a ($100) and b ($100), withdraws $150 from b\n-- Both commit successfully under Snapshot Isolation!",
        "options": [
            {"id": "A", "text": "A dirty read where uncommitted changes are displayed"},
            {"id": "B", "text": "Two concurrent transactions read overlapping data sets, make disjoint modifications based on stale read assumptions, and both commit, violating a global business invariant"},
            {"id": "C", "text": "An unrecoverable crash where log records are written out of order"},
            {"id": "D", "text": "A deadlock between primary key indices"}
        ],
        "correct_option_id": "B",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "Snapshot Isolation checks for write-write conflicts on the SAME row. In Write Skew, T1 modifies row A and T2 modifies row B. Neither overwrites the other's written row, yet together they violate a multi-row integrity constraint.",
        "tags": ["Snapshot Isolation", "Write Skew", "Serializability", "MVCC"]
    },
    {
        "question_text": "How does a B+ Tree maintain structural balance and invariant compliance when an insertion causes a leaf node to exceed maximum capacity M?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "The node splits into two nodes of ceil(M/2) keys each, and a COPY of the middle key is pushed up to the parent node while remaining in the leaf"},
            {"id": "B", "text": "The middle key is deleted from the tree entirely"},
            {"id": "C", "text": "The entire tree is recreated as an AVL tree"},
            {"id": "D", "text": "The node is replaced by a hash bucket linked list"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "In B+ trees, all data records must remain in the leaf level. Therefore, when a leaf splits, the split key is COPIED to the parent as a routing separator while also staying in the right leaf child. In internal node splits, the middle key is MOVED up.",
        "tags": ["B+ Tree", "Node Splitting", "Storage Engine"]
    },
    {
        "question_text": "In Strict Two-Phase Locking (Strict 2PL), why must all exclusive (X) locks be held until the very end of the transaction (Commit or Abort)?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "To prevent cascading aborts and guarantee recoverable schedules"},
            {"id": "B", "text": "To prevent other transactions from reading the database schema"},
            {"id": "C", "text": "To reduce lock memory consumption in the lock manager"},
            {"id": "D", "text": "Because SQLite requires it"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "If T1 updates an item, releases its exclusive lock early, and then aborts, any transaction T2 that read T1's modified value must also abort (cascading abort). Strict 2PL holds exclusive locks until commit, guaranteeing strict schedules.",
        "tags": ["Strict 2PL", "Cascading Aborts", "Concurrency Control"]
    },
    {
        "question_text": "Why do Log-Structured Merge-trees (LSM Trees, like RocksDB/Cassandra) provide substantially higher write throughput than B+ Trees on NVMe/SSD storage?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "LSM trees bypass secondary storage and write solely to network sockets"},
            {"id": "B", "text": "LSM trees convert random in-place page writes into sequential appends in an in-memory MemTable and append-only commit log, deferring sorted disk writes to background compaction"},
            {"id": "C", "text": "LSM trees eliminate read operations entirely"},
            {"id": "D", "text": "LSM trees do not support indices"}
        ],
        "correct_option_id": "B",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "B+ trees require in-place random writes to disk pages (high write amplification and random I/O). LSM trees write sequentially to an append log and memory buffer (MemTable), later flushing immutable SSTables sequentially to disk.",
        "tags": ["LSM Tree", "Storage Engines", "Write Amplification", "B+ Tree"]
    },
    {
        "question_text": "In relational query processing, when is a Hash Join preferred by the cost-based query optimizer over a Sort-Merge Join?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "When the join condition involves inequalities (e.g. t1.val > t2.val)"},
            {"id": "B", "text": "When evaluating an equi-join on large unsorted tables where the smaller table fits entirely in the working memory (hash table buffer)"},
            {"id": "C", "text": "When both tables are already indexed and sorted on the join key"},
            {"id": "D", "text": "Only when the tables contain fewer than 10 rows"}
        ],
        "correct_option_id": "B",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "Hash Join builds an in-memory hash table on the smaller relation, then probes it in a single pass of the larger relation (O(M + N)). Sort-Merge Join requires both inputs to be sorted (O(M log M + N log N)), making it preferred only when inputs are already sorted.",
        "tags": ["Hash Join", "Sort-Merge Join", "Query Optimizer"]
    },
    {
        "question_text": "In distributed database systems using Two-Phase Commit (2PC), what critical vulnerability exists if the Coordinator node crashes after participants vote 'YES'?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "The entire database is corrupted and must be restored from tape backup"},
            {"id": "B", "text": "Participants become blocked (in an uncertain state) holding locks indefinitely, unable to unilaterally commit or abort until the coordinator recovers"},
            {"id": "C", "text": "All participants automatically abort within 1 millisecond"},
            {"id": "D", "text": "The network switches to UDP mode"}
        ],
        "correct_option_id": "B",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "2PC is a blocking protocol. If participants have voted 'YES' in Phase 1 and the coordinator dies before broadcasting COMMIT/ABORT in Phase 2, participants cannot determine the outcome without risking inconsistency, causing lock blocking.",
        "tags": ["2PC", "Distributed Transactions", "Two-Phase Commit"]
    },
    {
        "question_text": "What test determines whether a schema decomposition of relation R into (R1, R2) with functional dependencies F is a Lossless-Join Decomposition?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "R1 union R2 must contain all foreign keys"},
            {"id": "B", "text": "The common attributes (R1 intersect R2) must form a superkey of either R1 or R2 (i.e. (R1 intersect R2) -> R1 or (R1 intersect R2) -> R2 in F+)"},
            {"id": "C", "text": "R1 and R2 must have an equal number of columns"},
            {"id": "D", "text": "The Cartesian product of R1 and R2 must equal R"}
        ],
        "correct_option_id": "B",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "A decomposition is lossless if and only if the natural join of decomposed relations reproduces the original relation without spurious tuples. This holds if and only if R1 intersect R2 is a superkey of at least one of the decomposed relations.",
        "tags": ["Lossless Join", "Normalization", "Relational Theory"]
    },

    # BOSS (2)
    {
        "question_text": "BOSS BATTLE // THE SERIALIZABILITY LEVIATHAN:\nIn a concurrent schedule of transactions, how is Conflict Serializability formally proven using a Serialization Graph (Precedence Graph)?",
        "code_snippet": "Schedule S: r1(x) -> w2(x) -> r1(y) -> w3(y) -> c1 -> c2 -> c3",
        "options": [
            {"id": "A", "text": "By drawing directed edges Ti -> Tj for any conflicting operations where Ti executes before Tj; the schedule is conflict serializable if and only if the precedence graph contains NO directed cycles"},
            {"id": "B", "text": "By verifying that all transactions have identical commit timestamps"},
            {"id": "C", "text": "By counting total read operations and confirming they exceed write operations"},
            {"id": "D", "text": "By checking that all transactions modify distinct tables"}
        ],
        "correct_option_id": "A",
        "difficulty": "Boss",
        "xp_reward": 500,
        "time_limit_seconds": 90,
        "explanation": "Two operations conflict if they belong to different transactions, access the same data item, and at least one is a write. An edge Ti -> Tj means Ti must precede Tj. If the precedence graph is acyclic, a topological sort gives an equivalent serial schedule.",
        "tags": ["Conflict Serializability", "Precedence Graph", "Transactions", "Boss Challenge"]
    },
    {
        "question_text": "BOSS BATTLE // THE ACID VAULT OVERLORD:\nUnder PostgreSQL's Serializable Snapshot Isolation (SSI), how does the engine detect and prevent anomalies like Write Skew without using pessimistic row locks?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "By tracking SIREAD locks (predicate locks in memory) to construct dangerous structures in the serialization dependency graph, aborting transactions when two consecutive rw-antidependency edges form a cycle"},
            {"id": "B", "text": "By converting every serializable transaction into single-threaded execution on the primary CPU core"},
            {"id": "C", "text": "By locking the entire database in exclusive mode during every read query"},
            {"id": "D", "text": "By rejecting all transactions that modify more than one table simultaneously"}
        ],
        "correct_option_id": "A",
        "difficulty": "Boss",
        "xp_reward": 500,
        "time_limit_seconds": 90,
        "explanation": "PostgreSQL SSI (based on Cahill's thesis) tracks read-write conflicts using non-blocking SIREAD locks. It detects 'dangerous structures' where a transaction has both an incoming and outgoing rw-antidependency edge, aborting one transaction with a 40001 serialization failure to prevent write skew while avoiding heavyweight pessimistic locking.",
        "tags": ["SSI", "Serializable Snapshot Isolation", "PostgreSQL", "Boss Challenge"]
    }
]
