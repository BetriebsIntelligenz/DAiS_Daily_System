#!/usr/bin/env node

/**
 * Starts Next.js on an available port so `npm run dev` keeps working even if the default port is busy.
 */
const { spawn } = require("node:child_process");
const net = require("node:net");

const DEFAULT_PORT = 3002;
const MAX_ATTEMPTS = 10;
const [, , nextCommandArg, ...nextExtraArgs] = process.argv;
const nextCommand = nextCommandArg ?? "dev";

function parsePort(value) {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed >= 65535) {
    return null;
  }
  return parsed;
}

function isPortAvailable(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once("error", (error) => {
      if (error.code === "EADDRINUSE" || error.code === "EACCES") {
        resolve(false);
        return;
      }
      reject(error);
    });

    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, "0.0.0.0");
  });
}

async function pickPort() {
  const envPort = parsePort(process.env.PORT);
  if (envPort !== null) {
    if (await isPortAvailable(envPort)) {
      return { port: envPort, fallbackUsed: false };
    }
    throw new Error(
      `Der konfigurierte Port ${envPort} ist bereits belegt. Setze PORT auf einen freien Wert.`
    );
  }

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const port = DEFAULT_PORT + attempt;
    if (await isPortAvailable(port)) {
      return { port, fallbackUsed: attempt !== 0 };
    }
  }
  throw new Error(
    `Es konnte kein freier Port im Bereich ${DEFAULT_PORT}-${DEFAULT_PORT + MAX_ATTEMPTS - 1} gefunden werden.`
  );
}

async function main() {
  try {
    const { port, fallbackUsed } = await pickPort();
    if (fallbackUsed) {
      console.warn(
        `[dev] Port ${DEFAULT_PORT} ist belegt. Verwende stattdessen Port ${port}.`
      );
    }

    const nextArgs = [nextCommand, "-p", String(port), ...nextExtraArgs];
    const child = spawn("next", nextArgs, {
      stdio: "inherit",
      env: { ...process.env, PORT: String(port) }
    });

    child.on("exit", (code, signal) => {
      if (signal) {
        process.kill(process.pid, signal);
        return;
      }
      process.exit(code ?? 0);
    });

    child.on("error", (error) => {
      console.error("[dev] Next.js konnte nicht gestartet werden.", error);
      process.exit(1);
    });
  } catch (error) {
    console.error(error.message ?? error);
    process.exit(1);
  }
}

main();
