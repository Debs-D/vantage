import { FieldType } from "@/lib/query/types";
import { SchemaDefinition } from "./types";

// Four mock schemas. Adding a new one is a single object declaration — the UI,
// the operator menus, and the validator all derive from this shape.

export const usersSchema: SchemaDefinition = {
  key: "users",
  label: "Users",
  fields: [
    { key: "id", label: "ID", type: "number" },
    { key: "name", label: "Name", type: "string" },
    { key: "email", label: "Email", type: "string" },
    { key: "age", label: "Age", type: "number" },
    {
      key: "status",
      label: "Status",
      type: "enum",
      options: ["active", "inactive", "pending"],
    },
    { key: "country", label: "Country", type: "string" },
    { key: "createdAt", label: "Created", type: "date" },
    { key: "purchaseCount", label: "Purchases", type: "number" },
  ],
};

export const ordersSchema: SchemaDefinition = {
  key: "orders",
  label: "Orders",
  fields: [
    { key: "id", label: "ID", type: "number" },
    { key: "orderId", label: "Order ID", type: "string" },
    { key: "amount", label: "Amount", type: "number" },
    {
      key: "status",
      label: "Status",
      type: "enum",
      options: ["pending", "shipped", "delivered", "cancelled"],
    },
    { key: "customerId", label: "Customer ID", type: "string" },
    {
      key: "region",
      label: "Region",
      type: "enum",
      options: ["NA", "EU", "APAC", "LATAM"],
    },
    { key: "createdAt", label: "Created", type: "date" },
    { key: "items", label: "Items", type: "number" },
  ],
};

export const productsSchema: SchemaDefinition = {
  key: "products",
  label: "Products",
  fields: [
    { key: "id", label: "ID", type: "number" },
    { key: "name", label: "Name", type: "string" },
    {
      key: "category",
      label: "Category",
      type: "enum",
      options: ["electronics", "books", "clothing", "home", "toys"],
    },
    { key: "price", label: "Price", type: "number" },
    { key: "stock", label: "Stock", type: "number" },
    { key: "rating", label: "Rating", type: "number" },
    { key: "active", label: "Active", type: "boolean" },
  ],
};

export const logsSchema: SchemaDefinition = {
  key: "logs",
  label: "Logs",
  fields: [
    { key: "id", label: "ID", type: "number" },
    {
      key: "level",
      label: "Level",
      type: "enum",
      options: ["info", "warn", "error"],
    },
    { key: "message", label: "Message", type: "string" },
    { key: "service", label: "Service", type: "string" },
    { key: "timestamp", label: "Timestamp", type: "date" },
  ],
};

export const SCHEMAS: Record<string, SchemaDefinition> = {
  users: usersSchema,
  orders: ordersSchema,
  products: productsSchema,
  logs: logsSchema,
};

export const SCHEMA_LIST: SchemaDefinition[] = Object.values(SCHEMAS);

// Flattens a schema to the field-name → type map the validator and executor
// need. This is the only part of the schema either of them depends on.
export function fieldTypesOf(schema: SchemaDefinition): Record<string, FieldType> {
  return Object.fromEntries(schema.fields.map((f) => [f.key, f.type]));
}

export function findField(schema: SchemaDefinition, key: string) {
  return schema.fields.find((f) => f.key === key) ?? null;
}
