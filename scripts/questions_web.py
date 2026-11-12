# Web Development & DevOps (The Cloud Spire Bastion) - 35 Questions
# 12 Easy, 14 Medium, 7 Hard, 2 Boss

WEB_QUESTIONS = [
    # EASY (12)
    {
        "question_text": "What does Idempotency mean in HTTP method specifications (e.g. GET, PUT, DELETE vs POST)?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "An idempotent method produces the exact same server side-effect whether executed once or executed multiple times consecutively with identical parameters"},
            {"id": "B", "text": "The method executes in zero milliseconds"},
            {"id": "C", "text": "The method can only be called from mobile devices"},
            {"id": "D", "text": "The method encrypts the response body"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "RFC 7231 defines idempotency: multiple identical requests have the same intended effect on the server as a single request. GET, HEAD, PUT, and DELETE are idempotent; POST is not (repeating POST can create multiple records).",
        "tags": ["HTTP", "REST API", "Idempotency", "Web Protocols"]
    },
    {
        "question_text": "In the standard CSS Box Model, what is the order of layers moving from the innermost element outward to the exterior boundary?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Content -> Padding -> Border -> Margin"},
            {"id": "B", "text": "Content -> Margin -> Border -> Padding"},
            {"id": "C", "text": "Border -> Margin -> Padding -> Content"},
            {"id": "D", "text": "Margin -> Border -> Content -> Padding"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "The CSS box model encloses HTML elements: Content (text/media) is buffered by Padding (clears area around content), wrapped by Border (visible outline), and separated from adjacent elements by Margin (transparent exterior space).",
        "tags": ["CSS", "Box Model", "Web Design"]
    },
    {
        "question_text": "What does the Document Object Model (DOM) represent in web browsers?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "A tree-structured in-memory object representation of the parsed HTML document, enabling programming languages like JavaScript to dynamically manipulate elements, attributes, and styles"},
            {"id": "B", "text": "A database server running in the browser"},
            {"id": "C", "text": "A proprietary Adobe graphics format"},
            {"id": "D", "text": "A network protocol replacing TCP"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "When a browser parses HTML, it constructs the DOM tree. Nodes in the tree represent elements (div, p, button) that scripts can access, mutate, and bind event handlers to dynamically.",
        "tags": ["DOM", "HTML", "JavaScript", "Browsers"]
    },
    {
        "question_text": "What is the security purpose of the browser's Same-Origin Policy (SOP)?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "To prevent malicious scripts on one origin (protocol + host + port) from reading sensitive data or DOM contents loaded from a distinct origin without explicit CORS permission"},
            {"id": "B", "text": "To stop users from viewing webpage HTML source code"},
            {"id": "C", "text": "To enforce single-threaded JavaScript execution"},
            {"id": "D", "text": "To prevent multiple browser tabs from opening simultaneously"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "SOP is the cornerstone of web application security: script running at attacker.com cannot read cookies, fetch private APIs, or inspect DOM frames from bank.com unless bank.com explicitly grants access via Cross-Origin Resource Sharing (CORS) headers.",
        "tags": ["Same-Origin Policy", "CORS", "Web Security", "Browsers"]
    },
    {
        "question_text": "What fundamental architectural difference distinguishes a Docker Container from a traditional Virtual Machine (VM)?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Containers share the host operating system kernel and isolate processes using kernel namespaces and cgroups; VMs virtualize full hardware and run a complete guest OS on a hypervisor"},
            {"id": "B", "text": "Containers are 100x larger in file size than VMs"},
            {"id": "C", "text": "VMs do not require RAM memory"},
            {"id": "D", "text": "Containers can only run Python code"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "VMs simulate physical hardware via Type 1 or Type 2 hypervisors, booting redundant guest OS kernels (gigabytes of storage and minutes of boot time). Containers are lightweight Linux processes isolated via namespaces (pid, net, mnt) sharing the host kernel.",
        "tags": ["Docker", "Containers", "Virtual Machines", "DevOps"]
    },
    {
        "question_text": "In modern software engineering, what is Continuous Integration (CI)?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "The automated practice where developers frequently merge code changes into a shared central repository, triggering automated builds, linters, and unit tests to catch defects early"},
            {"id": "B", "text": "Continuous manual deployment of zip files to production servers"},
            {"id": "C", "text": "Rewriting legacy software every month"},
            {"id": "D", "text": "A database backup tool"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "CI (e.g. GitHub Actions, GitLab CI) automates compilation, testing, and static analysis on every pull request, preventing integration hell and ensuring that master branches remain permanently shippable.",
        "tags": ["CI/CD", "Continuous Integration", "DevOps"]
    },
    {
        "question_text": "What is the key storage difference between Browser Cookies and LocalStorage?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Cookies are automatically attached to every matching HTTP request header (max ~4KB); LocalStorage stores up to 5-10MB purely on the client side and is never automatically transmitted over the network"},
            {"id": "B", "text": "Cookies can store up to 10GB of video files"},
            {"id": "C", "text": "LocalStorage is cleared every time a user refreshes the page"},
            {"id": "D", "text": "Cookies are encrypted with RSA by default"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "Cookies travel with every HTTP request (Cookie header), making them suitable for session tokens with HttpOnly flags. LocalStorage provides a persistent key-value store accessible only via client JavaScript for non-sensitive UI settings.",
        "tags": ["Cookies", "LocalStorage", "Client Storage", "Web"]
    },
    {
        "question_text": "How does the JavaScript runtime execute asynchronous I/O operations despite being single-threaded?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Through the Event Loop and Web APIs/libuv: blocking operations (fetch, setTimeout, file I/O) offload to background threads; their completion callbacks enqueue onto the Callback/Microtask Queue and run on the main thread when the call stack clears"},
            {"id": "B", "text": "By executing JavaScript bytecode directly on the graphics card"},
            {"id": "C", "text": "By dynamically creating new CPU cores"},
            {"id": "D", "text": "JavaScript is not single-threaded; it spawns 64 threads by default"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "Node.js (via libuv) and browsers delegate asynchronous work to native system threads. Once finished, callbacks are placed in the Macrotask or Microtask (Promises) queue. The Event Loop monitors the main Call Stack and executes queued callbacks once the stack empties.",
        "tags": ["Event Loop", "JavaScript", "Asynchronous", "libuv"]
    },
    {
        "question_text": "What is the function of CSS Media Queries in responsive web development?",
        "code_snippet": "@media (max-width: 768px) {\n  .sidebar { display: none; }\n}",
        "options": [
            {"id": "A", "text": "To apply conditional CSS styling rules based on device viewport width, resolution, orientation, or display capabilities"},
            {"id": "B", "text": "To download MP3 audio files into the browser"},
            {"id": "C", "text": "To compress video streams for YouTube"},
            {"id": "D", "text": "To connect to social media APIs"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "Media queries inspect user agent characteristics (e.g. screen width <= 768px). This allows fluid layouts to adapt dynamically between smartphones, tablets, laptops, and ultra-wide desktop monitors.",
        "tags": ["CSS", "Media Queries", "Responsive Design"]
    },
    {
        "question_text": "In Git version control, what does the command git commit do compared to git push?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "git commit records a snapshot of staged changes into the local repository history; git push uploads local commits to a remote repository (e.g. GitHub)"},
            {"id": "B", "text": "git commit sends code directly to customer production servers"},
            {"id": "C", "text": "git push deletes old branches"},
            {"id": "D", "text": "They perform the exact same action"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "Git is a distributed version control system. Committing is an entirely local offline action that cryptographically packages staged diffs into an immutable commit object. Pushing synchronizes those commits over the network to a remote forge.",
        "tags": ["Git", "Version Control", "DevOps"]
    },
    {
        "question_text": "Which data interchange format is text-based, language-independent, and natively parsed into objects in JavaScript?",
        "code_snippet": "{\n  \"name\": \"Class Royale\",\n  \"active\": true,\n  \"score\": 4850\n}",
        "options": [
            {"id": "A", "text": "JSON (JavaScript Object Notation)"},
            {"id": "B", "text": "XML"},
            {"id": "C", "text": "Protocol Buffers"},
            {"id": "D", "text": "CSV"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "JSON is the ubiquitous lightweight standard for API data exchange, consisting of key-value pairs and ordered lists with direct support for strings, numbers, booleans, null, arrays, and nested objects.",
        "tags": ["JSON", "APIs", "Data Interchange"]
    },
    {
        "question_text": "What does a RESTful API's Statelessness constraint mandate?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Every client request to the server must contain all information necessary to understand and process the request; the server must not store client conversational session context between requests"},
            {"id": "B", "text": "Servers cannot use databases"},
            {"id": "C", "text": "Clients cannot authenticate using passwords"},
            {"id": "D", "text": "Requests can only be executed once per day"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "Statelessness (Fielding dissertation) ensures high horizontal scalability: any server instance in a cluster can handle any incoming request because state is held by the client (e.g. JWT tokens) rather than tied to server sticky sessions.",
        "tags": ["REST", "Statelessness", "API Design"]
    },

    # MEDIUM (14)
    {
        "question_text": "In React, how does the Virtual DOM Reconciliation algorithm optimize DOM updates, and why is the 'key' prop essential in lists?",
        "code_snippet": "<ul>\n  {items.map(item => <li key={item.id}>{item.name}</li>)}\n</ul>",
        "options": [
            {"id": "A", "text": "React diffs previous and new virtual DOM trees in O(N) time; the key prop provides an identity hint so React can match children across renders, avoiding destroying and re-mounting unchanged DOM nodes"},
            {"id": "B", "text": "The key prop styles the HTML element with CSS"},
            {"id": "C", "text": "The key prop encrypts the element text in memory"},
            {"id": "D", "text": "Reconciliation deletes the entire browser document on every state change"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Direct DOM mutations are slow. React diffs in-memory lightweight JS objects (Virtual DOM). Without stable keys, adding an item at the head of a list causes React to re-render and re-instantiate every child item. Keys preserve component identity and internal state.",
        "tags": ["React", "Virtual DOM", "Reconciliation", "Keys"]
    },
    {
        "question_text": "What is the difference between Server-Side Rendering (SSR) and Static Site Generation (SSG) in Next.js?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "SSG generates HTML once at build time and serves it instantly from CDN edges; SSR generates fresh HTML dynamically on the server for every incoming request"},
            {"id": "B", "text": "SSR only works without CSS"},
            {"id": "C", "text": "SSG requires an active Node.js server running 24/7 for each user"},
            {"id": "D", "text": "There is no speed difference between them"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "SSG produces static HTML at `next build`, achieving ultra-fast TTFB via edge caching. SSR renders on-demand per request, essential when pages display live personalized user data or real-time query params.",
        "tags": ["Next.js", "SSR", "SSG", "Rendering"]
    },
    {
        "question_text": "In JavaScript, what is a Closure and how does it affect memory lifecycle?",
        "code_snippet": "function createCounter() {\n    let count = 0;\n    return function() {\n        return ++count;\n    };\n}\nconst counter = createCounter();\ncounter(); // 1\ncounter(); // 2",
        "options": [
            {"id": "A", "text": "A function bundled together with references to its surrounding lexical environment; it retains access to outer variables even after the outer function has executed and returned, preventing those variables from being garbage collected"},
            {"id": "B", "text": "An error that closes the browser window"},
            {"id": "C", "text": "A method to delete objects from RAM immediately"},
            {"id": "D", "text": "A loop that terminates after 10 iterations"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Closures allow functions to maintain stateful encapsulation. Even though createCounter finished execution, counter maintains a live reference to count in its closure scope. The engine cannot garbage-collect count as long as counter is referenced.",
        "tags": ["JavaScript", "Closures", "Lexical Scope", "Memory"]
    },
    {
        "question_text": "What are the three dot-separated components of a JSON Web Token (JWT), and how does the server verify its authenticity?",
        "code_snippet": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
        "options": [
            {"id": "A", "text": "Header, Payload, and Cryptographic Signature: the server hashes Header + Payload using its private secret key and verifies that the output matches the Signature token"},
            {"id": "B", "text": "Username, Password, and Database ID"},
            {"id": "C", "text": "HTML, CSS, and JavaScript"},
            {"id": "D", "text": "Source IP, Destination IP, and Timestamp"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "A JWT consists of: Header (algorithm & token type), Payload (claims / user attributes), and Signature. Because the signature is HMACSHA256(base64(Header) + '.' + base64(Payload), secret), modifying even one character invalidates verification.",
        "tags": ["JWT", "Authentication", "Security", "Web Tokens"]
    },
    {
        "question_text": "How do Docker Multi-Stage Builds drastically reduce the size and attack surface of production container images?",
        "code_snippet": "FROM node:20 AS builder\nWORKDIR /app\nCOPY . .\nRUN npm ci && npm run build\n\nFROM node:20-alpine AS runner\nWORKDIR /app\nCOPY --from=builder /app/.next/standalone ./\nCMD [\"node\", \"server.js\"]",
        "options": [
            {"id": "A", "text": "By executing compilation in heavy build environments, and copying ONLY compiled production artifacts into a clean, minimal runtime base image, leaving compilers, devDependencies, and source code behind"},
            {"id": "B", "text": "By compressing images with gzip"},
            {"id": "C", "text": "By disabling root access inside the container"},
            {"id": "D", "text": "By running multiple containers on a single port"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Build tools (TypeScript, build-essential, npm caches) can balloon an image to 1.5GB. Multi-stage builds compile in stage 1, then copy only standalone build outputs into an Alpine Linux container, shrinking images to under 100MB and eliminating compiler vulnerabilities.",
        "tags": ["Docker", "Multi-Stage", "DevOps", "Container Security"]
    },
    {
        "question_text": "What is the architectural difference between a Forward Proxy and a Reverse Proxy?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "A Forward Proxy sits in front of clients, mediating requests outward to the internet (protecting/anonymizing clients); a Reverse Proxy sits in front of servers, intercepting incoming client requests for load balancing, caching, and SSL termination"},
            {"id": "B", "text": "Forward proxies are written in C; reverse proxies are written in HTML"},
            {"id": "C", "text": "A reverse proxy runs on user laptops exclusively"},
            {"id": "D", "text": "Forward proxies only support UDP"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Forward proxies act on behalf of clients (e.g. corporate internet filtering). Reverse proxies (Nginx, Envoy, Cloudflare) act on behalf of origin backends, hiding server topology, enforcing TLS, rate limiting, and balancing traffic across clusters.",
        "tags": ["Reverse Proxy", "Nginx", "Architecture", "DevOps"]
    },
    {
        "question_text": "How do WebSockets differ from HTTP/1.1 Short Polling and Long Polling for real-time web applications?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "WebSockets upgrade the initial HTTP connection into a persistent, bidirectional, full-duplex TCP socket, allowing server and client to push microsecond messages with minimal 2-byte framing overhead"},
            {"id": "B", "text": "WebSockets do not require a network connection"},
            {"id": "C", "text": "Long polling consumes less bandwidth than WebSockets"},
            {"id": "D", "text": "WebSockets can only transmit text, never binary"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Polling wastes bandwidth by repeatedly sending HTTP headers every second. WebSockets send an HTTP 101 Switching Protocols header once, keeping the TCP connection open for instantaneous two-way data streaming.",
        "tags": ["WebSockets", "Real-Time", "HTTP", "Transport"]
    },
    {
        "question_text": "What is the Cache-Aside (Lazy Loading) pattern in distributed caching using Redis?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "The application checks the cache first; on a cache miss, it fetches data from the primary database, writes the result to the cache with a TTL, and returns it to the client"},
            {"id": "B", "text": "The database writes to Redis on every row update automatically"},
            {"id": "C", "text": "All data is written to Redis and never saved to disk"},
            {"id": "D", "text": "Redis invalidates the entire cache every 10 seconds"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "In Cache-Aside, the application owns cache management: Read path checks cache -> if miss, queries DB -> populates cache. This ensures only requested data is cached, but requires handling potential stale reads until TTL expires.",
        "tags": ["Redis", "Caching", "Cache-Aside", "System Design"]
    },
    {
        "question_text": "What is the difference between git merge and git rebase when incorporating changes from main into a feature branch?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "git merge preserves complete commit history and chronological order by creating a new 3-way merge commit; git rebase rewrites project history by replaying feature commits on top of the tip of main for a linear commit graph"},
            {"id": "B", "text": "git rebase deletes the feature branch"},
            {"id": "C", "text": "git merge is strictly forbidden on all Git projects"},
            {"id": "D", "text": "git rebase uploads commits to GitHub automatically"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Merge retains true history and branch provenance with explicit merge commits. Rebase shifts the base of the feature branch to main, generating new SHA-1 hashes for replayed commits and producing a clean, straight linear Git history.",
        "tags": ["Git", "Merge vs Rebase", "DevOps"]
    },
    {
        "question_text": "In Kubernetes architecture, what is the hierarchy of abstraction between a Pod, a Deployment, and a Service?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "A Pod is the smallest deployable container execution unit; a Deployment manages declarative scaling and rolling updates of replica Pods; a Service provides a stable IP and load balances traffic to matching Pods"},
            {"id": "B", "text": "A Service runs inside a Pod; a Pod runs inside a Deployment"},
            {"id": "C", "text": "Deployments are physical servers; Pods are virtual networks"},
            {"id": "D", "text": "Kubernetes does not have Services"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Pods are ephemeral instances with dynamic IPs. Deployments maintain desired replica sets and execute zero-downtime rolling upgrades. Services use label selectors to expose a stable virtual cluster IP and load-balance incoming network traffic.",
        "tags": ["Kubernetes", "DevOps", "Pods", "Deployments", "Services"]
    },
    {
        "question_text": "How do Server-Sent Events (SSE) compare to WebSockets for live AI token streaming (such as our CR Socratic Tutor)?",
        "code_snippet": "HTTP/1.1 200 OK\nContent-Type: text/event-stream\nCache-Control: no-cache\nConnection: keep-alive\n\ndata: {\"token\": \"Algorithm\"}\n\n",
        "options": [
            {"id": "A", "text": "SSE is a lightweight, one-way (server-to-client) text stream over standard HTTP/1.1 or HTTP/2, with native browser auto-reconnection and firewall compatibility; WebSockets provide heavyweight bidirectional channels"},
            {"id": "B", "text": "SSE only works on Firefox"},
            {"id": "C", "text": "WebSockets cannot stream text"},
            {"id": "D", "text": "SSE requires UDP transport"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "AI chat generation is unidirectional: the client sends a prompt once, and the LLM streams tokens back. SSE uses standard HTTP `text/event-stream` with built-in browser EventSource reconnection, avoiding WebSocket handshake and stateful proxy maintenance overhead.",
        "tags": ["SSE", "Server-Sent Events", "AI Streaming", "WebSockets"]
    },
    {
        "question_text": "What is the function of the Content Security Policy (CSP) HTTP header in mitigating Cross-Site Scripting (XSS)?",
        "code_snippet": "Content-Security-Policy: default-src 'self'; script-src 'self' https://apis.google.com;",
        "options": [
            {"id": "A", "text": "It restricts the authorized domains and resource types (scripts, images, stylesheets) from which the browser is permitted to load and execute content, blocking injected inline scripts"},
            {"id": "B", "text": "It prevents users from taking screenshots"},
            {"id": "C", "text": "It encrypts CSS stylesheets with AES-128"},
            {"id": "D", "text": "It forces users to change passwords every 30 days"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Even if an attacker injects `<script src='evil.com/xss.js'>` into HTML, a strict CSP instructing `script-src 'self'` orders the browser to abort downloading and executing the script, preventing session theft.",
        "tags": ["CSP", "XSS", "Web Security", "HTTP Headers"]
    },
    {
        "question_text": "How does setting the SameSite=Strict or SameSite=Lax attribute on session cookies mitigate Cross-Site Request Forgery (CSRF)?",
        "code_snippet": "Set-Cookie: session_id=xyz; Secure; HttpOnly; SameSite=Lax",
        "options": [
            {"id": "A", "text": "It tells the browser not to attach the cookie to cross-site requests initiated from third-party websites, preventing malicious sites from executing state-changing transactions on behalf of logged-in victims"},
            {"id": "B", "text": "It encrypts the database password on the client"},
            {"id": "C", "text": "It makes cookies expire after 5 seconds"},
            {"id": "D", "text": "It converts HTTP to HTTPS automatically"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "In a CSRF attack, a trap link on evil.com triggers a POST to bank.com. In the past, browsers sent bank.com cookies automatically. SameSite=Strict/Lax restricts cookie transmission to first-party contexts, neutralizing CSRF attacks at the browser level.",
        "tags": ["CSRF", "SameSite", "Cookies", "Web Security"]
    },
    {
        "question_text": "In a Content Delivery Network (CDN), what does the Cache-Control header directive 'stale-while-revalidate' instruct?",
        "code_snippet": "Cache-Control: public, max-age=3600, stale-while-revalidate=86400",
        "options": [
            {"id": "A", "text": "The client/CDN serves stale cached content immediately while asynchronously sending a background revalidation request to the origin server to fetch fresh content for future requests"},
            {"id": "B", "text": "The content must never be cached"},
            {"id": "C", "text": "The browser deletes cached images immediately"},
            {"id": "D", "text": "The web server restarts if a cache miss occurs"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "`stale-while-revalidate` delivers near-zero latency by serving cached assets instantly, while decoupling network revalidation from the user's critical rendering path by updating the cache in the background.",
        "tags": ["CDN", "Cache-Control", "HTTP Caching", "Performance"]
    },

    # HARD (7)
    {
        "question_text": "In Next.js 14+ and React 19 Server Components (RSC), how does the RSC Streaming Wire Format differ from traditional client-side hydration payloads?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "RSC streams serialized JSON-like component descriptions and UI slots containing suspended component boundaries, rendering static HTML directly from the server while reducing client JavaScript bundle size by eliminating server component code from client bundles"},
            {"id": "B", "text": "RSC replaces HTML with WebAssembly binaries"},
            {"id": "C", "text": "RSC requires all state to be stored in Redux"},
            {"id": "D", "text": "RSC does not support CSS stylesheets"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "Traditional SSR ships both HTML and all the JavaScript required to re-execute every component on the client. React Server Components execute strictly on the server: their JS dependencies (Markdown parsers, database clients) are never downloaded by the browser.",
        "tags": ["React 19", "RSC", "Server Components", "Next.js Architecture"]
    },
    {
        "question_text": "What is the difference between Blue-Green Deployment and Canary Deployment strategies in cloud DevOps?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Blue-Green deploys an identical second environment and cuts 100% of traffic over at the router/load balancer; Canary routes a small percentage (e.g. 5%) of live production traffic to the new version to monitor metrics before gradual rollout"},
            {"id": "B", "text": "Blue-Green takes 48 hours to complete; Canary takes 1 second"},
            {"id": "C", "text": "Canary deployment only works on Kubernetes in cloud environments"},
            {"id": "D", "text": "Blue-Green requires rewriting the database schema from scratch"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "Blue-Green provides instant atomic rollback by flipping router endpoints between two identical production environments. Canary minimizes blast radius by testing new versions on real users with automated metric guardrails before full deployment.",
        "tags": ["Deployments", "Blue-Green", "Canary", "DevOps"]
    },
    {
        "question_text": "How does Database Connection Pooling prevent connection starvation and high latency in asynchronous server environments (e.g. Node.js with Prisma)?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "It maintains a pre-warmed pool of reusable, persistent TCP/TLS database socket connections, queuing incoming queries to avoid the expensive overhead of establishing a new database handshake and process per query"},
            {"id": "B", "text": "It executes queries on client browsers"},
            {"id": "C", "text": "It bypasses database authentication credentials"},
            {"id": "D", "text": "It converts relational databases into static JSON files"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "Establishing a database connection requires TCP 3-way handshake, TLS negotiation, authentication, and backend process spawning (PostgreSQL forks a backend per connection). Connection pools (e.g. PgBouncer, Prisma Pool) multiplex thousands of queries over a fixed pool.",
        "tags": ["Connection Pooling", "Prisma", "Databases", "Performance"]
    },
    {
        "question_text": "In distributed systems observability, what role do Trace ID and Span ID play according to OpenTelemetry standards?",
        "code_snippet": "traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
        "options": [
            {"id": "A", "text": "Trace ID represents the end-to-end journey of a single client transaction across multiple microservices; Span ID represents a specific timed unit of work or sub-operation within that distributed trace"},
            {"id": "B", "text": "Trace ID stores the user's password hash; Span ID stores the database port"},
            {"id": "C", "text": "They are used exclusively for billing cloud costs"},
            {"id": "D", "text": "Trace ID measures network ping latency"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "Distributed tracing propagates context via W3C Trace Context headers (traceparent). The Trace ID correlates logs, metrics, and network calls across dozens of decoupled microservices, while parent-child Span IDs measure individual service execution intervals.",
        "tags": ["OpenTelemetry", "Distributed Tracing", "Observability", "Microservices"]
    },
    {
        "question_text": "In Kubernetes, how does the Horizontal Pod Autoscaler (HPA) algorithm calculate the desired number of replicas?",
        "code_snippet": "desiredReplicas = ceil( currentReplicas * ( currentMetricValue / targetMetricValue ) )",
        "options": [
            {"id": "A", "text": "By calculating the ratio of currently observed metric utilization (e.g. CPU or custom Prometheus metrics) against target utilization, scaling replica counts proportionally"},
            {"id": "B", "text": "By doubling pods every 5 minutes regardless of load"},
            {"id": "C", "text": "By shutting down nodes during peak traffic"},
            {"id": "D", "text": "By checking the master node temperature"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "HPA queries the Metrics Server in a control loop (every 15s). If current CPU utilization is 80% and target is 50%, desiredReplicas = ceil(current * (80/50)), smoothly adding pods to maintain stability without thrashing.",
        "tags": ["Kubernetes", "HPA", "Autoscaling", "DevOps"]
    },
    {
        "question_text": "In Infrastructure as Code (IaC) with Terraform, why is State Locking with remote backends (e.g. AWS S3 + DynamoDB) critical in team environments?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "To prevent concurrent terraform apply executions from mutating the state file simultaneously, preventing state corruption, race conditions, and duplicate cloud resource provisioning"},
            {"id": "B", "text": "To prevent unauthorized users from viewing AWS bills"},
            {"id": "C", "text": "To speed up Terraform compilation time"},
            {"id": "D", "text": "To compress terraform files into zip archives"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "The terraform.tfstate file maps declarative code to real-world cloud resources. If two CI/CD pipelines run simultaneously without distributed locking (via DynamoDB or Consul), writes interleave, corrupting state and causing resource leaks.",
        "tags": ["Terraform", "IaC", "State Locking", "DevOps"]
    },
    {
        "question_text": "How does the Web Audio API generate synthesized 8-bit retro sound effects directly in the client browser without external audio assets?",
        "code_snippet": "const ctx = new AudioContext();\nconst osc = ctx.createOscillator();\nosc.type = 'square';\nosc.frequency.setValueAtTime(440, ctx.currentTime);\nosc.connect(ctx.destination);\nosc.start();",
        "options": [
            {"id": "A", "text": "By using the native AudioContext graph to synthesize procedural periodic waveforms (square, sawtooth, triangle waves) and shaping pitch and volume envelopes with gain nodes in real time"},
            {"id": "B", "text": "By downloading MP3 files from Spotify in the background"},
            {"id": "C", "text": "By reading sound bytes from GPU video memory"},
            {"id": "D", "text": "By playing Windows system beep sounds"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "Our Class Royale audio engine (`src/lib/sound.ts`) instantiates an AudioContext audio routing graph. An OscillatorNode generates classic arcade chiptune waveforms (square waves for lead tones, noise for explosions), completely eliminating network audio latency.",
        "tags": ["Web Audio API", "Sound Synthesis", "AudioContext", "Frontend Engineering"]
    },

    # BOSS (2)
    {
        "question_text": "BOSS BATTLE // THE RAFT CONSENSUS MONARCH:\nUnder the Raft Distributed Consensus algorithm (used in etcd and Kubernetes), how does the Leader Election safety invariant guarantee that a newly elected Leader contains ALL committed log entries from prior terms?",
        "code_snippet": "// RequestVote RPC includes: lastLogIndex, lastLogTerm\n// Candidate is voted for IF AND ONLY IF its log is at least as up-to-date as the voter's log!",
        "options": [
            {"id": "A", "text": "During election, a voter rejects candidate RequestVote RPCs unless the candidate's last log entry has a higher term, or the same term with equal/greater index; because committed entries reside on a majority of nodes and an election requires a majority vote, the candidate must possess all committed entries"},
            {"id": "B", "text": "The leader reads log entries from a shared USB flash drive"},
            {"id": "C", "text": "By rebooting all cluster nodes simultaneously on leader failure"},
            {"id": "D", "text": "By electing the node with the fastest network card"}
        ],
        "correct_option_id": "A",
        "difficulty": "Boss",
        "xp_reward": 500,
        "time_limit_seconds": 90,
        "explanation": "Raft avoids Paxos's complex log repair during view changes. By the Quorum Intersection property, any majority of voters must contain at least one node holding the most recent committed log entry. Since that node only votes for candidates whose log is at least as up-to-date, uncommitted candidates cannot win.",
        "tags": ["Raft Consensus", "Distributed Systems", "etcd", "Kubernetes", "Boss Challenge"]
    },
    {
        "question_text": "BOSS BATTLE // THE ZERO-TRUST SPIRE OVERLORD:\nIn a microservices Service Mesh (Istio / Linkerd), how does transparent mutual TLS (mTLS) with SPIFFE identity verification secure inter-service communication against network eavesdropping and impersonation?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Envoy sidecar proxies intercept all ingress and egress network traffic via iptables; the mesh control plane provisions short-lived X.509 certificates encoding SPIFFE IDs (e.g. spiffe://cluster.local/ns/prod/sa/order-service) into SAN extensions, enforcing mutual cryptographic handshake and zero-trust authorization policies at both endpoints"},
            {"id": "B", "text": "By encrypting database passwords with base64"},
            {"id": "C", "text": "By disabling foreign keys in PostgreSQL"},
            {"id": "D", "text": "By routing traffic through public VPN servers"}
        ],
        "correct_option_id": "A",
        "difficulty": "Boss",
        "xp_reward": 500,
        "time_limit_seconds": 90,
        "explanation": "Zero Trust assumes the internal network is compromised. Envoy proxies intercept sockets at the pod boundary, authenticate peers via mutual X.509 certificates minted by SPIRE/Citadel, verify cryptographically validated SPIFFE identity SANs, and enforce fine-grained L7 AuthorizationPolicies.",
        "tags": ["Service Mesh", "mTLS", "SPIFFE", "Zero Trust", "DevOps", "Boss Challenge"]
    }
]
