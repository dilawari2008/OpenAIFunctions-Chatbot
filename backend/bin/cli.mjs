#!/usr/bin/env node

import { execSync } from "child_process";

const runCommand = (command) => {
  try {
    execSync(command, { stdio: "inherit" });
    return true;
  } catch (e) {
    console.error(`Failed to execute ${command}`);
    return false;
  }
};

const defaultRepoName = "node-typescript-express-boilerplate";
const repoName = process.argv[2] || defaultRepoName;

const gitCheckoutCommand = `git clone --depth 1 https://github.com/dilawari2008/node-typescript-express-boilerplate ${repoName}`;
const installDepsCommand = `cd ${repoName} && yarn install`;

console.log(`Cloning ${repoName}...`);
const checkedOut = runCommand(gitCheckoutCommand);
if (!checkedOut) process.exit(-1);

console.log(`Installing dependencies for ${repoName}...`);
const installedDeps = runCommand(installDepsCommand);
if (!installedDeps) process.exit(-1);

console.log(`cd ${repoName}`);
console.log("\n\nStart the server using yarn start");
// add lines for changing git repo
console.log("\n\nChange you remote url as:");
console.log("\ngit remote set-url origin <your-remote-url>");
