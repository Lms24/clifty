import yargs from "yargs";
import { execute as executeInOut } from "./inOut.mjs";

yargs(process.argv.slice(2))
  .command("inOut", "test input and output", () => {
    executeInOut();
  })
  .parse();

// executeInOut();

// console.log(args);
