import { tool, type UIToolInvocation } from "ai"
import { z } from "zod"

export const createPlanTool = tool({
  description:
    "Create a structured step-by-step plan or workflow before executing a complex task. Use this at the start of multi-step tasks to outline what you will do.",
  inputSchema: z.object({
    goal: z.string().describe("The overall goal of the plan"),
    steps: z
      .array(
        z.object({
          id: z.number(),
          title: z.string(),
          description: z.string(),
          tool: z
            .string()
            .optional()
            .describe("Which tool will be used for this step"),
        }),
      )
      .describe("Ordered list of steps to accomplish the goal"),
  }),
  execute: async ({ goal, steps }) => {
    return {
      planId: `plan_${Date.now()}`,
      goal,
      steps,
      totalSteps: steps.length,
      status: "created",
      createdAt: new Date().toISOString(),
    }
  },
})

export const updateStepStatusTool = tool({
  description: "Update the status of a step in the current plan.",
  inputSchema: z.object({
    planId: z.string().describe("The ID of the plan"),
    stepId: z.number().describe("The step number to update"),
    status: z
      .enum(["pending", "in_progress", "completed", "skipped", "failed"])
      .describe("New status for the step"),
    note: z.string().optional().describe("Optional note about the step"),
  }),
  execute: async ({ planId, stepId, status, note }) => {
    return { planId, stepId, status, note, updatedAt: new Date().toISOString() }
  },
})

export type CreatePlanInvocation = UIToolInvocation<typeof createPlanTool>
export type UpdateStepStatusInvocation = UIToolInvocation<
  typeof updateStepStatusTool
>
