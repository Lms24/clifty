import yargs from "yargs";
import { execute as executeInOut } from "./inOut.mjs";
import { execute as executePicocolors } from "./picocolors.mjs";

yargs(process.argv.slice(2))
  .command("inOut", "test input and output", () => {
    executeInOut();
  })
  .command("picocolors", "test picocolors", () => {
    executePicocolors();
  })
  .parse();

// executeInOut();

// console.log(args);
