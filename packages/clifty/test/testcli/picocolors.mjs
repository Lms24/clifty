import * as clack from "@clack/prompts";
import pc from "picocolors";

export async function execute(args) {
  clack.intro("picocolors");
  clack.note(
    "This is a simple flow for testing output with colorized and formatted output"
  );

  const name = await clack.text({
    message: "What is your name?",
    placeholder: "Enter your name",
  });

  if (clack.isCancel(name)) {
    clack.cancel("Goodbye");
  }

  // clack prints some extra characters, let's just make sure these don't mess up output expectations
  clack.log.success(`Hello ${pc.green(name)} (clack.log.success)`);
  clack.log.info(`Hello ${pc.blue(name)} (clack.log.info)`);
  clack.log.error(`Hello ${pc.red(name)} (clack.log.error)`);
  clack.log.warn(`Hello ${pc.yellow(name)} (clack.log.warn)`);
  clack.log.step(`Hello ${pc.cyan(name)} (clack.log.step)`);

  console.log(pc.red(`\nHello ${name} (red)`));
  console.log(
    pc.green(`Hello ${pc.underline(name)} ${pc.dim(pc.bgRed("(red + bg)"))}`)
  );

  console.log(
    pc.italic(pc.bgWhite(`Hello ${pc.cyanBright(name)} (italic + bg)`))
  );

  const spinner = clack.spinner({ indicator: "timer" });

  spinner.start(`greeting ${pc.cyanBright(name)} in progress`);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  spinner.message(`greeting ${pc.cyanBright(name)} in progress 50%`);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  spinner.stop(`Greeted ${pc.cyanBright(name)}`);

  clack.outro("Goodbye");
}
