/**
 * Zod Schemas — Strict contracts for every pipeline output
 * 
 * These schemas define the exact structure expected from each
 * pipeline stage, enabling validation and repair.
 */

import { z } from "zod";

// ============================================================
// Stage 1: Intent Extraction Schema
// ============================================================

export const FeatureSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["auth", "data", "ui", "logic", "integration", "analytics", "payment", "communication", "storage", "other"]),
  details: z.string().min(1),
  priority: z.enum(["must-have", "nice-to-have"]).default("must-have"),
});

export const IntentSchema = z.object({
  appName: z.string().min(1),
  appType: z.enum(["business", "ecommerce", "social", "productivity", "education", "healthcare", "entertainment", "utility", "other"]),
  description: z.string().min(1),
  features: z.array(FeatureSchema).min(1),
  roles: z.array(z.string()).min(1),
  assumptions: z.array(z.string()).default([]),
  ambiguities: z.array(z.object({
    issue: z.string(),
    suggestion: z.string(),
  })).default([]),
  complexity: z.enum(["low", "medium", "high"]),
});

// ============================================================
// Stage 2: System Design Schema
// ============================================================

export const FieldSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["string", "number", "boolean", "date", "email", "password", "text", "url", "enum", "json", "uuid", "float", "integer"]),
  required: z.boolean().default(true),
  unique: z.boolean().default(false),
  defaultValue: z.any().optional(),
  enumValues: z.array(z.string()).optional(),
  description: z.string().optional(),
});

export const RelationSchema = z.object({
  target: z.string().min(1),
  type: z.enum(["one-to-one", "one-to-many", "many-to-many"]),
  foreignKey: z.string().optional(),
});

export const EntitySchema = z.object({
  name: z.string().min(1),
  fields: z.array(FieldSchema).min(1),
  relations: z.array(RelationSchema).default([]),
  timestamps: z.boolean().default(true),
});

export const FlowStepSchema = z.object({
  action: z.string().min(1),
  actor: z.string().min(1),
  description: z.string(),
});

export const FlowSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  steps: z.array(FlowStepSchema).min(1),
});

export const PermissionsSchema = z.object({
  permissions: z.array(z.string()).min(1),
  description: z.string().optional(),
});

export const DesignSchema = z.object({
  entities: z.array(EntitySchema).min(1),
  flows: z.array(FlowSchema).min(1),
  roles: z.record(z.string(), PermissionsSchema),
});

// ============================================================
// Stage 3: Schema Generation — UI Config
// ============================================================

export const UIComponentSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["form", "table", "card", "chart", "list", "detail", "stat", "nav", "modal", "hero", "grid", "calendar", "kanban", "timeline", "other"]),
  title: z.string(),
  dataSource: z.string().optional(),
  fields: z.array(z.object({
    name: z.string(),
    label: z.string(),
    type: z.enum(["text", "number", "email", "password", "textarea", "select", "checkbox", "date", "file", "url", "hidden", "toggle", "rich-text"]),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional(),
  })).optional(),
  actions: z.array(z.object({
    label: z.string(),
    type: z.enum(["create", "edit", "delete", "view", "export", "import", "navigate", "submit", "custom"]),
    endpoint: z.string().optional(),
  })).optional(),
});

export const UIPageSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  path: z.string().min(1),
  layout: z.enum(["dashboard", "form", "list", "detail", "landing", "settings", "auth", "full-width", "sidebar"]),
  components: z.array(UIComponentSchema).min(1),
  requiredRole: z.string().optional(),
  isPublic: z.boolean().default(false),
});

export const UIConfigSchema = z.object({
  pages: z.array(UIPageSchema).min(1),
  navigation: z.array(z.object({
    label: z.string(),
    path: z.string(),
    icon: z.string().optional(),
    requiredRole: z.string().optional(),
  })).min(1),
  theme: z.object({
    primaryColor: z.string(),
    secondaryColor: z.string(),
    accentColor: z.string(),
    mode: z.enum(["light", "dark"]).default("light"),
  }),
});

// ============================================================
// Stage 3: Schema Generation — API Config
// ============================================================

export const APIEndpointSchema = z.object({
  id: z.string().min(1),
  path: z.string().min(1),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  description: z.string(),
  requestBody: z.object({
    fields: z.array(z.object({
      name: z.string(),
      type: z.string(),
      required: z.boolean().default(true),
      validation: z.string().optional(),
    })),
  }).optional(),
  responseBody: z.object({
    type: z.enum(["object", "array", "paginated"]),
    fields: z.array(z.object({
      name: z.string(),
      type: z.string(),
    })),
  }),
  authentication: z.boolean().default(true),
  requiredRole: z.array(z.string()).optional(),
});

export const APIConfigSchema = z.object({
  basePath: z.string().default("/api"),
  endpoints: z.array(APIEndpointSchema).min(1),
});

// ============================================================
// Stage 3: Schema Generation — DB Schema
// ============================================================

export const DBColumnSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["VARCHAR", "TEXT", "INTEGER", "FLOAT", "BOOLEAN", "DATE", "DATETIME", "TIMESTAMP", "JSON", "UUID", "ENUM", "DECIMAL"]),
  primaryKey: z.boolean().default(false),
  nullable: z.boolean().default(false),
  unique: z.boolean().default(false),
  defaultValue: z.any().optional(),
  references: z.object({
    table: z.string(),
    column: z.string(),
    onDelete: z.enum(["CASCADE", "SET NULL", "RESTRICT", "NO ACTION"]).default("CASCADE"),
  }).optional(),
  enumValues: z.array(z.string()).optional(),
});

export const DBTableSchema = z.object({
  name: z.string().min(1),
  columns: z.array(DBColumnSchema).min(1),
  indexes: z.array(z.object({
    name: z.string(),
    columns: z.array(z.string()),
    unique: z.boolean().default(false),
  })).default([]),
  timestamps: z.boolean().default(true),
});

export const DBSchemaSchema = z.object({
  tables: z.array(DBTableSchema).min(1),
});

// ============================================================
// Stage 3: Schema Generation — Auth Rules
// ============================================================

export const AuthRuleSchema = z.object({
  role: z.string().min(1),
  permissions: z.array(z.object({
    resource: z.string(),
    actions: z.array(z.enum(["create", "read", "update", "delete", "list", "export", "manage"])),
  })).min(1),
});

export const AuthConfigSchema = z.object({
  authMethod: z.enum(["email-password", "oauth", "magic-link", "api-key"]).default("email-password"),
  roles: z.array(AuthRuleSchema).min(1),
  routeGuards: z.array(z.object({
    path: z.string(),
    allowedRoles: z.array(z.string()),
    isPublic: z.boolean().default(false),
  })).default([]),
});

// ============================================================
// Full Application Config (merged)
// ============================================================

export const FullAppConfigSchema = z.object({
  appName: z.string().min(1),
  appType: z.string(),
  description: z.string(),
  ui: UIConfigSchema,
  api: APIConfigSchema,
  database: DBSchemaSchema,
  auth: AuthConfigSchema,
});
