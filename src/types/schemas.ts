import { z } from 'zod';

// Shared base
export const ApiVersion = '1.1.0';

export const ErrorObjectSchema = z.object({
  code: z.enum([
    'VALIDATION_FAILED',
    'POLICY_VIOLATION',
    'PRECONDITION_FAILED',
    'INTERNAL_ERROR',
  'UNSUPPORTED_VERSION',
  'NOT_FOUND',
  'UNAUTHORIZED'
  ]),
  message: z.string(),
  hint: z.string().optional(),
  remediation: z.string().optional()
});

export type ErrorObject = z.infer<typeof ErrorObjectSchema>;

export const BaseResponseSchema = z.object({
  api_version: z.string().default(ApiVersion),
  human: z.string().optional(),
  meta: z.record(z.any()).optional()
});

export const ErrorResponseSchema = BaseResponseSchema.extend({
  error: ErrorObjectSchema
});

// server.info
export const ServerInfoInputSchema = z.object({});
export const ToolDescriptorSchema = z.object({
  name: z.string(),
  stability: z.enum(['stable','experimental']).default('stable'),
  description: z.string().optional(),
  version: z.string().optional()
});
export const ServerInfoOutputSchema = BaseResponseSchema.extend({
  data: z.object({
    server_version: z.string(),
    api_version: z.string(),
    tool_versions: z.record(z.string()).optional(),
    tools: z.array(ToolDescriptorSchema),
    capabilities: z.array(z.string()),
    deprecation_notices: z.array(z.object({
      tool: z.string(),
      alternative: z.string().optional(),
      removal_version: z.string().optional(),
      note: z.string().optional()
    })).optional()
  })
});

// server.config
export const ServerConfigGetInputSchema = z.object({ action: z.literal('get') });
export const ServerConfigUpdateInputSchema = z.object({
  action: z.literal('update'),
  protectedBranches: z.array(z.string()).optional(),
  featurePrefix: z.string().optional()
});
export const ServerConfigInputSchema = z.discriminatedUnion('action', [ServerConfigGetInputSchema, ServerConfigUpdateInputSchema]);
export const ServerConfigOutputSchema = BaseResponseSchema.extend({
  data: z.object({
    protectedBranches: z.array(z.string()),
    featurePrefix: z.string(),
    repoPath: z.string()
  })
});

// git.rules.simulate
export const GitRulesSimulateInputSchema = z.object({
  sequence: z.array(z.object({ command: z.string(), args: z.array(z.string()).optional() })),
  stopOnViolation: z.boolean().default(true)
});
export const GitRulesSimulateOutputSchema = BaseResponseSchema.extend({
  data: z.object({
    results: z.array(z.object({
      command: z.string(),
      allowed: z.boolean(),
      severity: z.string().optional(),
      reason: z.string().optional()
    })),
    firstViolation: z.string().nullable()
  })
});

export type ServerConfigInput = z.infer<typeof ServerConfigInputSchema>;
export type ServerConfigOutput = z.infer<typeof ServerConfigOutputSchema>;
export type GitRulesSimulateInput = z.infer<typeof GitRulesSimulateInputSchema>;
export type GitRulesSimulateOutput = z.infer<typeof GitRulesSimulateOutputSchema>;

// server.health
export const ServerHealthInputSchema = z.object({});
export const HealthCheckSchema = z.object({
  name: z.string(),
  status: z.enum(['ok','degraded','fail']),
  detail: z.string().optional()
});
export const MetricsSchema = z.object({
  validate_calls: z.number(),
  suggest_calls: z.number(),
  last_error_timestamp: z.number().nullable()
});
export const ServerHealthOutputSchema = BaseResponseSchema.extend({
  data: z.object({
    status: z.enum(['ok','degraded','fail']),
    timestamp: z.string(),
    checks: z.array(HealthCheckSchema),
    metrics: MetricsSchema
  })
});

// git.rules.validate
export const GitRulesValidateInputSchema = z.object({
  command: z.string(),
  args: z.array(z.string()).optional(),
  accept_formats: z.array(z.enum(['text','structured','markdown'])).optional()
});
export const GitRulesValidateOutputSchema = BaseResponseSchema.extend({
  data: z.object({
    allowed: z.boolean(),
    severity: z.enum(['info','warn','error']).optional(),
    reason: z.string().optional(),
    suggestion: z.string().optional()
  })
});

// git.rules.status
export const GitRulesStatusInputSchema = z.object({});
export const GitRulesStatusOutputSchema = BaseResponseSchema.extend({
  data: z.object({
    branch: z.string(),
    isClean: z.boolean(),
    isProtected: z.boolean(),
    allowedActions: z.array(z.string()),
    warnings: z.array(z.string())
  })
});

// git.workflow.suggest
export const GitWorkflowSuggestInputSchema = z.object({
  task: z.enum(['start_feature','finish_feature','sync_main','prepare_release']),
  format: z.enum(['structured','markdown','text']).optional()
});
export const GitWorkflowSuggestOutputSchema = BaseResponseSchema.extend({
  data: z.object({
    task: z.string(),
    suggestion: z.string(),
    steps: z.array(z.string())
  })
});

// git.workflow.run
export const GitWorkflowRunInputSchema = z.object({
  workflow: z.enum(['start_feature','finish_feature','sync_main','prepare_release']),
  name: z.string().optional()
});
export const GitWorkflowRunOutputSchema = BaseResponseSchema.extend({
  data: z.object({
    workflow: z.string(),
    result: z.string(),
    followUps: z.array(z.string()).optional()
  })
});

export type ServerInfoInput = z.infer<typeof ServerInfoInputSchema>;
export type ServerInfoOutput = z.infer<typeof ServerInfoOutputSchema>;
export type ServerHealthInput = z.infer<typeof ServerHealthInputSchema>;
export type ServerHealthOutput = z.infer<typeof ServerHealthOutputSchema>;
export type GitRulesValidateInput = z.infer<typeof GitRulesValidateInputSchema>;
export type GitRulesValidateOutput = z.infer<typeof GitRulesValidateOutputSchema>;
export type GitRulesStatusInput = z.infer<typeof GitRulesStatusInputSchema>;
export type GitRulesStatusOutput = z.infer<typeof GitRulesStatusOutputSchema>;
export type GitWorkflowSuggestInput = z.infer<typeof GitWorkflowSuggestInputSchema>;
export type GitWorkflowSuggestOutput = z.infer<typeof GitWorkflowSuggestOutputSchema>;
export type GitWorkflowRunInput = z.infer<typeof GitWorkflowRunInputSchema>;
export type GitWorkflowRunOutput = z.infer<typeof GitWorkflowRunOutputSchema>;

export type ToolHandler = (input: unknown) => Promise<unknown>;

export interface ToolDefinition<I, O> {
  name: string;
  stability?: 'stable' | 'experimental';
  description?: string;
  inputSchema: z.ZodType<I>;
  outputSchema: z.ZodType<O>;
  handler: (_input: I) => Promise<O>;
}
