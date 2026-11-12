/**
 * =============================================================================
 * KNOWLEDGE KINGDOM: Lightweight TypeScript Test Runner
 * Target: tests/run-all-tests.ts
 *
 * Zero external test framework dependencies.
 * Discovers and executes all *.test.ts files across tests/ (or filtered subset),
 * handles synchronous and asynchronous test suites, displays a formatted
 * execution matrix, and exits with code 0 on pass or code 1 on fail.
 * =============================================================================
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

// ANSI escape codes for high-contrast, clean console output
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  bgGreen: "\x1b[42m\x1b[30m",
  bgRed: "\x1b[41m\x1b[37m",
};

export interface TestCase {
  name: string;
  fn: () => void | Promise<void>;
}

export interface TestSuite {
  name: string;
  cases: TestCase[];
  beforeEachHooks: Array<() => void | Promise<void>>;
  afterEachHooks: Array<() => void | Promise<void>>;
}

class TestRegistry {
  private suites: TestSuite[] = [];
  private currentSuite: TestSuite | null = null;

  registerSuite(name: string): TestSuite {
    const suite: TestSuite = {
      name,
      cases: [],
      beforeEachHooks: [],
      afterEachHooks: [],
    };
    this.suites.push(suite);
    this.currentSuite = suite;
    return suite;
  }

  registerCase(name: string, fn: () => void | Promise<void>) {
    if (!this.currentSuite) {
      this.registerSuite("Default Suite");
    }
    this.currentSuite!.cases.push({ name, fn });
  }

  registerBeforeEach(fn: () => void | Promise<void>) {
    if (!this.currentSuite) this.registerSuite("Default Suite");
    this.currentSuite!.beforeEachHooks.push(fn);
  }

  registerAfterEach(fn: () => void | Promise<void>) {
    if (!this.currentSuite) this.registerSuite("Default Suite");
    this.currentSuite!.afterEachHooks.push(fn);
  }

  getSuites(): TestSuite[] {
    return this.suites;
  }

  clear() {
    this.suites = [];
    this.currentSuite = null;
  }
}

// Global registry shared during test suite execution
const registry = new TestRegistry();

export function describe(name: string, fn: () => void | Promise<void>) {
  registry.registerSuite(name);
  fn();
}

export function it(name: string, fn: () => void | Promise<void>) {
  registry.registerCase(name, fn);
}

export const test = it;

export function beforeEach(fn: () => void | Promise<void>) {
  registry.registerBeforeEach(fn);
}

export function afterEach(fn: () => void | Promise<void>) {
  registry.registerAfterEach(fn);
}

// Recursive test file scanner
export async function discoverTestFiles(
  baseDir: string,
  filterPattern?: string
): Promise<string[]> {
  const testFiles: string[] = [];

  function scan(dir: string) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (
        entry.isFile() &&
        entry.name.endsWith(".test.ts") &&
        entry.name !== "run-all-tests.ts"
      ) {
        if (!filterPattern || fullPath.toLowerCase().includes(filterPattern.toLowerCase())) {
          testFiles.push(fullPath);
        }
      }
    }
  }

  scan(baseDir);
  return testFiles.sort();
}

// Main test execution harness
export async function runAllTests(
  targetDir: string,
  filterPattern?: string
): Promise<boolean> {
  const globalStartTime = Date.now();

  console.log(`\n${colors.bold}${colors.cyan}=======================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  KNOWLEDGE KINGDOM AUTOMATED TEST HARNESS             ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}=======================================================${colors.reset}\n`);

  const testFiles = await discoverTestFiles(targetDir, filterPattern);

  if (testFiles.length === 0) {
    console.log(
      `${colors.yellow}No test files discovered matching: "${filterPattern || "*"}"${colors.reset}\n`
    );
    return true;
  }

  console.log(
    `${colors.gray}Discovered ${testFiles.length} test file(s). Executing test suites...\n${colors.reset}`
  );

  let totalSuites = 0;
  let passedSuites = 0;
  let failedSuites = 0;
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const filePath of testFiles) {
    const relPath = path.relative(process.cwd(), filePath);
    registry.clear();

    const fileStartTime = Date.now();
    let loadError: Error | null = null;

    try {
      const fileUrl = pathToFileURL(filePath).href;
      await import(fileUrl);
    } catch (err: any) {
      loadError = err;
    }

    const suites = registry.getSuites();
    const fileDurationMs = Date.now() - fileStartTime;

    if (loadError) {
      totalSuites++;
      failedSuites++;
      console.log(
        `${colors.bgRed} FAIL ${colors.reset} ${colors.bold}${relPath}${colors.reset} ${colors.gray}(${fileDurationMs}ms)${colors.reset}`
      );
      console.log(`  ${colors.red}File Import Error:${colors.reset} ${loadError.message}`);
      if (loadError.stack) {
        const stackLines = loadError.stack
          .split("\n")
          .slice(1, 4)
          .map((l) => `  ${colors.gray}${l}${colors.reset}`)
          .join("\n");
        console.log(stackLines);
      }
      console.log("");
      continue;
    }

    for (const suite of suites) {
      totalSuites++;
      const suiteStartTime = Date.now();
      let suitePassed = true;

      const caseResults: Array<{
        name: string;
        passed: boolean;
        durationMs: number;
        error?: Error;
      }> = [];

      for (const tc of suite.cases) {
        totalTests++;
        const caseStartTime = Date.now();
        try {
          for (const hook of suite.beforeEachHooks) {
            await hook();
          }

          await tc.fn();

          for (const hook of suite.afterEachHooks) {
            await hook();
          }

          const durationMs = Date.now() - caseStartTime;
          passedTests++;
          caseResults.push({ name: tc.name, passed: true, durationMs });
        } catch (err: any) {
          const durationMs = Date.now() - caseStartTime;
          failedTests++;
          suitePassed = false;
          caseResults.push({
            name: tc.name,
            passed: false,
            durationMs,
            error: err,
          });
        }
      }

      const suiteDurationMs = Date.now() - suiteStartTime;
      if (suitePassed) {
        passedSuites++;
      } else {
        failedSuites++;
      }

      const badge = suitePassed
        ? `${colors.bgGreen} PASS ${colors.reset}`
        : `${colors.bgRed} FAIL ${colors.reset}`;

      console.log(
        `${badge} ${colors.bold}${relPath}${colors.reset} ${colors.cyan}> ${suite.name}${colors.reset} ${colors.gray}(${suiteDurationMs}ms)${colors.reset}`
      );

      for (const res of caseResults) {
        if (res.passed) {
          console.log(
            `  ${colors.green}✔${colors.reset} ${res.name} ${colors.gray}(${res.durationMs}ms)${colors.reset}`
          );
        } else {
          console.log(
            `  ${colors.red}✖ ${res.name}${colors.reset} ${colors.gray}(${res.durationMs}ms)${colors.reset}`
          );
          if (res.error) {
            console.log(`    ${colors.red}${res.error.message}${colors.reset}`);
            if (res.error.stack) {
              const cleanStack = res.error.stack
                .split("\n")
                .slice(1, 4)
                .map((l) => `    ${colors.gray}${l}${colors.reset}`)
                .join("\n");
              console.log(cleanStack);
            }
          }
        }
      }
      console.log("");
    }
  }

  const elapsedSeconds = ((Date.now() - globalStartTime) / 1000).toFixed(3);

  console.log(`${colors.bold}-------------------------------------------------------${colors.reset}`);
  console.log(
    `${colors.bold}Test Suites:${colors.reset} ${
      failedSuites > 0 ? `${colors.red}${failedSuites} failed, ` : ""
    }${colors.green}${passedSuites} passed${colors.reset}, ${totalSuites} total`
  );
  console.log(
    `${colors.bold}Tests:      ${colors.reset} ${
      failedTests > 0 ? `${colors.red}${failedTests} failed, ` : ""
    }${colors.green}${passedTests} passed${colors.reset}, ${totalTests} total`
  );
  console.log(`${colors.bold}Time:       ${colors.reset} ${elapsedSeconds}s`);
  console.log(`${colors.bold}-------------------------------------------------------${colors.reset}\n`);

  return failedSuites === 0 && failedTests === 0;
}

// CLI runner invocation
if (
  process.argv[1]?.endsWith("run-all-tests.ts") ||
  process.argv[1]?.endsWith("proposed_run-all-tests.ts")
) {
  const testsDir = path.resolve(process.cwd(), "tests");
  const filter = process.argv[2];

  runAllTests(testsDir, filter)
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((err) => {
      console.error("Fatal test runner execution failure:", err);
      process.exit(1);
    });
}
