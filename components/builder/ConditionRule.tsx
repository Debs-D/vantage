"use client";

import { Input, Select } from "@/components/ui";
import { useActiveSchema, useNode, useQueryTree } from "@/hooks/use-query-tree";
import { Condition, ConditionValue, OPERATORS_BY_TYPE } from "@/lib/query/types";
import { OPERATOR_DEFS, operatorsForType } from "@/lib/schema/operators";
import { FieldDef } from "@/lib/schema/types";
import { findField } from "@/lib/schema/schemas";

export function ConditionRule({ nodeId }: { nodeId: string }) {
  const node = useNode(nodeId);
  const schema = useActiveSchema();
  const { updateCondition, removeNode } = useQueryTree();

  if (!node || node.type !== "condition") return null;
  const condition = node;

  const fieldDef = findField(schema, condition.field);
  const operators = fieldDef ? operatorsForType(fieldDef.type) : [];

  // Changing the field resets the operator to the first one its type allows and
  // clears the value, so the row can never be left in a mismatched state.
  const onFieldChange = (field: string) => {
    const def = findField(schema, field);
    const operator = def ? OPERATORS_BY_TYPE[def.type][0] : "equals";
    updateCondition(condition.id, { field, operator, value: null });
  };

  // Changing the operator may change how many operands it needs, so reset value.
  const onOperatorChange = (operator: string) => {
    updateCondition(condition.id, {
      operator: operator as Condition["operator"],
      value: OPERATOR_DEFS[operator as Condition["operator"]].arity === "many" ? [] : null,
    });
  };

  const setValue = (value: ConditionValue) =>
    updateCondition(condition.id, { value });

  return (
    <div
      className="group flex items-center gap-1.5 px-1.5 h-9 rounded border animate-slide-in"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <Select
        value={condition.field}
        onChange={(e) => onFieldChange(e.target.value)}
        aria-label="Field"
        className="w-32"
      >
        <option value="">Field…</option>
        {schema.fields.map((f) => (
          <option key={f.key} value={f.key}>
            {f.label}
          </option>
        ))}
      </Select>

      <Select
        value={condition.operator}
        onChange={(e) => onOperatorChange(e.target.value)}
        aria-label="Operator"
        disabled={!fieldDef}
        className="w-32"
      >
        {operators.map((op) => (
          <option key={op.key} value={op.key}>
            {op.label}
          </option>
        ))}
      </Select>

      <div className="flex-1 min-w-0">
        <ValueInput condition={condition} fieldDef={fieldDef} onChange={setValue} />
      </div>

      <button
        type="button"
        onClick={() => removeNode(condition.id)}
        aria-label="Remove condition"
        title="Remove condition"
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100
          text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all
          focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/40"
      >
        ×
      </button>
    </div>
  );
}

function ValueInput({
  condition,
  fieldDef,
  onChange,
}: {
  condition: Condition;
  fieldDef: FieldDef | null;
  onChange: (value: ConditionValue) => void;
}) {
  const arity = OPERATOR_DEFS[condition.operator].arity;

  // Stand-alone operators (is empty / is not empty) take no value.
  if (arity === "none") return null;

  if (!fieldDef) {
    return (
      <span className="text-xs px-2" style={{ color: "var(--text-muted)" }}>
        Select a field first
      </span>
    );
  }

  // "is any of" — multi-select over the enum's members.
  if (condition.operator === "in" && fieldDef.options) {
    const selected = Array.isArray(condition.value) ? condition.value : [];
    return (
      <div className="flex flex-wrap gap-1">
        {fieldDef.options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() =>
                onChange(active ? selected.filter((v) => v !== opt) : [...selected, opt])
              }
              className={`px-2 h-6 rounded text-xs border transition-colors ${
                active
                  ? "bg-coral/10 text-coral border-coral/30"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  // "between" — two bounds of the field's native input type.
  if (arity === "two") {
    const pair = Array.isArray(condition.value) ? condition.value : [];
    const inputType = fieldDef.type === "date" ? "date" : "number";
    const update = (index: 0 | 1, raw: string) => {
      const next: Array<string | number> = [pair[0] ?? "", pair[1] ?? ""];
      next[index] = inputType === "number" ? toNumber(raw) : raw;
      onChange(next);
    };
    return (
      <div className="flex items-center gap-1.5">
        <Input
          type={inputType}
          value={String(pair[0] ?? "")}
          onChange={(e) => update(0, e.target.value)}
          aria-label="From"
          className="w-24"
        />
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          and
        </span>
        <Input
          type={inputType}
          value={String(pair[1] ?? "")}
          onChange={(e) => update(1, e.target.value)}
          aria-label="To"
          className="w-24"
        />
      </div>
    );
  }

  // Single operand — widget chosen by the field's type.
  const value = Array.isArray(condition.value) ? "" : condition.value ?? "";

  if (fieldDef.type === "enum" && fieldDef.options) {
    return (
      <Select
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Value"
      >
        <option value="">Value…</option>
        {fieldDef.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </Select>
    );
  }

  if (fieldDef.type === "boolean") {
    return (
      <Select
        value={value === true ? "true" : value === false ? "false" : ""}
        onChange={(e) => onChange(e.target.value === "true")}
        aria-label="Value"
      >
        <option value="">Value…</option>
        <option value="true">true</option>
        <option value="false">false</option>
      </Select>
    );
  }

  const inputType =
    fieldDef.type === "number" ? "number" : fieldDef.type === "date" ? "date" : "text";

  return (
    <Input
      type={inputType}
      value={String(value)}
      onChange={(e) =>
        onChange(inputType === "number" ? toNumber(e.target.value) : e.target.value)
      }
      placeholder="Value…"
      aria-label="Value"
    />
  );
}

function toNumber(raw: string): number | "" {
  if (raw === "") return "";
  const n = Number(raw);
  return Number.isNaN(n) ? "" : n;
}
