import { z } from "zod";

const providerKeySchema = z.object({
  id: z.string().min(1),
  value: z.string().min(1),
  weight: z.number().int().positive().default(1),
  rpm: z.number().int().positive().optional(),
  dailyRequests: z.number().int().positive().optional()
});

const providerSchema = z.object({
  type: z.string().min(1),
  baseUrl: z.string().url(),
  keys: z.array(providerKeySchema).min(1)
});

const poolProviderSchema = z.object({
  provider: z.string().min(1),
  models: z.array(z.string().min(1)).default([])
});

const poolSchema = z.object({
  strategy: z.enum(["round_robin", "weighted_round_robin"]).default("round_robin"),
  providers: z.array(poolProviderSchema).min(1)
});

const taskSchema = z.object({
  pool: z.string().min(1),
  fallbackPools: z.array(z.string().min(1)).default([]),
  defaultModel: z.string().min(1).optional()
});

export const keyPoolConfigSchema = z.object({
  server: z.object({
    host: z.string().min(1).default("0.0.0.0"),
    port: z.coerce.number().int().min(1).max(65535).default(3000)
  }),
  providers: z.record(providerSchema).default({}),
  pools: z.record(poolSchema).default({}),
  tasks: z.record(taskSchema).default({}),
  retry: z.object({
    maxAttempts: z.number().int().min(1).max(10).default(3),
    retryOn: z.array(z.number().int()).default([429, 500, 502, 503, 504])
  }).default({
    maxAttempts: 3,
    retryOn: [429, 500, 502, 503, 504]
  })
});

export type KeyPoolConfig = z.infer<typeof keyPoolConfigSchema>;

