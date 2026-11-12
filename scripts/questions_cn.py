# Computer Networks (The Whispering Wirelands) - 35 Questions
# 12 Easy, 14 Medium, 7 Hard, 2 Boss

CN_QUESTIONS = [
    # EASY (12)
    {
        "question_text": "What is the correct top-to-bottom sequence of the 7 layers in the ISO-OSI Reference Model?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Application, Presentation, Session, Transport, Network, Data Link, Physical"},
            {"id": "B", "text": "Physical, Network, Transport, Data Link, Session, Presentation, Application"},
            {"id": "C", "text": "Application, Transport, Network, Link, Physical, Session, Presentation"},
            {"id": "D", "text": "Data Link, Network, Transport, Session, Presentation, Application, Physical"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "From Layer 7 down to Layer 1, the OSI model consists of: Application (L7), Presentation (L6), Session (L5), Transport (L4), Network (L3), Data Link (L2), and Physical (L1).",
        "tags": ["OSI Model", "Networking Basics", "Layering"]
    },
    {
        "question_text": "What is the primary operational distinction between Transmission Control Protocol (TCP) and User Datagram Protocol (UDP)?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "TCP is connectionless and unreliable; UDP is connection-oriented and reliable"},
            {"id": "B", "text": "TCP provides connection-oriented, reliable, in-order byte stream delivery with flow and congestion control; UDP provides connectionless, lightweight, unreliable datagram transmission"},
            {"id": "C", "text": "TCP only works on fiber optic cables; UDP only works over Wi-Fi"},
            {"id": "D", "text": "UDP encrypts data by default; TCP transmits in plain text"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "TCP establishes a 3-way handshake, retransmits lost segments, and enforces in-order delivery via sequence numbers and ACKs. UDP has zero handshake overhead, no retransmissions, and minimal 8-byte headers.",
        "tags": ["TCP vs UDP", "Transport Layer", "Protocols"]
    },
    {
        "question_text": "How many total bits make up a standard IPv4 address, and how is it typically represented in human-readable form?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "16 bits, written in octal"},
            {"id": "B", "text": "32 bits, written as four decimal octets separated by dots (e.g. 192.168.1.1)"},
            {"id": "C", "text": "64 bits, written in base64"},
            {"id": "D", "text": "128 bits, written as eight colon-separated hexadecimal blocks"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "IPv4 uses a 32-bit address space (yielding ~4.3 billion possible addresses), formatted as four 8-bit octets (0-255) separated by periods. IPv6 uses 128 bits.",
        "tags": ["IPv4", "IP Addressing", "Network Layer"]
    },
    {
        "question_text": "What is the functional purpose of the Domain Name System (DNS) in computer networking?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "To compress HTML and CSS files on web servers"},
            {"id": "B", "text": "To translate human-readable domain names (e.g. classroyale.com) into numerical IP addresses (e.g. 104.21.52.1) required for routing"},
            {"id": "C", "text": "To encrypt Wi-Fi passwords"},
            {"id": "D", "text": "To allocate MAC addresses to network interfaces"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "DNS is the Internet's hierarchical distributed lookup directory, mapping human-friendly alphanumeric domain names to machine-routable IPv4/IPv6 addresses via A and AAAA resource records.",
        "tags": ["DNS", "Application Layer", "Name Resolution"]
    },
    {
        "question_text": "What type of address operates at Layer 2 (Data Link Layer) to uniquely identify physical network interface controllers (NICs) on a local network segment?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "IP Address"},
            {"id": "B", "text": "Media Access Control (MAC) Address (48-bit)"},
            {"id": "C", "text": "Port Number"},
            {"id": "D", "text": "Socket Descriptor"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "A MAC address is a 48-bit globally unique hardware identifier burned into the NIC (formatted as 6 pairs of hexadecimal digits like 00:1A:2B:3C:4D:5E). Layer 2 Ethernet switches switch frames based on MAC addresses.",
        "tags": ["MAC Address", "Data Link Layer", "Ethernet"]
    },
    {
        "question_text": "What is the valid port range for TCP and UDP communication endpoints?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "0 to 255"},
            {"id": "B", "text": "0 to 1,024"},
            {"id": "C", "text": "0 to 65,535 (16 bits)"},
            {"id": "D", "text": "0 to 4,294,967,295"}
        ],
        "correct_option_id": "C",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "Transport layer headers allocate 16 bits for Source Port and 16 bits for Destination Port, yielding 2^16 = 65,536 total possible port numbers (0 to 65535). 0-1023 are Well-Known ports.",
        "tags": ["Port Numbers", "Transport Layer", "TCP/UDP"]
    },
    {
        "question_text": "What does the HTTP 404 response status code signify?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Request Succeeded (OK)"},
            {"id": "B", "text": "Unauthorized authentication credentials"},
            {"id": "C", "text": "Not Found (The server cannot locate the requested resource URI)"},
            {"id": "D", "text": "Internal Server Error"}
        ],
        "correct_option_id": "C",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "HTTP status codes in the 4xx range indicate client-side errors. Specifically, 404 Not Found indicates that the origin server did not find a current representation for the target resource.",
        "tags": ["HTTP Status Codes", "Web Protocols", "Application Layer"]
    },
    {
        "question_text": "What is the function of the Default Gateway in a local network host's IP routing configuration?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "To filter email spam"},
            {"id": "B", "text": "The router interface address to which a host forwards IP packets destined for external IP subnets outside its local subnet mask"},
            {"id": "C", "text": "To assign hostnames to printers"},
            {"id": "D", "text": "To provide power over Ethernet"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "When a host determines that the destination IP address does not reside within its local broadcast domain (via bitwise AND with its subnet mask), it routes the packet to the Default Gateway's MAC address.",
        "tags": ["Default Gateway", "Routing", "IP Configuration"]
    },
    {
        "question_text": "How does an Ethernet Switch (Layer 2) improve network performance compared to a legacy Ethernet Hub (Layer 1)?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "A hub creates dedicated point-to-point connections; a switch broadcasts all traffic"},
            {"id": "B", "text": "A switch maintains a MAC address table to forward frames exclusively to the specific destination port, providing microsegmentation and eliminating collisions; a hub blindly broadcasts all incoming bits to every port"},
            {"id": "C", "text": "A hub operates at gigabit speeds while a switch operates at 10 Mbps"},
            {"id": "D", "text": "A switch converts Ethernet into radio signals"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "Hubs repeat physical signals to all connected cables in a single shared collision domain. Switches inspect destination MAC headers, forwarding traffic only to the designated port and enabling full-duplex simultaneous communications.",
        "tags": ["Switch vs Hub", "Collision Domain", "Data Link Layer"]
    },
    {
        "question_text": "Which network utility uses ICMP (Internet Control Message Protocol) Echo Request and Echo Reply messages to test host reachability and round-trip time?",
        "code_snippet": "PING 8.8.8.8 (8.8.8.8): 56 data bytes\n64 bytes from 8.8.8.8: icmp_seq=0 ttl=118 time=14.2 ms",
        "options": [
            {"id": "A", "text": "ping"},
            {"id": "B", "text": "traceroute"},
            {"id": "C", "text": "netstat"},
            {"id": "D", "text": "nslookup"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "The ping command sends ICMP Type 8 (Echo Request) packets and measures the elapsed duration until receiving an ICMP Type 0 (Echo Reply), reporting round-trip latency and packet drop rates.",
        "tags": ["ICMP", "Ping", "Diagnostics"]
    },
    {
        "question_text": "What is the broadcast IPv4 address for a local network subnet configured with 192.168.1.0/24?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "192.168.1.0"},
            {"id": "B", "text": "192.168.1.1"},
            {"id": "C", "text": "192.168.1.254"},
            {"id": "D", "text": "192.168.1.255"}
        ],
        "correct_option_id": "D",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "In a /24 subnet (mask 255.255.255.0), the first 24 bits designate the network ID (192.168.1.0) and the remaining 8 bits designate host addresses. Setting all host bits to 1 (255) defines the subnet broadcast address.",
        "tags": ["Subnetting", "Broadcast Address", "IPv4"]
    },
    {
        "question_text": "What is the difference between Full-Duplex and Half-Duplex transmission modes?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Full-duplex allows simultaneous bidirectional communication on the medium; half-duplex allows communication in both directions, but only one direction at a time"},
            {"id": "B", "text": "Half-duplex uses two cables; full-duplex uses half a cable"},
            {"id": "C", "text": "Full-duplex is limited to 100 meters"},
            {"id": "D", "text": "There is no functional difference"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "Walkie-talkies are half-duplex (one speaker at a time). Telephone conversations and modern switched Ethernet are full-duplex (both parties can transmit and receive data frames concurrently over separate wire pairs).",
        "tags": ["Full-Duplex", "Half-Duplex", "Physical Layer"]
    },

    # MEDIUM (14)
    {
        "question_text": "What sequence of packets constitutes the TCP Three-Way Handshake used to establish a reliable connection between Client and Server?",
        "code_snippet": "Client                     Server\n  |                          |\n  | ---- (Step 1: ???) ----> |\n  | <--- (Step 2: ???) ----- |\n  | ---- (Step 3: ???) ----> |",
        "options": [
            {"id": "A", "text": "Step 1: SYN, Step 2: SYN-ACK, Step 3: ACK"},
            {"id": "B", "text": "Step 1: ACK, Step 2: SYN, Step 3: FIN"},
            {"id": "C", "text": "Step 1: HELLO, Step 2: READY, Step 3: GO"},
            {"id": "D", "text": "Step 1: RST, Step 2: PSH, Step 3: URG"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "1. Client sends SYN with initial sequence number (ISN_c); 2. Server replies with SYN-ACK, acknowledging ISN_c+1 and offering ISN_s; 3. Client sends ACK with ISN_s+1. Both endpoints are now synchronized.",
        "tags": ["TCP Handshake", "SYN-ACK", "Transport Layer"]
    },
    {
        "question_text": "In the TCP sliding window flow control protocol, what does the 'Receive Window' (rwnd) field advertised by the receiver indicate?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "The maximum bandwidth in megabits per second"},
            {"id": "B", "text": "The amount of buffer space currently free in the receiver's socket buffer, informing the sender how many unacknowledged bytes it may transmit without overflowing the receiver"},
            {"id": "C", "text": "The physical monitor display width"},
            {"id": "D", "text": "The total number of packets dropped by routers along the path"}
        ],
        "correct_option_id": "B",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Flow control protects the receiver from being overwhelmed by a fast sender. The receiver reports its available receive buffer size (rwnd) in every ACK header; the sender limits in-flight bytes to min(cwnd, rwnd).",
        "tags": ["Flow Control", "Sliding Window", "TCP", "rwnd"]
    },
    {
        "question_text": "In TCP Congestion Control (Tahoe / Reno), how does the Congestion Window (cwnd) grow during the 'Slow Start' phase upon receiving positive ACKs?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Linearly: cwnd increases by 1 MSS per round trip time (RTT)"},
            {"id": "B", "text": "Exponentially: cwnd doubles every RTT (increasing by 1 MSS for every received valid ACK) until reaching the slow-start threshold (ssthresh)"},
            {"id": "C", "text": "It remains strictly constant"},
            {"id": "D", "text": "It decreases by half on every ACK"}
        ],
        "correct_option_id": "B",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Despite its name, Slow Start probes available bandwidth with exponential growth: starting at an initial window of 1-10 MSS, each ACK increments cwnd by 1 MSS, effectively doubling the window every round trip time.",
        "tags": ["Congestion Control", "Slow Start", "TCP", "cwnd"]
    },
    {
        "question_text": "What protocol resolves a known Layer 3 IP address to its corresponding Layer 2 MAC address on an Ethernet local area network?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Address Resolution Protocol (ARP)"},
            {"id": "B", "text": "Dynamic Host Configuration Protocol (DHCP)"},
            {"id": "C", "text": "Border Gateway Protocol (BGP)"},
            {"id": "D", "text": "Simple Network Management Protocol (SNMP)"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "ARP broadcasts an 'ARP Request' packet to FF:FF:FF:FF:FF:FF asking 'Who has IP X.X.X.X? Tell Y.Y.Y.Y'. The host with that IP unicasts an 'ARP Reply' containing its hardware MAC address.",
        "tags": ["ARP", "Data Link Layer", "Address Resolution"]
    },
    {
        "question_text": "What is the primary operational difference between Distance-Vector routing (RIP) and Link-State routing (OSPF)?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Distance-vector routers share their full routing table with immediate neighbors using Bellman-Ford; link-state routers broadcast connectivity state to all network routers, running Dijkstra's SPF algorithm on the complete global topology graph"},
            {"id": "B", "text": "Distance-vector only works with optical fiber"},
            {"id": "C", "text": "OSPF cannot detect link failures"},
            {"id": "D", "text": "RIP guarantees zero convergence time in all networks"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Distance-Vector is 'routing by rumor' (sharing distance vectors to immediate peers). Link-State (OSPF/IS-IS) floods Link State Advertisements (LSAs) so every node builds an identical topology map and computes shortest paths via Dijkstra.",
        "tags": ["OSPF", "RIP", "Routing Protocols", "Link-State vs Distance-Vector"]
    },
    {
        "question_text": "How does Network Address Translation (NAT) with Port Address Translation (NAPT / PAT) allow hundreds of internal private hosts to share a single public IPv4 address?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "By rewriting source IP addresses to the public IP and mapping each private host's connection to a unique source TCP/UDP port number in an in-memory translation table"},
            {"id": "B", "text": "By compressing IP packets using gzip"},
            {"id": "C", "text": "By converting all traffic to DNS text records"},
            {"id": "D", "text": "By disabling the TCP handshake"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "PAT multiplexes traffic across a single external IPv4 address by assigning distinct ephemeral port numbers (e.g. 192.168.1.5:4500 -> 203.0.113.1:50001), allowing routers to demultiplex returning response packets.",
        "tags": ["NAT", "PAT", "Network Layer", "IPv4"]
    },
    {
        "question_text": "Why does the TCP protocol enter the TIME_WAIT state for 2 * Maximum Segment Lifetime (2*MSL) upon closing a connection?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "To allow time for the final ACK to reach the remote peer (and retransmit if lost), and to ensure delayed stale duplicate segments from the old connection die out in the network before port reuse"},
            {"id": "B", "text": "To wait for the operating system to shut down"},
            {"id": "C", "text": "To charge the client for bandwidth usage"},
            {"id": "D", "text": "Because RFC 793 requires a 10-minute pause"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "If the active closer's final ACK is lost, the peer retransmits FIN; the closer in TIME_WAIT can resend the ACK. Furthermore, waiting 2*MSL (typically 60-120 seconds) drains any phantom segments wandering through old internet routes.",
        "tags": ["TIME_WAIT", "TCP Teardown", "MSL"]
    },
    {
        "question_text": "How does TLS 1.3 achieve a 1-RTT handshake compared to the legacy 2-RTT handshake in TLS 1.2?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "The client generates and sends speculative Diffie-Hellman key shares directly inside its initial ClientHello message, allowing the server to derive symmetric session keys and finish the handshake in one round trip"},
            {"id": "B", "text": "TLS 1.3 disables public key cryptography entirely"},
            {"id": "C", "text": "TLS 1.3 transmits passwords in plain text"},
            {"id": "D", "text": "TLS 1.3 operates at Layer 2 instead of Layer 4"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "TLS 1.2 required negotiating cipher suites in Round 1 before exchanging key parameters in Round 2. TLS 1.3 pruned outdated algorithms and has the client guess common key exchange groups (X25519) up-front, completing encryption setup in 1 RTT.",
        "tags": ["TLS 1.3", "Cryptography", "Handshake Latency", "HTTPS"]
    },
    {
        "question_text": "What problem does the Border Gateway Protocol (BGP) solve that interior routing protocols (like OSPF) cannot handle?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "It routes traffic across independent Autonomous Systems (AS) across the global Internet using policy-based path-vector routing rather than simple shortest metric calculation"},
            {"id": "B", "text": "It speeds up home Wi-Fi speeds"},
            {"id": "C", "text": "It assigns IP addresses to smartphones automatically"},
            {"id": "D", "text": "It replaces Ethernet cables with radio frequencies"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "BGP is the exterior gateway protocol glue of the global Internet. Because ISPs have business agreements, peering policies, and country-level transit rules, BGP routes based on administrative policies, AS-Paths, and commercial peering contracts.",
        "tags": ["BGP", "Autonomous Systems", "Internet Routing"]
    },
    {
        "question_text": "What is Head-of-Line (HoL) Blocking at the application layer in HTTP/1.1 with pipelining, and how does HTTP/2 solve it?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "In HTTP/1.1, responses on a TCP connection must be returned in the exact order requested; HTTP/2 splits streams into independent interleaved frames multiplexed across a single TCP socket"},
            {"id": "B", "text": "HTTP/1.1 blocks if images are larger than 1MB"},
            {"id": "C", "text": "HTTP/2 requires fiber optic cabling to function"},
            {"id": "D", "text": "HTTP/1.1 cannot transmit JSON data"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "In HTTP/1.1 pipelining, if request 1 takes 5 seconds to compute, responses for requests 2 and 3 are stalled behind it on the TCP pipe. HTTP/2 introduces binary framing and stream IDs, interleaving chunked frames without strict sequential blocking.",
        "tags": ["HTTP/2", "HTTP/1.1", "Multiplexing", "HoL Blocking"]
    },
    {
        "question_text": "What are the four sequential message exchanges in the Dynamic Host Configuration Protocol (DHCP) DORA process?",
        "code_snippet": "Client                       DHCP Server\n  | --- (D: Discover) ------> |\n  | <--- (O: Offer) --------- |\n  | --- (R: Request) -------> |\n  | <--- (A: Acknowledge) --- |",
        "options": [
            {"id": "A", "text": "Discover, Offer, Request, Acknowledge (DORA)"},
            {"id": "B", "text": "Declare, Obtain, Receive, Authorize"},
            {"id": "C", "text": "Detect, Open, Route, Allocate"},
            {"id": "D", "text": "Dial, Order, Release, Accept"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "1. Client broadcasts DHCPDISCOVER; 2. Server responds with DHCPOFFER proposing an IP; 3. Client broadcasts DHCPREQUEST accepting the lease; 4. Server replies with DHCPACK confirming lease duration, subnet mask, and DNS.",
        "tags": ["DHCP", "DORA", "Network Configuration"]
    },
    {
        "question_text": "What occurs when an IPv4 packet exceeds the Maximum Transmission Unit (MTU) of an intermediate link and has its Don't Fragment (DF) bit set to 1?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "The router fragments the packet anyway"},
            {"id": "B", "text": "The router drops the packet and transmits an ICMP Type 3 Code 4 ('Fragmentation Needed and DF set') message back to the source host for Path MTU Discovery (PMTUD)"},
            {"id": "C", "text": "The packet is rerouted to a satellite link"},
            {"id": "D", "text": "The router increases its MTU dynamically"}
        ],
        "correct_option_id": "B",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "The DF bit prohibits fragmentation. When too large for the link, the router must discard the packet and alert the sender via ICMP, including the Next-Hop MTU value so the sender can adjust its packet size (Path MTU Discovery).",
        "tags": ["MTU", "Fragmentation", "PMTUD", "ICMP"]
    },
    {
        "question_text": "In IEEE 802.1Q Virtual Local Area Networks (VLANs), where is the 4-byte VLAN tag inserted inside an Ethernet frame?",
        "code_snippet": "| Preamble | Dest MAC | Src MAC | [802.1Q Tag: 4 Bytes] | EtherType | Payload | FCS |",
        "options": [
            {"id": "A", "text": "Between the Source MAC address and the EtherType/Length field"},
            {"id": "B", "text": "At the very end of the frame after the FCS checksum"},
            {"id": "C", "text": "Inside the IP packet header"},
            {"id": "D", "text": "Before the Preamble sequence"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "802.1Q inserts a 4-byte header containing a 12-bit VLAN Identifier (VID, supporting 4,096 VLANs) and 3-bit Priority Code Point (PCP) directly between the Source MAC address and the EtherType field on trunk links.",
        "tags": ["VLAN", "802.1Q", "Ethernet Frame", "Trunking"]
    },
    {
        "question_text": "How does ARP Spoofing (ARP Poisoning) compromise a local switched network segment?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "By flooding the physical cable with high voltage"},
            {"id": "B", "text": "By sending unsolicited (gratuitous) fake ARP replies to poison victim hosts' ARP caches, binding the gateway's IP address to the attacker's MAC address for Man-in-the-Middle (MitM) interception"},
            {"id": "C", "text": "By disabling the DNS server on the gateway"},
            {"id": "D", "text": "By changing the WiFi SSID password"}
        ],
        "correct_option_id": "B",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Because traditional ARP is stateless and unauthenticated, devices unconditionally update their ARP cache upon receiving ARP replies. An attacker broadcasts fake replies claiming to own the gateway IP, routing all victim traffic through the attacker.",
        "tags": ["ARP Spoofing", "Network Security", "MitM"]
    },

    # HARD (7)
    {
        "question_text": "How does Google's TCP BBR (Bottleneck Bandwidth and RTT) congestion control algorithm fundamentally differ from loss-based algorithms like TCP Cubic or Reno?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "BBR models the physical network by measuring maximum delivery rate (BtlBw) and minimum round-trip time (RTprop), operating at Kleinrock's optimal operating point rather than interpreting packet loss as congestion"},
            {"id": "B", "text": "BBR intentionally drops 10% of packets to test router reliability"},
            {"id": "C", "text": "BBR uses UDP transport exclusively"},
            {"id": "D", "text": "BBR requires specialized hardware inside every intermediate internet router"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "Loss-based algorithms (Cubic/Reno) pump data until buffers fill and packets drop, causing bufferbloat and latency spikes. BBR measures bandwidth-delay product (BDP = BtlBw * RTprop), keeping inflight data capped at pipe capacity without queuing delay.",
        "tags": ["TCP BBR", "TCP Cubic", "Congestion Control", "Bufferbloat"]
    },
    {
        "question_text": "How does the QUIC protocol (HTTP/3) resolve the Transport-Layer Head-of-Line blocking inherent to HTTP/2 over TCP?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "By running over UDP and implementing independent per-stream retransmission queues: a dropped packet on Stream A pauses only Stream A, while Streams B and C continue uninterrupted"},
            {"id": "B", "text": "By disabling retransmissions entirely like live audio streaming"},
            {"id": "C", "text": "By allocating a dedicated physical fiber optic core for every HTTP connection"},
            {"id": "D", "text": "By requiring clients to open 100 simultaneous TCP connections"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "In HTTP/2 over TCP, if a single TCP packet is dropped, TCP blocks ALL byte stream delivery until the packet is retransmitted (transport HoL blocking). QUIC operates over UDP with independent cryptographic streams; packet loss in one stream never blocks other streams.",
        "tags": ["QUIC", "HTTP/3", "Transport Layer", "UDP"]
    },
    {
        "question_text": "How do SYN Cookies defend against TCP SYN Flood Denial-of-Service attacks without consuming server memory state?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "The server does not allocate a SYN-Queue (half-open connection) buffer; instead, it encodes a cryptographic hash of (src IP, src port, dst IP, dst port, timestamp, secret) into the initial sequence number of the SYN-ACK"},
            {"id": "B", "text": "By blocking all incoming TCP connections from unknown IP addresses"},
            {"id": "C", "text": "By replying with ICMP destination unreachable packets"},
            {"id": "D", "text": "By dynamically increasing RAM allocation on the host"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "SYN floods exhaust kernel memory buffers (backlog queue). With SYN cookies, the server stores NO state. When the legitimate client sends the final ACK (with seq+1), the server verifies the cryptographic hash in the ACK number and instantiates the socket only then.",
        "tags": ["SYN Flood", "SYN Cookies", "DDoS Mitigation", "TCP Security"]
    },
    {
        "question_text": "In Variable Length Subnet Masking (VLSM), how do you partition 192.168.10.0/24 to support Subnet A (100 hosts), Subnet B (50 hosts), and Subnet C (20 hosts) with minimal waste?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Subnet A: /25 (128 addresses), Subnet B: /26 (64 addresses), Subnet C: /27 (32 addresses)"},
            {"id": "B", "text": "Subnet A: /24, Subnet B: /24, Subnet C: /24"},
            {"id": "C", "text": "Subnet A: /28, Subnet B: /28, Subnet C: /28"},
            {"id": "D", "text": "Subnet A: /26, Subnet B: /26, Subnet C: /26"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "100 hosts requires 2^7 = 128 block (/25, usable 126 hosts: .0 - .127). 50 hosts requires 2^6 = 64 block (/26, usable 62 hosts: .128 - .191). 20 hosts requires 2^5 = 32 block (/27, usable 30 hosts: .192 - .223). This cleanly fits in /24 without overlap.",
        "tags": ["VLSM", "CIDR", "Subnetting", "IP Engineering"]
    },
    {
        "question_text": "In BGP path-vector routing, how are routing loops systematically prevented between Autonomous Systems?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Every BGP router prepends its own Autonomous System Number (ASN) to the AS_PATH attribute; if a router receives an update containing its OWN ASN in the path, it discards the route"},
            {"id": "B", "text": "BGP routers perform ping tests every 10 milliseconds"},
            {"id": "C", "text": "BGP routers enforce a maximum hop limit of 15 hops like RIP"},
            {"id": "D", "text": "By calculating spanning trees using the 802.1D protocol"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "AS_PATH lists every ASN through which the prefix advertisement has traveled. When a BGP border speaker inspects incoming routes, seeing its own ASN in the AS_PATH proves the update has looped back, prompting immediate silent rejection.",
        "tags": ["BGP", "AS_PATH", "Loop Prevention", "Inter-Domain Routing"]
    },
    {
        "question_text": "Why does Diffie-Hellman Ephemeral (DHE / ECDHE) key exchange provide Perfect Forward Secrecy (PFS) where RSA static key exchange fails?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "DHE generates unique ephemeral key pairs per session; compromising the server's long-term private key later cannot decrypt previously recorded network traffic because ephemeral keys were destroyed after the session"},
            {"id": "B", "text": "DHE uses symmetric encryption keys exclusively"},
            {"id": "C", "text": "RSA static exchange does not use certificates"},
            {"id": "D", "text": "DHE keys are stored permanently in browser cookies"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "In RSA key exchange, the client encrypts the premaster secret with the server's public key. If an adversary records ciphertext and steals the server private key years later, they can decrypt all historical sessions. With Ephemeral DH, keys are discarded after session generation.",
        "tags": ["Perfect Forward Secrecy", "ECDHE", "Cryptography", "TLS"]
    },
    {
        "question_text": "How does Cyclic Redundancy Check (CRC-32) detect burst errors in Ethernet Data Link frames?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "By appending a 32-bit checksum representing the remainder of binary polynomial division (modulo-2 arithmetic in Galois Field GF(2)) of the data bits by a standard generator polynomial (e.g. 0x04C11DB7)"},
            {"id": "B", "text": "By adding all byte values together in base 10"},
            {"id": "C", "text": "By checking parity bits on each individual ASCII character"},
            {"id": "D", "text": "By counting the total number of zeros in the frame"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "CRC treats bit streams as coefficients of polynomials over GF(2). Dividing data by a generator polynomial produces a remainder (FCS). The receiver recalculates division: any bit errors of length <= generator degree (32 bits) or odd bit errors are mathematically detected.",
        "tags": ["CRC-32", "Polynomial Arithmetic", "Error Detection", "Data Link"]
    },

    # BOSS (2)
    {
        "question_text": "BOSS BATTLE // THE BGP FLAP DAMPING MONARCH:\nIn high-volume internet transit, what is Route Flap Damping (RFC 2439) in BGP, and how does it prevent global routing table instability?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "It assigns penalty points to prefixes each time their withdrawal/announcement state flaps; when cumulative penalty breaches a suppress threshold, the route is suppressed from forwarding, decaying exponentially over a half-life until reaching a reuse threshold"},
            {"id": "B", "text": "It resets all router interfaces whenever an error packet is detected"},
            {"id": "C", "text": "It converts all BGP announcements into static IP routes"},
            {"id": "D", "text": "It disables peering sessions with any network located in another continent"}
        ],
        "correct_option_id": "A",
        "difficulty": "Boss",
        "xp_reward": 500,
        "time_limit_seconds": 90,
        "explanation": "Rapidly flapping routes (up/down oscillation) cause cascade BGP recalculations across hundreds of thousands of worldwide routers. Damping penalizes unstable prefixes (e.g. 1000 penalty per flap). Once suppressed, the route is withheld until the penalty decays below reuse threshold, shielding global CPUs.",
        "tags": ["BGP Flap Damping", "Internet Stability", "Autonomous Systems", "Boss Challenge"]
    },
    {
        "question_text": "BOSS BATTLE // THE PAWS MONARCH:\nOn modern 100 Gbps networks, how does TCP's Protection Against Wrapped Sequence Numbers (PAWS) mechanism prevent data corruption when the 32-bit sequence number space wraps around within seconds?",
        "code_snippet": "// At 100 Gbps, 2^32 bytes (~4.29 GB) wraps in ~343 milliseconds!\n// How does TCP distinguish old delayed segments from new ones?",
        "options": [
            {"id": "A", "text": "By using the TCP Timestamps option (RFC 7323) to attach a monotonically increasing timestamp to each segment, rejecting arriving segments whose timestamp is older than the current connection's highest verified timestamp"},
            {"id": "B", "text": "By expanding the TCP sequence header to 128 bits dynamically"},
            {"id": "C", "text": "By closing and reopening the TCP connection every 300 milliseconds"},
            {"id": "D", "text": "By limiting maximum bandwidth to 1 Gbps"}
        ],
        "correct_option_id": "A",
        "difficulty": "Boss",
        "xp_reward": 500,
        "time_limit_seconds": 90,
        "explanation": "At high speeds, 4.29 billion sequence numbers wrap faster than the Maximum Segment Lifetime (MSL). A delayed packet from a prior iteration would appear valid within the receiver window. PAWS uses 32-bit millisecond timestamps as a logical high-order sequence extension, discarding segments with TSval < TS.Recent.",
        "tags": ["PAWS", "TCP Timestamps", "High-Performance Networking", "Boss Challenge"]
    }
]
