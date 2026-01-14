#!/usr/bin/env bun
import { Command } from "commander";
import { install } from "./install";
import { run } from "./run";
import { getLocalVersion } from "./get-local-version";
import { doctor } from "./doctor";
import type { InstallArgs } from "./types";
import type { RunOptions } from "./run";
import type { GetLocalVersionOptions } from "./get-local-version/types";
import type { DoctorOptions } from "./doctor";

const packageJson = await import("../../package.json");
const VERSION = packageJson.version;

const program = new Command();

program
  .name("ofx-code")
  .description(
    "The ultimate OpenCode plugin - multi-model orchestration, LSP tools, and more"
  )
  .version(VERSION, "-v, --version", "Show version number");

program
  .command("install")
  .description("Install and configure ofx-code with interactive setup")
  .option("--no-tui", "Run in non-interactive mode (requires all options)")
  .option("--claude <value>", "Claude subscription: no, yes, max20")
  .option("--chatgpt <value>", "ChatGPT subscription: no, yes")
  .option("--gemini <value>", "Gemini integration: no, yes")
  .option("--skip-auth", "Skip authentication setup hints")
  .addHelpText(
    "after",
    `
Examples:
  $ bunx ofx-code install
  $ bunx ofx-code install --no-tui --claude=max20 --chatgpt=yes --gemini=yes
  $ bunx ofx-code install --no-tui --claude=no --chatgpt=no --gemini=no

Model Providers:
  Claude      Required for Sisyphus (main orchestrator) and Librarian agents
  ChatGPT     Powers the Oracle agent for debugging and architecture
  Gemini      Powers frontend, documentation, and multimodal agents
`
  )
  .action(async (options) => {
    const args: InstallArgs = {
      tui: options.tui !== false,
      claude: options.claude,
      chatgpt: options.chatgpt,
      gemini: options.gemini,
      skipAuth: options.skipAuth ?? false,
    };
    const exitCode = await install(args);
    process.exit(exitCode);
  });

program
  .command("run <message>")
  .description("Run opencode with todo/background task completion enforcement")
  .option("-a, --agent <name>", "Agent to use (default: Sisyphus)")
  .option("-d, --directory <path>", "Working directory")
  .option(
    "-t, --timeout <ms>",
    "Timeout in milliseconds (default: 30 minutes)",
    parseInt
  )
  .addHelpText(
    "after",
    `
Examples:
  $ bunx ofx-code run "Fix the bug in index.ts"
  $ bunx ofx-code run --agent Sisyphus "Implement feature X"
  $ bunx ofx-code run --timeout 3600000 "Large refactoring task"

Unlike 'opencode run', this command waits until:
  - All todos are completed or cancelled
  - All child sessions (background tasks) are idle
`
  )
  .action(async (message: string, options) => {
    const runOptions: RunOptions = {
      message,
      agent: options.agent,
      directory: options.directory,
      timeout: options.timeout,
    };
    const exitCode = await run(runOptions);
    process.exit(exitCode);
  });

program
  .command("get-local-version")
  .description("Show current installed version and check for updates")
  .option("-d, --directory <path>", "Working directory to check config from")
  .option("--json", "Output in JSON format for scripting")
  .addHelpText(
    "after",
    `
Examples:
  $ bunx ofx-code get-local-version
  $ bunx ofx-code get-local-version --json
  $ bunx ofx-code get-local-version --directory /path/to/project

This command shows:
  - Current installed version
  - Latest available version on npm
  - Whether you're up to date
  - Special modes (local dev, pinned version)
`
  )
  .action(async (options) => {
    const versionOptions: GetLocalVersionOptions = {
      directory: options.directory,
      json: options.json ?? false,
    };
    const exitCode = await getLocalVersion(versionOptions);
    process.exit(exitCode);
  });

program
  .command("doctor")
  .description("Check ofx-code installation health and diagnose issues")
  .option("--verbose", "Show detailed diagnostic information")
  .option("--json", "Output results in JSON format")
  .option("--category <category>", "Run only specific category")
  .addHelpText(
    "after",
    `
Examples:
  $ bunx ofx-code doctor
  $ bunx ofx-code doctor --verbose
  $ bunx ofx-code doctor --json
  $ bunx ofx-code doctor --category authentication

Categories:
  installation     Check OpenCode and plugin installation
  configuration    Validate configuration files
  authentication   Check auth provider status
  dependencies     Check external dependencies
  tools            Check LSP and MCP servers
  updates          Check for version updates
`
  )
  .action(async (options) => {
    const doctorOptions: DoctorOptions = {
      verbose: options.verbose ?? false,
      json: options.json ?? false,
      category: options.category,
    };
    const exitCode = await doctor(doctorOptions);
    process.exit(exitCode);
  });

program
  .command("version")
  .description("Show version information")
  .action(() => {
    console.log(`ofx-code v${VERSION}`);
  });

program.parse();
