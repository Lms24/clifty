import * as clack from "@clack/prompts";

export async function execute(args) {
  clack.intro("InOut");
  clack.note("This is a simple flow for testing input and output");

  const name = await clack.text({
    message: "What is your name?",
    placeholder: "Enter your name",
  });

  if (clack.isCancel(name)) {
    clack.cancel("Goodbye");
  }

  clack.log.success(`Hello ${name}`);

  clack.outro("Goodbye");
}
