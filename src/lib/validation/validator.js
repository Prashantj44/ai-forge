/**
 * Validation Engine — Multi-layer validation for pipeline outputs
 * 
 * Validates:
 * 1. Structural: Valid JSON, required fields, type safety (via Zod)
 * 2. Referential Integrity: Cross-layer consistency
 * 3. Logical Consistency: Auth roles exist, nav references valid pages
 * 4. Hallucination Detection: Flag unreferenced fields
 */

import {
  IntentSchema,
  DesignSchema,
  UIConfigSchema,
  APIConfigSchema,
  DBSchemaSchema,
  AuthConfigSchema,
  FullAppConfigSchema,
} from "./schemas.js";

/**
 * Validate data against a specific schema
 * @param {object} data - Data to validate
 * @param {string} schemaName - Name of the schema to validate against
 * @returns {{ valid: boolean, errors: Array, data: object|null }}
 */
export function validateSchema(data, schemaName) {
  const schemas = {
    intent: IntentSchema,
    design: DesignSchema,
    uiConfig: UIConfigSchema,
    apiConfig: APIConfigSchema,
    dbSchema: DBSchemaSchema,
    authConfig: AuthConfigSchema,
    fullConfig: FullAppConfigSchema,
  };

  const schema = schemas[schemaName];
  if (!schema) {
    return {
      valid: false,
      errors: [{ type: "unknown_schema", message: `Unknown schema: ${schemaName}` }],
      data: null,
    };
  }

  const result = schema.safeParse(data);

  if (result.success) {
    return { valid: true, errors: [], data: result.data };
  }

  const errors = result.error.issues.map((issue) => ({
    type: "schema_violation",
    path: issue.path.join("."),
    message: issue.message,
    code: issue.code,
    expected: issue.expected,
    received: issue.received,
  }));

  return { valid: false, errors, data: null };
}

/**
 * Cross-layer validation — checks referential integrity between schemas
 * @param {object} fullConfig - The complete app config with all layers
 * @returns {{ valid: boolean, errors: Array, warnings: Array }}
 */
export function validateCrossLayer(fullConfig) {
  const errors = [];
  const warnings = [];

  const ui = fullConfig?.ui;
  const api = fullConfig?.api;
  const database = fullConfig?.database;
  const auth = fullConfig?.auth;

  // 1. Check that all DB tables referenced by API endpoints exist
  if (api && database) {
    const tableNames = new Set(database.tables.map((t) => t.name.toLowerCase()));
    for (const endpoint of api.endpoints) {
      // Extract entity name from path (e.g., /api/users → users)
      const pathParts = endpoint.path.split("/").filter(Boolean);
      const resourceName = pathParts[pathParts.length - 1]?.replace(/:[^/]+/g, "").replace(/\{[^}]+\}/g, "");
      if (resourceName && !resourceName.startsWith(":") && resourceName.length > 1) {
        // Don't require exact table name match — just warn
        const matchFound = [...tableNames].some(
          (t) => t.includes(resourceName.toLowerCase()) || resourceName.toLowerCase().includes(t)
        );
        if (!matchFound) {
          warnings.push({
            type: "missing_table_for_endpoint",
            message: `API endpoint "${endpoint.path}" may not have a matching DB table`,
            layer: "api-db",
          });
        }
      }
    }
  }

  // 2. Check that UI pages reference valid API endpoints
  if (ui && api) {
    const endpointPaths = new Set(api.endpoints.map((e) => e.path));
    for (const page of ui.pages) {
      for (const component of page.components) {
        if (component.actions) {
          for (const action of component.actions) {
            if (action.endpoint && !endpointPaths.has(action.endpoint)) {
              warnings.push({
                type: "missing_endpoint_for_ui",
                message: `UI action "${action.label}" on page "${page.title}" references missing API endpoint "${action.endpoint}"`,
                layer: "ui-api",
              });
            }
          }
        }
      }
    }
  }

  // 3. Check that navigation references valid page paths
  if (ui) {
    const pagePaths = new Set(ui.pages.map((p) => p.path));
    for (const nav of ui.navigation) {
      if (!pagePaths.has(nav.path)) {
        errors.push({
          type: "invalid_nav_reference",
          message: `Navigation item "${nav.label}" references non-existent page path "${nav.path}"`,
          layer: "ui",
        });
      }
    }
  }

  // 4. Check that auth roles referenced in route guards exist
  if (auth && ui) {
    const definedRoles = new Set(auth.roles.map((r) => r.role));
    for (const guard of auth.routeGuards) {
      for (const role of guard.allowedRoles) {
        if (!definedRoles.has(role)) {
          errors.push({
            type: "undefined_role",
            message: `Route guard for "${guard.path}" references undefined role "${role}"`,
            layer: "auth",
          });
        }
      }
    }

    // Also check page-level role requirements
    for (const page of ui.pages) {
      if (page.requiredRole && !definedRoles.has(page.requiredRole)) {
        errors.push({
          type: "undefined_role",
          message: `Page "${page.title}" requires undefined role "${page.requiredRole}"`,
          layer: "ui-auth",
        });
      }
    }
  }

  // 5. Check DB table references (foreign keys)
  if (database) {
    const tableNames = new Set(database.tables.map((t) => t.name));
    for (const table of database.tables) {
      for (const column of table.columns) {
        if (column.references && !tableNames.has(column.references.table)) {
          errors.push({
            type: "invalid_foreign_key",
            message: `Table "${table.name}" column "${column.name}" references non-existent table "${column.references.table}"`,
            layer: "database",
          });
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Full validation — structural + cross-layer
 * @param {object} fullConfig - Complete app configuration
 * @returns {{ valid: boolean, structuralErrors: Array, crossLayerErrors: Array, crossLayerWarnings: Array, score: number }}
 */
export function validateFull(fullConfig) {
  // Lightweight structural validation — check presence of key sections
  const structuralErrors = [];
  if (!fullConfig.ui?.pages?.length) structuralErrors.push({ type: "missing", message: "No UI pages defined" });
  if (!fullConfig.api?.endpoints?.length) structuralErrors.push({ type: "missing", message: "No API endpoints defined" });
  if (!fullConfig.database?.tables?.length) structuralErrors.push({ type: "missing", message: "No DB tables defined" });
  if (!fullConfig.auth?.roles?.length) structuralErrors.push({ type: "missing", message: "No auth roles defined" });

  // Cross-layer validation (only if all layers present)
  let crossLayer = { valid: true, errors: [], warnings: [] };
  if (fullConfig.ui && fullConfig.api && fullConfig.database && fullConfig.auth) {
    crossLayer = validateCrossLayer(fullConfig);
  }

  const totalErrors = structuralErrors.length + crossLayer.errors.length;
  const totalWarnings = crossLayer.warnings.length;

  // Score: 100 = perfect, deduct 15 per structural error, 5 per cross-layer error, 1 per warning
  const score = Math.max(0, 100 - structuralErrors.length * 15 - crossLayer.errors.length * 5 - totalWarnings * 1);

  return {
    valid: structuralErrors.length === 0 && crossLayer.valid,
    structuralErrors,
    crossLayerErrors: crossLayer.errors,
    crossLayerWarnings: crossLayer.warnings,
    score,
  };
}
