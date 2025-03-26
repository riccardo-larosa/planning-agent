import { ChatAnthropic } from "@langchain/anthropic";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

// Define the state structure for our planning agent
interface PlanningState {
  task: string;
  taskList: string[];
  completedTasks: string[];
  markdownContent: string;
  isComplete: boolean;
  error?: string;
}

// Initialize the Anthropic model
const model = new ChatAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
  model: process.env.MODEL_NAME || "claude-3-5-sonnet-latest",
});

// Number of tasks to generate
const TASK_COUNT = process.env.TASK_COUNT ? parseInt(process.env.TASK_COUNT) : 5;

// Function to generate a list of tasks based on the main task
async function generateTaskList(task: string): Promise<string[]> {
  try {
    // Create a structured prompt for better task generation
    const systemPrompt = new SystemMessage(
      `You are a helpful planning assistant. Your job is to break down a main task into ${TASK_COUNT} specific, actionable subtasks. 
      Each subtask should be:
      1. Clear and concise
      2. Actionable (start with a verb)
      3. Specific enough to be completable
      4. Logically ordered from first to last
      
      Provide only the tasks, one per line, without numbering or bullet points.`
    );

    const userPrompt = new HumanMessage(
      `Break down the following task into ${TASK_COUNT} specific, actionable subtasks: "${task}"`
    );

    const response = await model.invoke([systemPrompt, userPrompt]);

    // Extract tasks from the response
    let responseText = "";
    
    if (typeof response.content === 'string') {
      responseText = response.content;
    } else {
      responseText = JSON.stringify(response.content);
    }

    return responseText
      .split("\n")
      .filter((line: string) => line.trim().length > 0)
      .map((line: string) => line.replace(/^[-*]\s*/, "").trim()) // Remove bullet points if present
      .filter((task: string) => task.length > 0);
  } catch (error) {
    console.error("Error generating task list:", error);
    throw new Error(`Failed to generate task list: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Function to create markdown content based on the task list
function createMarkdownContent(task: string, taskList: string[]): string {
  // Add header with current date
  const currentDate = new Date().toISOString().split('T')[0];

  // Format tasks as a checklist
  const taskListFormatted = taskList.map((task: string) => `- [ ] ${task}`).join("\n");

  // Create a more comprehensive markdown structure
  return `# Project Plan: ${task}

## Overview
This project plan was generated on ${currentDate} to accomplish the task: "${task}".

## Tasks
${taskListFormatted}

## Progress
- 0/${taskList.length} tasks completed (0%)

## Timeline
Estimated completion date: *To be determined*

## Resources Needed
*To be determined*

## Notes
This plan was automatically generated using Claude AI.
`;
}

// Function to write the markdown content to a file
function writeMarkdownFile(task: string, markdownContent: string): string {
  try {
    // Create a filename based on the task
    const filename = `plan-${task.toLowerCase().replace(/[^a-z0-9]/g, "-")}.md`;
    const filePath = path.join(process.cwd(), filename);

    // Ensure the directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write the markdown to a file
    fs.writeFileSync(filePath, markdownContent);

    return filename;
  } catch (error) {
    console.error("Error writing markdown file:", error);
    throw new Error(`Failed to write markdown file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Function to run the planning agent with a given task
export async function runPlanningAgent(task: string): Promise<string> {
  try {
    // Validate API key
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set in environment variables");
    }

    // Generate task list
    const taskList = await generateTaskList(task);
    
    // Create markdown content
    const markdownContent = createMarkdownContent(task, taskList);
    
    // Write to file and get filename
    const filename = writeMarkdownFile(task, markdownContent);

    return `Planning complete! Markdown file created: ${filename}`;
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

// Export a function to update an existing plan with completed tasks
export async function updateTaskCompletion(
  filepath: string,
  completedTaskIndices: number[]
): Promise<string> {
  try {
    // Read the existing markdown file
    const content = fs.readFileSync(filepath, 'utf8');

    // Split into lines
    const lines = content.split('\n');

    // Find the task list section
    const taskStartIndex = lines.findIndex(line => line.trim() === '## Tasks') + 1;
    if (taskStartIndex <= 0) {
      throw new Error("Could not find task list section in markdown file");
    }

    // Find the end of the task list section
    let taskEndIndex = taskStartIndex;
    while (taskEndIndex < lines.length && lines[taskEndIndex].startsWith('- ')) {
      taskEndIndex++;
    }

    // Get the task list
    const tasks = lines.slice(taskStartIndex, taskEndIndex);

    // Update the tasks based on completed indices
    const updatedTasks = tasks.map((task, index) => {
      if (completedTaskIndices.includes(index)) {
        return task.replace('- [ ]', '- [x]');
      }
      return task;
    });

    // Calculate completion percentage
    const totalTasks = tasks.length;
    const completedTasks = updatedTasks.filter(task => task.includes('- [x]')).length;
    const completionPercentage = Math.round((completedTasks / totalTasks) * 100);

    // Update the task list in the content
    const updatedLines = [
      ...lines.slice(0, taskStartIndex),
      ...updatedTasks,
      ...lines.slice(taskEndIndex),
    ];

    // Update the progress section
    const progressIndex = updatedLines.findIndex(line => line.trim().startsWith('## Progress'));
    if (progressIndex > 0) {
      updatedLines[progressIndex + 1] = `- ${completedTasks}/${totalTasks} tasks completed (${completionPercentage}%)`;
    }

    // Write the updated content back to the file
    fs.writeFileSync(filepath, updatedLines.join('\n'));

    return `Plan updated! ${completedTasks}/${totalTasks} tasks completed (${completionPercentage}%)`;
  } catch (error) {
    console.error("Error updating task completion:", error);
    return `Failed to update task completion: ${error instanceof Error ? error.message : String(error)}`;
  }
}