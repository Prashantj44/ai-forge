/**
 * Stage 3: Schema Generation
 * 
 * Generates all 4 config schemas from the system design:
 * 1. UI Config (pages, components, layouts, navigation)
 * 2. API Config (endpoints, methods, validation)
 * 3. DB Schema (tables, columns, types, relations)
 * 4. Auth Rules (roles, permissions, route guards)
 */

import { callLLMWithSchema } from "../llm.js";
import { validateSchema } from "../validation/validator.js";
import { repairConfig } from "../validation/repair.js";

// ============================================================
// UI Config Generation
// ============================================================

const UI_SYSTEM_PROMPT = `You are a UI/UX architect. Generate a complete UI configuration from a system design.

RULES:
1. Create pages for every major feature (list views, detail views, forms, dashboards).
2. Include a navigation structure with proper ordering.
3. Every page must have at least one component.
4. Component types: form, table, card, chart, list, detail, stat, nav, modal, hero, grid, calendar, kanban, timeline, other.
5. Form fields must match the entity fields from the design.
6. Include a landing/auth page if authentication is required.
7. Dashboard page should have stat and chart components.
8. Use consistent path naming: /login, /dashboard, /entities, /entities/:id, etc.
9. Set requiredRole for pages that need authentication.`;

const UI_SCHEMA_DESC = `{
  "pages": [
    {
      "id": "string (kebab-case page id)",
      "title": "string (page title)",
      "path": "string (URL path like /dashboard)",
      "layout": "one of: dashboard, form, list, detail, landing, settings, auth, full-width, sidebar",
      "components": [
        {
          "id": "string (unique component id)",
          "type": "one of: form, table, card, chart, list, detail, stat, nav, modal, hero, grid, calendar, kanban, timeline, other",
          "title": "string",
          "dataSource": "optional entity name",
          "fields": [optional array of { name, label, type, required, options }],
          "actions": [optional array of { label, type, endpoint }]
        }
      ],
      "requiredRole": "optional role name",
      "isPublic": true/false
    }
  ],
  "navigation": [
    { "label": "string", "path": "string", "icon": "optional icon name", "requiredRole": "optional" }
  ],
  "theme": {
    "primaryColor": "#hex",
    "secondaryColor": "#hex",
    "accentColor": "#hex",
    "mode": "light or dark"
  }
}`;

// ============================================================
// API Config Generation
// ============================================================

const API_SYSTEM_PROMPT = `You are a backend API architect. Generate a complete RESTful API configuration from a system design.

RULES:
1. Create CRUD endpoints for every entity (GET list, GET by id, POST, PUT, DELETE).
2. Include auth endpoints (POST /api/auth/login, POST /api/auth/register).
3. Request body fields must match entity fields.
4. Response body fields must include id and entity fields.
5. Set authentication requirement for each endpoint.
6. Specify required roles for protected endpoints.
7. Use consistent path naming: /api/entityName (plural, lowercase).
8. For list endpoints, response type should be "array" or "paginated".`;

const API_SCHEMA_DESC = `{
  "basePath": "/api",
  "endpoints": [
    {
      "id": "string (unique endpoint id)",
      "path": "string (like /api/users)",
      "method": "one of: GET, POST, PUT, PATCH, DELETE",
      "description": "string",
      "requestBody": {
        "fields": [{ "name": "string", "type": "string", "required": true/false, "validation": "optional regex/rule" }]
      },
      "responseBody": {
        "type": "one of: object, array, paginated",
        "fields": [{ "name": "string", "type": "string" }]
      },
      "authentication": true/false,
      "requiredRole": ["optional array of role names"]
    }
  ]
}`;

// ============================================================
// DB Schema Generation
// ============================================================

const DB_SYSTEM_PROMPT = `You are a database architect. Generate a complete relational database schema from a system design.

RULES:
1. Create tables for every entity.
2. Every table MUST have an "id" column (UUID, primary key).
3. Include foreign key columns for relationships.
4. one-to-many: FK on the "many" side.
5. many-to-many: create a junction table.
6. Include created_at and updated_at columns when timestamps=true.
7. Use consistent column naming: snake_case.
8. Include appropriate indexes for frequently queried columns and foreign keys.
9. Set proper column types: VARCHAR for short strings, TEXT for long text, etc.`;

const DB_SCHEMA_DESC = `{
  "tables": [
    {
      "name": "string (snake_case table name, plural)",
      "columns": [
        {
          "name": "string (snake_case column name)",
          "type": "one of: VARCHAR, TEXT, INTEGER, FLOAT, BOOLEAN, DATE, DATETIME, TIMESTAMP, JSON, UUID, ENUM, DECIMAL",
          "primaryKey": true/false,
          "nullable": true/false,
          "unique": true/false,
          "defaultValue": "optional",
          "references": { "table": "string", "column": "string", "onDelete": "CASCADE/SET NULL/RESTRICT/NO ACTION" },
          "enumValues": ["optional"]
        }
      ],
      "indexes": [
        { "name": "string", "columns": ["string"], "unique": true/false }
      ],
      "timestamps": true/false
    }
  ]
}`;

// ============================================================
// Auth Config Generation
// ============================================================

const AUTH_SYSTEM_PROMPT = `You are a security architect. Generate a complete authentication and authorization configuration from a system design.

RULES:
1. Define roles with granular permissions (resource + action pairs).
2. Create route guards for every page/endpoint that requires auth.
3. Public routes (login, register, landing) should have isPublic=true.
4. Admin role should have full access.
5. Regular user roles should have limited access based on the design.
6. Include auth method specification.`;

const AUTH_SCHEMA_DESC = `{
  "authMethod": "one of: email-password, oauth, magic-link, api-key",
  "roles": [
    {
      "role": "string (role name)",
      "permissions": [
        {
          "resource": "string (entity/page name)",
          "actions": ["create", "read", "update", "delete", "list", "export", "manage"]
        }
      ]
    }
  ],
  "routeGuards": [
    {
      "path": "string (route path)",
      "allowedRoles": ["string"],
      "isPublic": true/false
    }
  ]
}`;

/**
 * Generate all 4 schemas from system design
 * @param {object} intent - Stage 1 output  
 * @param {object} design - Stage 2 output
 * @returns {Promise<{ ui: object, api: object, database: object, auth: object, metrics: object, repairs: Array }>}
 */
export async function generateSchemas(intent, design) {
  const allRepairs = [];
  const allMetrics = { stages: {} };

  const contextPrompt = `
App: ${intent.appName} (${intent.appType})
Description: ${intent.description}

Entities:
${design.entities.map((e) => `- ${e.name}: ${e.fields.map((f) => f.name).join(", ")}`).join("\n")}

Roles: ${Object.keys(design.roles).join(", ")}

Flows:
${design.flows.map((f) => `- ${f.name}: ${f.description}`).join("\n")}`;

  // Generate all 4 schemas in parallel for speed
  const [uiResult, apiResult, dbResult, authResult] = await Promise.all([
    generateAndValidate(
      UI_SYSTEM_PROMPT,
      `Generate the UI configuration for this application:\n${contextPrompt}`,
      UI_SCHEMA_DESC,
      "uiConfig",
      { intent, design }
    ),
    generateAndValidate(
      API_SYSTEM_PROMPT,
      `Generate the API configuration for this application:\n${contextPrompt}`,
      API_SCHEMA_DESC,
      "apiConfig",
      { intent, design }
    ),
    generateAndValidate(
      DB_SYSTEM_PROMPT,
      `Generate the database schema for this application:\n${contextPrompt}`,
      DB_SCHEMA_DESC,
      "dbSchema",
      { intent, design }
    ),
    generateAndValidate(
      AUTH_SYSTEM_PROMPT,
      `Generate the auth configuration for this application:\n${contextPrompt}`,
      AUTH_SCHEMA_DESC,
      "authConfig",
      { intent, design }
    ),
  ]);

  allMetrics.stages.ui = uiResult.metrics;
  allMetrics.stages.api = apiResult.metrics;
  allMetrics.stages.db = dbResult.metrics;
  allMetrics.stages.auth = authResult.metrics;
  allRepairs.push(...uiResult.repairs, ...apiResult.repairs, ...dbResult.repairs, ...authResult.repairs);

  return {
    ui: uiResult.result,
    api: apiResult.result,
    database: dbResult.result,
    auth: authResult.result,
    metrics: allMetrics,
    repairs: allRepairs,
  };
}

/**
 * Helper: generate schema, validate, and repair if needed
 */
async function generateAndValidate(systemPrompt, userPrompt, schemaDesc, schemaName, context) {
  const { result, metrics } = await callLLMWithSchema(
    systemPrompt,
    userPrompt,
    schemaDesc,
    { temperature: 0.15 }
  );

  const validation = validateSchema(result, schemaName);

  if (validation.valid) {
    return { result: validation.data, metrics, repairs: [] };
  }

  // Attempt repair
  const { repaired, repairs } = await repairConfig(
    result,
    schemaName,
    validation.errors,
    context
  );

  return {
    result: repaired,
    metrics: { ...metrics, repairAttempts: repairs.length },
    repairs,
  };
}
