import * as fs from "node:fs";

// Load environment variables explicitly
for (const envPath of [".env", ".env.local"]) {
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = (match[2] || "").trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

import { colibriClient } from "../src/lib/socrates/colibriClient";
import { POST as chatHandler } from "../src/app/api/socrates/chat/route";
import { GET as healthHandler } from "../src/app/api/socrates/health/route";
import { NextRequest } from "next/server";

async function runLiveVerification() {
  console.log("==================================================");
  console.log(" CLASS ROYALE — LIVE COLIBRI & WEB APP VERIFIER");
  console.log(" Timestamp:", new Date().toISOString());
  console.log("==================================================\n");

  // Step 1: Direct Health Probe to Colibri
  console.log("--- 1. Probing Colibri via colibriClient ---");
  try {
    const health = await colibriClient.checkHealth();
    console.log("  Health Result:", JSON.stringify(health, null, 2));
    if (!health.online) {
      console.error("❌ Colibri health check reported offline!");
    } else {
      console.log("✔ Colibri is ONLINE and healthy! Active model:", health.model);
    }
  } catch (err: any) {
    console.error("❌ Error probing Colibri health:", err.message);
  }

  // Step 2: Next.js /api/socrates/health route check
  console.log("\n--- 2. Invoking Next.js /api/socrates/health Handler ---");
  try {
    const res = await healthHandler(
      new NextRequest("http://localhost:3000/api/socrates/health")
    );
    const data = await res.json();
    console.log("  HTTP Status:", res.status);
    console.log("  Response Body:", JSON.stringify(data, null, 2));
    if (data.online) {
      console.log("✔ Next.js /api/socrates/health reports Colibri ONLINE!");
    } else {
      console.warn("⚠ Next.js reported offline or error:", data);
    }
  } catch (err: any) {
    console.error("❌ Error testing health route:", err.message);
  }

  // Step 3: Next.js /api/socrates/chat Route End-to-End Execution (Colibri + Qwen via Web App)
  console.log("\n--- 3. Invoking Next.js /api/socrates/chat Route End-to-End ---");
  try {
    const chatReq = new NextRequest("http://localhost:3000/api/socrates/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "What is polymorphism? Explain in 1 concise sentence.",
        stream: true,
      }),
    });

    console.log("  Sending query to /api/socrates/chat: 'What is polymorphism? Explain in 1 concise sentence.'");
    const chatRes = await chatHandler(chatReq);
    console.log("  Chat Route HTTP Status:", chatRes.status);
    console.log("  Chat Route Content-Type:", chatRes.headers.get("content-type"));

    if (chatRes.status === 200 && chatRes.body) {
      console.log("  Reading SSE stream from chat route...");
      const reader = chatRes.body.getReader();
      const decoder = new TextDecoder();
      let sseOutput = "";
      let chunkCount = 0;
      let textDeltas = "";
      const streamStart = Date.now();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunkCount++;
        const text = decoder.decode(value, { stream: true });
        sseOutput += text;

        // Parse SSE lines
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.delta) {
                textDeltas += data.delta;
                process.stdout.write(data.delta);
              } else if (data.stage) {
                console.log(`\n  [Stage Event]: ${data.stage} -> ${data.text}`);
              }
            } catch {}
          }
        }
      }
      const streamDuration = Date.now() - streamStart;
      console.log(`\n\n✔ Web app /api/socrates/chat successfully streamed ${chunkCount} chunks in ${streamDuration}ms!`);
      console.log("  Complete Socrates Response:\n", textDeltas.trim());
      const hasTokenEvent = sseOutput.includes("event: token");
      const hasDoneEvent = sseOutput.includes("event: done");
      console.log(`  SSE stream validation: hasToken=${hasTokenEvent}, hasDone=${hasDoneEvent}`);
    } else {
      const errBody = await chatRes.json();
      console.error("❌ Chat route returned error status:", chatRes.status, errBody);
    }
  } catch (err: any) {
    console.error("❌ Chat route end-to-end failed:", err.message);
  }

  console.log("\n==================================================");
  console.log(" LIVE VERIFICATION SUITE FINISHED");
  console.log("==================================================");
}

runLiveVerification().catch(console.error);
