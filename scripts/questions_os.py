# Operating Systems (The Core Kernel Fortress) - 35 Questions
# 12 Easy, 14 Medium, 7 Hard, 2 Boss

OS_QUESTIONS = [
    # EASY (12)
    {
        "question_text": "What is the primary memory management distinction between a Process and a Thread executing within the same process?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Threads possess independent virtual address spaces; processes share a common heap"},
            {"id": "B", "text": "Processes have separate isolated virtual address spaces; threads share the text, data, and heap segments of their parent process while having independent registers and stacks"},
            {"id": "C", "text": "Threads cannot perform system calls"},
            {"id": "D", "text": "Processes cannot share files"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "Processes are isolated address space protection domains managed by the OS page table. Threads are execution contexts within a process sharing heap, global variables, and open file descriptors, but each thread possesses its own program counter and stack.",
        "tags": ["Processes", "Threads", "Memory Layout"]
    },
    {
        "question_text": "What condition triggers a Hardware Page Fault interrupt in modern virtual memory systems?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "When the CPU clock speed exceeds motherboard ratings"},
            {"id": "B", "text": "When a process attempts to access a virtual memory page whose 'Present Bit' in the Page Table Entry is 0 (page not in physical RAM)"},
            {"id": "C", "text": "When a hard drive runs out of physical disk space"},
            {"id": "D", "text": "When a stack overflow occurs in user space"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "When the Memory Management Unit (MMU) encounters a valid virtual page whose present bit is 0, it raises a page fault trap (Vector 14 on x86), causing the kernel to fetch the page from backing store.",
        "tags": ["Virtual Memory", "Page Fault", "MMU"]
    },
    {
        "question_text": "What data structure does the operating system kernel use to store the state, program counter, registers, and open files of an active process?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Translation Lookaside Buffer (TLB)"},
            {"id": "B", "text": "Process Control Block (PCB)"},
            {"id": "C", "text": "Interrupt Vector Table (IVT)"},
            {"id": "D", "text": "Inode Table"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "The Process Control Block (PCB, or struct task_struct in Linux) is the kernel's central bookkeeping structure for each process, storing PID, execution state, CPU registers, scheduling priority, and memory mappings.",
        "tags": ["PCB", "Processes", "Kernel Data Structures"]
    },
    {
        "question_text": "What is the critical section problem in concurrent programming?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "A hardware flaw in CPU cache alignment"},
            {"id": "B", "text": "A segment of code accessing shared resources that must not be concurrently executed by more than one process or thread at any time"},
            {"id": "C", "text": "A compiler error that prevents binary linking"},
            {"id": "D", "text": "A high-priority interrupt that halts the operating system"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "A critical section accesses shared mutable state. Synchronization primitives (mutexes, semaphores) enforce mutual exclusion so that only one thread executes inside the critical section at a given instant.",
        "tags": ["Critical Section", "Concurrency", "Mutual Exclusion"]
    },
    {
        "question_text": "How does Preemptive CPU Scheduling differ from Non-Preemptive CPU Scheduling?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Preemptive scheduling can interrupt a currently running process to allocate CPU to another process; non-preemptive allows a process to hold CPU until it terminates or yields for I/O"},
            {"id": "B", "text": "Non-preemptive scheduling is 10x faster in all operating systems"},
            {"id": "C", "text": "Preemptive scheduling does not require a timer interrupt"},
            {"id": "D", "text": "Non-preemptive scheduling is strictly used in multi-core processors"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "Preemptive schedulers use hardware timer interrupts to reclaim the CPU from a running task when a time quantum expires or a higher-priority task wakes up.",
        "tags": ["CPU Scheduling", "Preemption", "Operating Systems"]
    },
    {
        "question_text": "What is a major architectural difference between a Monolithic Kernel and a Microkernel?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Monolithic kernels cannot run on 64-bit processors"},
            {"id": "B", "text": "Monolithic kernels execute core services (file system, networking, device drivers) inside kernel address space; microkernels keep only minimal primitives in kernel space, running drivers and servers in user space"},
            {"id": "C", "text": "Microkernels do not support virtual memory"},
            {"id": "D", "text": "Monolithic kernels do not have system calls"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "Monolithic kernels (Linux, BSD) run everything in a single supervisor address space for performance. Microkernels (Mach, seL4) minimize kernel code to basic IPC, virtual memory, and scheduling, moving filesystems and drivers to user space.",
        "tags": ["Microkernel", "Monolithic Kernel", "Architecture"]
    },
    {
        "question_text": "In the Round Robin (RR) scheduling algorithm, what occurs when the time quantum assigned to a process expires?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "The process is terminated with SIGKILL"},
            {"id": "B", "text": "A context switch occurs: the process is preempted and appended to the tail of the Ready Queue"},
            {"id": "C", "text": "The process is placed in the Blocked/Waiting state"},
            {"id": "D", "text": "The process priority is doubled"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "When the timer tick signifies quantum exhaustion, the OS scheduler saves the current context to the PCB, places the task at the end of the ready FIFO queue, and switches to the next available task.",
        "tags": ["Round Robin", "Scheduling", "Context Switch"]
    },
    {
        "question_text": "What components are involved in the overhead of a CPU Context Switch between two processes?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Saving CPU registers to memory, switching page table pointers (CR3 in x86), invalidating TLB entries, and loading new process registers"},
            {"id": "B", "text": "Formatting the hard drive"},
            {"id": "C", "text": "Re-installing the kernel into ROM"},
            {"id": "D", "text": "Only resetting the motherboard power supply"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "Context switching requires saving/restoring integer and floating-point registers, switching kernel stacks, changing virtual address spaces (reloading page directory base register CR3), which flushes TLBs and incurs cache cold-miss penalties.",
        "tags": ["Context Switch", "Overhead", "CPU Architecture"]
    },
    {
        "question_text": "What information is typically stored inside an Inode in a Unix/Linux filesystem?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "File metadata (file size, permissions, owner, timestamps, and data block pointers) but NOT the filename itself"},
            {"id": "B", "text": "Only the filename and password"},
            {"id": "C", "text": "The entire contents of the file in plain text"},
            {"id": "D", "text": "The user's web browsing history"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "An inode stores all file metadata: UID, GID, mode permissions, size, atime/mtime/ctime, and direct/indirect block pointers. Filenames are stored separately inside directory entries (dentries) mapping names to inode numbers.",
        "tags": ["Filesystem", "Inode", "Unix"]
    },
    {
        "question_text": "How does Direct Memory Access (DMA) benefit operating system performance during high-volume I/O transfers?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "It allows specialized hardware controllers to transfer data blocks directly between I/O devices and main memory without continuous CPU intervention"},
            {"id": "B", "text": "It increases CPU clock frequency by 200%"},
            {"id": "C", "text": "It compresses RAM using gzip"},
            {"id": "D", "text": "It replaces hard disks with magnetic tape"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "Without DMA, Programmed I/O forces the CPU to transfer bytes one-by-one via registers. DMA controllers move entire disk sectors or network packets directly into RAM, interrupting the CPU only once when the block transfer finishes.",
        "tags": ["DMA", "I/O", "Hardware Architecture"]
    },
    {
        "question_text": "What is the difference between Internal Memory Fragmentation and External Memory Fragmentation?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Internal fragmentation is unused memory inside an allocated fixed block; external fragmentation occurs when total free memory is sufficient but scattered in chunks too small to satisfy a contiguous request"},
            {"id": "B", "text": "Internal fragmentation happens on SSDs; external fragmentation happens on HDDs"},
            {"id": "C", "text": "External fragmentation is eliminated by increasing RAM clock speed"},
            {"id": "D", "text": "They are identical phenomena with different names"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "Paging solves external fragmentation (by allowing non-contiguous allocation), but leaves internal fragmentation in the last allocated page. Variable partition segmentation exhibits external fragmentation.",
        "tags": ["Memory Management", "Fragmentation", "Paging"]
    },
    {
        "question_text": "In process lifecycle models, when does a process transition from the RUNNING state to the WAITING (or BLOCKED) state?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "When its CPU time quantum expires"},
            {"id": "B", "text": "When it requests an asynchronous I/O operation or waits for an event/signal/lock that is not immediately available"},
            {"id": "C", "text": "When it finishes its main function"},
            {"id": "D", "text": "When a new process is spawned in user space"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "A process blocks (WAITING) when it cannot continue until an external event occurs (e.g. disk read completes, network packet arrives, or mutex becomes unlocked). Quantum expiration transitions from RUNNING directly back to READY.",
        "tags": ["Process State", "Operating Systems", "Lifecycle"]
    },

    # MEDIUM (14)
    {
        "question_text": "What are Coffman's Four Necessary Conditions that must hold simultaneously for a system Deadlock to occur?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "High CPU utilization, low memory, disk thrashing, and network latency"},
            {"id": "B", "text": "Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait"},
            {"id": "C", "text": "Race Condition, Priority Inversion, Starvation, and Cache Invalidation"},
            {"id": "D", "text": "Virtual Memory, Page Faults, Segmentation, and Direct Memory Access"}
        ],
        "correct_option_id": "B",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Deadlock can only occur if all four Coffman conditions are present: 1) Mutual Exclusion (non-shareable resources); 2) Hold and Wait (retaining allocated resources while awaiting more); 3) No Preemption (resources cannot be forcibly confiscated); 4) Circular Wait (a closed cycle of processes waiting on each other).",
        "tags": ["Deadlock", "Coffman Conditions", "Concurrency"]
    },
    {
        "question_text": "In the Banker's Algorithm for deadlock avoidance, how is a system state defined as 'Safe'?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "If zero processes are requesting new resources"},
            {"id": "B", "text": "If there exists at least one sequence <P1, P2, ... Pn> of all processes such that each process can satisfy its maximum remaining claim using currently available resources plus resources held by prior processes"},
            {"id": "C", "text": "If CPU utilization remains below 75%"},
            {"id": "D", "text": "If all locks are converted into read-only shared locks"}
        ],
        "correct_option_id": "B",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "A safe state guarantees that even if every process suddenly requests its declared maximum resource allocation, the OS can allocate resources in safe sequence order, allowing all processes to complete without deadlock.",
        "tags": ["Banker's Algorithm", "Deadlock Avoidance", "Safety State"]
    },
    {
        "question_text": "What is Belady's Anomaly in virtual memory page replacement algorithms?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "A page fault causes kernel panic on multi-core systems"},
            {"id": "B", "text": "For certain page reference strings, increasing the number of physical page frames results in an INCREASE in the number of page faults under FIFO page replacement"},
            {"id": "C", "text": "LRU page replacement behaves identically to LFU"},
            {"id": "D", "text": "Virtual addresses wrap around to 0"}
        ],
        "correct_option_id": "B",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "FIFO is not a stack algorithm (the set of pages in an n-frame memory is not guaranteed to be a subset of an (n+1)-frame memory). For reference strings like 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5, increasing frames from 3 to 4 increases faults from 9 to 10.",
        "tags": ["Belady's Anomaly", "Page Replacement", "FIFO", "Virtual Memory"]
    },
    {
        "question_text": "How does the Copy-on-Write (CoW) optimization improve the efficiency of the fork() system call in Unix-like systems?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "It copies the parent process RAM to secondary swap space immediately"},
            {"id": "B", "text": "It duplicates page table mappings and marks physical pages read-only; actual physical memory copying is deferred until either the parent or child attempts a write modification"},
            {"id": "C", "text": "It prevents the child process from executing execve()"},
            {"id": "D", "text": "It converts user threads into kernel threads"}
        ],
        "correct_option_id": "B",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Naive fork() copies gigabytes of physical RAM. With CoW, parent and child share the same physical pages marked read-only. When a write occurs, the MMU traps with a protection fault, prompting the kernel to allocate a new physical page only for the modified block.",
        "tags": ["fork()", "Copy-on-Write", "Virtual Memory"]
    },
    {
        "question_text": "What is the primary role of a Translation Lookaside Buffer (TLB) in processor architectures?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "To store executable machine instructions"},
            {"id": "B", "text": "An ultra-fast hardware associative cache that stores recent Virtual Page Number (VPN) to Physical Frame Number (PFN) address translations, bypassing multi-level page table walks"},
            {"id": "C", "text": "To cache disk directory entries"},
            {"id": "D", "text": "To manage TCP network sockets"}
        ],
        "correct_option_id": "B",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Multi-level page tables in 64-bit systems require 4-5 memory lookups per virtual address translation. The TLB caches frequent mappings with 99%+ hit rates, enabling single-cycle address translation.",
        "tags": ["TLB", "MMU", "Virtual Memory", "Cache"]
    },
    {
        "question_text": "How does Dijkstra's Counting Semaphore differ from a Binary Semaphore (Mutex)?",
        "code_snippet": "wait(S):   while (S <= 0) /* wait */; S--;\nsignal(S): S++;",
        "options": [
            {"id": "A", "text": "A counting semaphore integer value can range over an unrestricted domain, representing the count of available identical resource units"},
            {"id": "B", "text": "Counting semaphores cannot be used across processes"},
            {"id": "C", "text": "A counting semaphore can only be decremented by the kernel root user"},
            {"id": "D", "text": "Binary semaphores allow simultaneous access to 10 threads"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "A binary semaphore has values {0, 1} for mutual exclusion. A counting semaphore is initialized to N (the number of available shared resources); calling wait() decrements count, and calling signal() increments it.",
        "tags": ["Semaphores", "Concurrency", "Synchronization"]
    },
    {
        "question_text": "What is Thrashing in virtual memory management and what is its primary root cause?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "High disk fragmentation causing sequential read bottlenecks"},
            {"id": "B", "text": "The condition where the operating system spends more time servicing page faults and swapping pages in/out of disk than executing instructions, caused by the sum of working set sizes exceeding available physical RAM"},
            {"id": "C", "text": "A deadlock between file read locks and write locks"},
            {"id": "D", "text": "CPU overheating causing thermal clock throttling"}
        ],
        "correct_option_id": "B",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "When active processes demand more physical frames than exist (sum of Working Sets > RAM), every page fault forces evicting a page that is needed immediately afterward. The disk queue saturates, CPU utilization collapses to near zero, and the system freezes.",
        "tags": ["Thrashing", "Working Set", "Virtual Memory"]
    },
    {
        "question_text": "In Peterson's Algorithm for two-process mutual exclusion, why are BOTH a flag array and a turn variable necessary?",
        "code_snippet": "flag[i] = true;\nturn = j;\nwhile (flag[j] && turn == j) /* busy wait */;\n// Critical Section\nflag[i] = false;",
        "options": [
            {"id": "A", "text": "flag indicates process interest; turn resolves simultaneous contention by giving priority to the other process, preventing mutual lockout and deadlock"},
            {"id": "B", "text": "One variable is for kernel mode, the other is for user mode"},
            {"id": "C", "text": "To notify the CPU scheduler of quantum expiration"},
            {"id": "D", "text": "To synchronize memory caches across distinct computers"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Using only flag causes deadlock when both set flag=true at the same instant. Using only turn causes strict alternation without respecting progress. Combining flag (desire to enter) and turn (courtesy tie-breaker) satisfies mutual exclusion, progress, and bounded waiting.",
        "tags": ["Peterson's Algorithm", "Mutual Exclusion", "Synchronization"]
    },
    {
        "question_text": "How does a Multi-Level Feedback Queue (MLFQ) scheduler prevent CPU-bound jobs from monopolizing the processor over interactive I/O jobs?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "By executing all jobs in random order"},
            {"id": "B", "text": "By prioritizing interactive jobs that yield frequently, while degrading the priority of jobs that consume their full time slice downward into lower-priority queues with larger quanta"},
            {"id": "C", "text": "By terminating long-running processes after 60 seconds"},
            {"id": "D", "text": "By assigning equal fixed-priority slices to all threads"}
        ],
        "correct_option_id": "B",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "MLFQ observes past behavior without knowing job durations in advance: if a job uses an entire time quantum without yielding, it is classified as CPU-bound and demoted. If it yields early (interactive/I/O-bound), it stays in high-priority queues with rapid response times.",
        "tags": ["MLFQ", "CPU Scheduling", "Feedback Queue"]
    },
    {
        "question_text": "Why does Priority Inversion occur in real-time operating systems, and how does the Priority Inheritance Protocol resolve it?",
        "code_snippet": "-- Low task L holds resource R\n-- High task H preempts and requests R, blocking on L\n-- Medium task M preempts L (since priority M > L), preventing L from finishing and releasing R to H!\n-- Result: Task H is delayed indefinitely by Task M!",
        "options": [
            {"id": "A", "text": "By temporarily elevating the priority of the lower-priority lock holder L to match the highest priority waiting task H until L releases the shared resource"},
            {"id": "B", "text": "By aborting the high-priority task immediately"},
            {"id": "C", "text": "By disabling multi-threading on the host machine"},
            {"id": "D", "text": "By assigning equal priority to all tasks in the operating system"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Priority Inheritance dictates that when high-priority task H blocks on a lock held by low-priority task L, L inherits H's priority level. This prevents medium tasks M from preempting L, allowing L to swiftly finish its critical section and release R.",
        "tags": ["Priority Inversion", "Priority Inheritance", "RTOS"]
    },
    {
        "question_text": "In Linux interrupt processing, what is the architectural division between Top-Half and Bottom-Half handlers?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Top-halves run with hardware interrupts disabled to acknowledge device hardware immediately; bottom-halves (softirqs/tasklets/workqueues) run later with interrupts re-enabled to handle lengthy processing"},
            {"id": "B", "text": "Top-halves run in user space; bottom-halves run in ROM"},
            {"id": "C", "text": "Top-halves run on the primary CPU; bottom-halves run on the GPU"},
            {"id": "D", "text": "Top-halves manage virtual memory; bottom-halves manage USB devices"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Interrupt Service Routines (ISRs) must not stall other hardware interrupts. The Top-Half swiftly acknowledges the controller, copies registers/packet buffers, and schedules a Bottom-Half (softirq, tasklet, or kworker) to do heavy lifting with interrupts enabled.",
        "tags": ["Interrupts", "Linux Kernel", "Top-Half Bottom-Half"]
    },
    {
        "question_text": "What is the function of the Inverted Page Table structure used in certain 64-bit architectures?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "It indexes physical memory frames rather than virtual pages: exactly one entry exists per physical frame, vastly reducing page table memory footprint"},
            {"id": "B", "text": "It swaps page table bits from big-endian to little-endian"},
            {"id": "C", "text": "It stores virtual addresses backwards to accelerate hashing"},
            {"id": "D", "text": "It eliminates the need for RAM cache"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Traditional per-process multi-level page tables scale with virtual address space size (which is massive in 64-bit). An Inverted Page Table scales strictly with physical RAM size (one entry per physical frame), using a hash anchor table to map (PID, VPN) -> PFN.",
        "tags": ["Inverted Page Table", "Virtual Memory", "Paging"]
    },
    {
        "question_text": "In the Dining Philosophers Problem, how does Dijkstra's Resource Hierarchy solution prevent deadlocks?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "By assigning a global numerical order to all chopsticks and requiring every philosopher to acquire the lower-numbered chopstick before the higher-numbered one"},
            {"id": "B", "text": "By forcing all philosophers to eat with only one chopstick"},
            {"id": "C", "text": "By having philosophers eat in alphabetical order"},
            {"id": "D", "text": "By terminating philosopher 0 after 5 minutes"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Deadlock requires a Circular Wait condition. By imposing a total ordering on resources and requiring all acquisitions to follow this order, a circular dependency chain can never form, making deadlock mathematically impossible.",
        "tags": ["Dining Philosophers", "Deadlock Prevention", "Resource Ordering"]
    },
    {
        "question_text": "What distinguishes Hard Real-Time systems from Soft Real-Time systems in OS design?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Hard real-time systems consider missing a deadline a total catastrophic system failure; soft real-time systems prioritize tasks to minimize late completions without fatal consequences"},
            {"id": "B", "text": "Hard real-time systems only run on specialized mainframe hardware"},
            {"id": "C", "text": "Soft real-time systems cannot handle audio/video streaming"},
            {"id": "D", "text": "Hard real-time operating systems do not support preemption"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Hard real-time systems (flight avionics, pacemaker controls, anti-lock brakes) have strict deterministic guarantees: missing a deadline causes catastrophic failure. Soft real-time (multimedia, gaming) degrades user experience if deadlines are missed.",
        "tags": ["RTOS", "Real-Time Systems", "Scheduling"]
    },

    # HARD (7)
    {
        "question_text": "In modern x86-64 long mode, how is a 48-bit Canonical Virtual Address translated to a physical address through a 4-level page table?",
        "code_snippet": "| Sign Extension (16b) | PML4 (9b) | PDPT (9b) | PD (9b) | PT (9b) | Offset (12b) |",
        "options": [
            {"id": "A", "text": "CR3 points to PML4; four 9-bit fields index PML4, PDPT, Page Directory, and Page Table entries, with the remaining 12 bits forming the 4KB page frame offset"},
            {"id": "B", "text": "The virtual address is hashed directly to a 64-bit physical address in one step"},
            {"id": "C", "text": "The first 32 bits index RAM; the remaining 16 bits index SSD swap"},
            {"id": "D", "text": "CR0 registers hold all page entries simultaneously"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "x86-64 uses 4 levels of 512 entries (9 bits each): bits 47-39 index PML4, 38-30 index PDPT, 29-21 index PD, 20-12 index PT, and 11-0 specify the 4KB byte offset (2^12 = 4096 bytes).",
        "tags": ["x86-64", "Paging", "Page Table Walk", "Hardware MMU"]
    },
    {
        "question_text": "How does the Linux epoll mechanism achieve O(1) event notification scaling compared to select() and poll() which scale as O(N)?",
        "code_snippet": "int epfd = epoll_create1(0);\nepoll_ctl(epfd, EPOLL_CTL_ADD, fd, &event);\nint n = epoll_wait(epfd, events, MAX_EVENTS, -1);",
        "options": [
            {"id": "A", "text": "epoll maintains an internal Red-Black tree of registered file descriptors and an in-kernel Ready List (linked list) populated directly by device driver wake-up callbacks, returning only active events"},
            {"id": "B", "text": "epoll creates a separate thread for every socket"},
            {"id": "C", "text": "epoll uses UDP instead of TCP"},
            {"id": "D", "text": "epoll compresses file descriptors using Huffman coding"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "select/poll require copying the full FD set to kernel space on every call and linearly scanning all N descriptors. epoll registers FDs once in a kernel RB-tree; device wake-up callbacks append ready FDs to a double-linked list, allowing epoll_wait to return in O(ready_events).",
        "tags": ["epoll", "I/O Multiplexing", "Linux Kernel", "Scalability"]
    },
    {
        "question_text": "How does a Futex (Fast Userspace Mutex) in Linux optimize synchronization latency in the uncontended case?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "It performs atomic assembly operations (CAS) entirely in user space without entering the kernel when there is no lock contention, invoking the futex() system call only to put the thread to sleep when contended"},
            {"id": "B", "text": "It disables CPU interrupts from user space"},
            {"id": "C", "text": "It converts all locks into spinlocks that burn CPU indefinitely"},
            {"id": "D", "text": "It requires root superuser permissions for every mutex"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "Entering the kernel costs hundreds of CPU cycles. A futex uses atomic compare-and-swap in user space: if the lock is unowned, it acquires it in single-digit nanoseconds without a system call. Kernel involvement (SYS_futex) only occurs to sleep or wake waiting threads.",
        "tags": ["Futex", "Synchronization", "Atomic Operations", "Linux Kernel"]
    },
    {
        "question_text": "In the Completely Fair Scheduler (CFS) in Linux, how does the scheduler select the next task to run and maintain fairness?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "It tracks 'vruntime' (virtual runtime) for each task in a time-ordered Red-Black tree, always picking the leftmost node (the task that has executed for the least virtual time)"},
            {"id": "B", "text": "It allocates a fixed 10ms slice to tasks in round-robin fashion"},
            {"id": "C", "text": "It schedules tasks based on their process ID number"},
            {"id": "D", "text": "It runs the task with the largest memory consumption first"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "CFS models an 'ideal multi-tasking CPU'. Each runnable task has a virtual runtime (vruntime) scaled inversely by its nice value. Tasks are stored in an RB-tree; picking the leftmost node (rb_leftmost) takes O(1) time and guarantees proportional fair-share CPU allocation.",
        "tags": ["CFS", "Linux Scheduler", "Red-Black Tree", "vruntime"]
    },
    {
        "question_text": "How did Kernel Page Table Isolation (KPTI) mitigate the hardware Meltdown speculative execution vulnerability?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "By completely separating user-space and kernel-space page tables, unmapping kernel address space while running in user mode so speculative out-of-order execution cannot access kernel memory"},
            {"id": "B", "text": "By disabling speculative execution entirely on modern microprocessors"},
            {"id": "C", "text": "By replacing x86 processors with ARM chips"},
            {"id": "D", "text": "By encrypting L1 cache lines with AES-256"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "Meltdown allowed unprivileged code to exploit CPU out-of-order execution and cache side-channels to read kernel memory mapped into user space. KPTI unmaps kernel memory from the user-space CR3 page directory, restoring mappings only on system call traps.",
        "tags": ["KPTI", "Meltdown", "Security", "Hardware Vulnerabilities"]
    },
    {
        "question_text": "How does the Slab Allocator in the Linux kernel combat internal and external fragmentation for small kernel objects (e.g. inodes, task_structs)?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "It requests whole physical pages from the buddy allocator and pre-partitions them into caches of contiguous, identically-sized constructor-initialized object slots"},
            {"id": "B", "text": "It relies exclusively on malloc() in user space"},
            {"id": "C", "text": "It dynamically resizes physical RAM modules"},
            {"id": "D", "text": "It converts memory allocations into file storage"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "The buddy allocator only allocates power-of-two pages (minimum 4KB). The Slab allocator (kmem_cache) manages pools of exact-sized kernel objects, eliminating page internal fragmentation and avoiding repetitive object construction/destruction overhead.",
        "tags": ["Slab Allocator", "Memory Allocation", "Kernel Architecture"]
    },
    {
        "question_text": "What is the ABA Problem in lock-free concurrent data structures using atomic Compare-And-Swap (CAS)?",
        "code_snippet": "Node* old_head = head;\n// Thread 1 suspended here...\n// Thread 2 pops A, pops B, deletes B, re-allocates A and pushes A back!\n// Thread 1 resumes: CAS(&head, old_head, old_head->next) succeeds, but old_head->next was freed!",
        "options": [
            {"id": "A", "text": "A value changes from A to B and back to A; CAS succeeds assuming nothing changed, but structural pointers or memory referenced by A were invalidated/freed"},
            {"id": "B", "text": "A deadlock between threads A and B"},
            {"id": "C", "text": "An error in the ASCII character table"},
            {"id": "D", "text": "A hardware interrupt occurring during atomic swap"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "CAS only checks bit equality: if memory holds address A, it assumes state has not changed. But if node A was popped, freed, and its address re-allocated while another node was deleted, dangling pointers cause corruption. Mitigated by Hazard Pointers or Generation Tags (tagged pointers / double-word CAS).",
        "tags": ["Lock-Free", "ABA Problem", "CAS", "Concurrency"]
    },

    # BOSS (2)
    {
        "question_text": "BOSS BATTLE // THE KERNEL OVERLORD:\nIn modern multi-socket Non-Uniform Memory Access (NUMA) architectures, how does the OS kernel's NUMA-aware memory allocator and scheduler prevent cross-interconnect memory latency penalties?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "By allocating physical frames from the local NUMA memory node attached directly to the socket where the requesting thread is running, and using CPU affinity / automatic NUMA balancing to migrate memory pages if threads migrate across sockets"},
            {"id": "B", "text": "By interleaving every byte across all physical memory channels equally"},
            {"id": "C", "text": "By disabling secondary CPU sockets during memory-intensive calculations"},
            {"id": "D", "text": "By routing all memory requests through PCIe bus lanes"}
        ],
        "correct_option_id": "A",
        "difficulty": "Boss",
        "xp_reward": 500,
        "time_limit_seconds": 90,
        "explanation": "In NUMA systems, accessing remote socket memory over QPI/UPI interconnects takes 2-3x longer than local node RAM. The Linux kernel uses zonelists to satisfy allocations from the local NUMA node first. AutoNUMA periodically unmaps pages, catches page faults, and migrates pages to match thread CPU socket affinity.",
        "tags": ["NUMA", "Memory Allocation", "Kernel Schedulers", "Boss Challenge"]
    },
    {
        "question_text": "BOSS BATTLE // THE ATOMIC BARRIER MONARCH:\nIn SMP systems with weak memory models (such as ARMv8 or POWER), why is a simple software flag insufficient to communicate data between threads, requiring Acquire-Release memory barriers?",
        "code_snippet": "// Thread 1:\ndata = 42;                // Write to payload\nready.store(true, ...);   // Flag notification\n// Thread 2:\nif (ready.load(...)) {\n    assert(data == 42);   // Can FAIL without memory barriers!\n}",
        "options": [
            {"id": "A", "text": "Out-of-order execution hardware and store buffers can reorder memory writes so Thread 2 observes ready == true before data == 42 is visible in cache; memory_order_release enforces prior writes finish before the store, and memory_order_acquire prevents subsequent reads from moving before the load"},
            {"id": "B", "text": "Because integers cannot be shared across multiple threads in C++"},
            {"id": "C", "text": "Because Thread 1 and Thread 2 run on different operating systems"},
            {"id": "D", "text": "Because CPU caches do not update until system reboot"}
        ],
        "correct_option_id": "A",
        "difficulty": "Boss",
        "xp_reward": 500,
        "time_limit_seconds": 90,
        "explanation": "Weak memory architectures allow aggressive CPU and compiler write-reordering. Without explicit memory barriers (or std::memory_order_release / std::memory_order_acquire), the store to 'ready' can become globally visible before the store to 'data', causing the assertion in Thread 2 to fail.",
        "tags": ["Memory Barriers", "Acquire-Release", "Weak Memory Models", "Boss Challenge"]
    }
]
