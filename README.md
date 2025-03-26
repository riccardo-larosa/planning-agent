# TypeScript Planning Agent with LangGraph

This project implements a planning agent using Anthropic's Claude AI to:
1. Generate a list of tasks based on a main task
2. Create a structured markdown file with the task list
3. Save the markdown file to the local filesystem

## Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Anthropic API key

## Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory and add your Anthropic API key:

```
ANTHROPIC_API_KEY=your_api_key_here
```

## Project Structure

```
planning-agent/
├── src/
│   ├── index.ts          # Main entry point with CLI commands
│   ├── planning-agent.ts # Planning agent implementation
├── package.json
├── tsconfig.json
├── .env.example          # Example environment variables
├── Dockerfile            # Docker container definition
├── docker-compose.yml    # Docker Compose configuration
└── README.md
```

## Docker Support

The project includes Docker support for containerized deployment:

### Building and Running with Docker

```bash
# Build the Docker image
docker build -t planning-agent .

# Run the container (create a new plan)
docker run --env-file .env -v $(pwd)/plans:/app/plans planning-agent create --visualize

# Update an existing plan
docker run --env-file .env -v $(pwd)/plans:/app/plans planning-agent update /app/plans/your-plan-file.md
```

### Using Docker Compose

```bash
# Start the planning agent with docker-compose
docker-compose up

# Run with a specific command
docker-compose run planning-agent update /app/plans/your-plan-file.md
```

## Usage

### Using the Command Line

You can run the planning agent with these commands:

```bash
# Create a new plan
npm run dev -- create

# Create a new plan and mark some tasks as completed
npm run dev -- create --update

# Update an existing plan
npm run dev -- update path/to/plan.md

# Show help
npm run dev
```


### Customizing the Task

To change the main task, edit the `task` variable in `src/index.ts`:

```typescript
// Example task
const task = "Build a personal portfolio website";
```

### Using the API in Your Own Code

You can import and use the planning agent in your TypeScript/JavaScript projects:

```typescript
import { runPlanningAgent, updateTaskCompletion } from "./planning-agent";
import { visualizeTasks } from "./task-visualizer";

async function example() {
  // Create a new plan
  const task = "Create a marketing plan for product launch";
  const result = await runPlanningAgent(task);
  console.log(result);
  
  // Get the file path
  const filePath = `plan-${task.toLowerCase().replace(/[^a-z0-9]/g, "-")}.md`;
  
  // Update task completion
  const completedTaskIndices = [0, 2]; // Mark first and third tasks as completed
  const updateResult = await updateTaskCompletion(filePath, completedTaskIndices);
  console.log(updateResult);
  
}

example();
```

## Output

### Markdown Plan

The planning agent generates a markdown file with a name based on the input task. For example, for the task "Build a personal portfolio website", it will create a file named `plan-build-a-personal-portfolio-website.md` in the current directory.

The markdown file includes:
- The main task as a title
- Overview information with generation date
- A list of generated subtasks with checkboxes
- Progress tracking information
- Timeline and resource sections
- Notes


## How It Works

1. The main task is provided as input
2. It creates a workflow with these steps:
   - Generate a list of subtasks using Claude AI
   - Create structured markdown content
   - Write the markdown to a file
3. The workflow executes and returns a confirmation message

## Customization

You can customize the agent by:
- Modifying the prompt in the `generateTaskList` function
- Changing the markdown structure in the `createMarkdownContent` function

## License

MIT
