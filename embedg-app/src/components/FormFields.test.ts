import { describe, expect, it } from "vitest";
import type { FormFieldWire } from "../api/wire";
import {
  FIELD_TYPES,
  fieldKeyFromLabel,
  fieldType,
  optionValueFromLabel,
} from "./FormFields";

const field = (values: Partial<FormFieldWire> = {}): FormFieldWire => ({
  key: "reason",
  label: "Reason",
  required: true,
  ...values,
});

describe("fieldKeyFromLabel", () => {
  it("makes a variable name from a label", () => {
    expect(fieldKeyFromLabel("Reason for the report")).toBe(
      "reason_for_the_report",
    );
    expect(fieldKeyFromLabel("  Café & Bar! ")).toBe("cafe_bar");
  });

  it("starts with a letter and stays within the limit", () => {
    expect(fieldKeyFromLabel("2nd choice")).toBe("field_2nd_choice");
    expect(fieldKeyFromLabel("a".repeat(60))).toHaveLength(32);
  });

  it("is empty when nothing usable is left", () => {
    expect(fieldKeyFromLabel("!!!")).toBe("");
  });
});

describe("optionValueFromLabel", () => {
  it("makes option values from labels", () => {
    expect(optionValueFromLabel("Bug report!")).toBe("bug_report");
  });
});

describe("fieldType", () => {
  it("treats a field without a type as text", () => {
    expect(fieldType(field()).kind).toBe("text");
    expect(fieldType(field({ type: "text" })).kind).toBe("text");
  });

  it("tells the kinds of fields apart", () => {
    for (const type of ["user", "role", "mentionable", "channel"]) {
      expect(fieldType(field({ type })).kind).toBe("entity");
    }
    for (const type of ["select", "radio", "checkboxes"]) {
      expect(fieldType(field({ type })).kind).toBe("options");
    }
    expect(fieldType(field({ type: "checkbox" })).kind).toBe("checkbox");
  });

  it("has a default label for every type that makes a valid variable name", () => {
    for (const type of FIELD_TYPES) {
      expect(fieldKeyFromLabel(type.defaultLabel)).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });
});
