import { runPlanningAgent, updateTaskCompletion } from "./planning-agent";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load environment variables from .env file
dotenv.config();

async function createPlan() {
  try {
    // Example task
    const task = "Build a personal portfolio website";

    console.log(`Running planning agent for task: "${task}"`);
    const result = await runPlanningAgent(task);
    console.log(result);

    return `plan-${task.toLowerCase().replace(/[^a-z0-9]/g, "-")}.md`;
  } catch (error) {
    console.error("Error running planning agent:", error);
    return null;
  }
}

async function updatePlan(filePath: string) {
  try {
    // Mark tasks 0 and 2 as completed
    const completedTaskIndices = [0, 2];

    console.log(`Updating plan: ${filePath}`);
    console.log(`Marking tasks ${completedTaskIndices.map(i => i + 1).join(", ")} as completed`);

    const result = await updateTaskCompletion(filePath, completedTaskIndices);
    console.log(result);
  } catch (error) {
    console.error("Error updating plan:", error);
  }
}

async function main() {
  // Command line arguments
  const args = process.argv.slice(2);
  const command = args[0] || "create";

  if (command === "create") {
    // Create a new plan
    const filePath = await createPlan();

    // If plan creation was successful and --update flag is provided, update it
    if (filePath && args.includes("--update")) {
      await updatePlan(filePath);
    }

  } else if (command === "update") {
    // Update an existing plan
    const filePath = args[1];
    if (!filePath) {
      console.error("Please provide a file path for the plan to update");
      process.exit(1);
    }

    await updatePlan(filePath);


  } else {
    console.log(`
Usage:
  npm run dev -- create [--update]   Create a new plan with options
  npm run dev -- update <filepath>   Update an existing plan
  
Options:
  --update     Mark sample tasks as completed
  
    `);
  }
}

main();