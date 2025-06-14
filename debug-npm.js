const { spawn } = require("child_process");
const { mkdtempSync, rmSync } = require("fs");
const { join } = require("path");
const { tmpdir } = require("os");

const testDir = mkdtempSync(join(tmpdir(), "npm-debug-"));
console.log("Test dir:", testDir);

const child = spawn("npm", ["init"], {
  cwd: testDir,
  stdio: "pipe",
});

let stdoutBuffer = "";

child.stdout.on("data", (data) => {
  const chunk = data.toString();
  stdoutBuffer += chunk;
  console.log("STDOUT chunk:", JSON.stringify(chunk));
  console.log("STDOUT buffer:", JSON.stringify(stdoutBuffer));
});

child.stderr.on("data", (data) => {
  console.log("STDERR:", JSON.stringify(data.toString()));
});

child.on("close", (code) => {
  console.log("Process exited with code:", code);
  rmSync(testDir, { recursive: true, force: true });
});

// Kill after 5 seconds
setTimeout(() => {
  child.kill();
}, 5000);
