import { describe, expect, it } from "vitest";
import type { FormFieldWire } from "../api/wire";
import {
  DEFAULT_FIELD_LABELS,
  fieldKeyFromLabel,
  hasOptions,
  isSelectField,
  optionValueFromLabel,
  validateFormFields,
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

describe("validateFormFields", () => {
  it("accepts valid fields", () => {
    expect(validateFormFields([field()])).toBeNull();
    expect(
      validateFormFields([
        field(),
        field({ key: "details", label: "Details", min_length: 5 }),
      ]),
    ).toBeNull();
  });

  it("needs at least one field", () => {
    expect(validateFormFields([])).toMatch(/at least one field/);
  });

  it("needs labels and valid, unique variable names", () => {
    expect(validateFormFields([field({ label: " " })])).toMatch(/label/);
    expect(validateFormFields([field({ key: "Bad Name" })])).toMatch(
      /variable name/,
    );
    expect(validateFormFields([field(), field()])).toMatch(
      /more than one field/,
    );
  });

  it("rejects a minimum length above the maximum", () => {
    expect(
      validateFormFields([field({ min_length: 10, max_length: 5 })]),
    ).toMatch(/minimum length/);
    expect(
      validateFormFields([field({ min_length: 10, max_length: 0 })]),
    ).toBeNull();
  });
});

describe("select fields", () => {
  it("tells selects from text inputs", () => {
    expect(isSelectField(field())).toBe(false);
    expect(isSelectField(field({ type: "text" }))).toBe(false);
    for (const type of ["user", "role", "mentionable", "channel"]) {
      expect(isSelectField(field({ type }))).toBe(true);
    }
  });

  it("accepts selects and limits how many they can pick", () => {
    expect(
      validateFormFields([field({ type: "role", max_values: 25 })]),
    ).toBeNull();
    expect(
      validateFormFields([field({ type: "user", max_values: 26 })]),
    ).toMatch(/between 1 and 25/);
  });

  it("ignores the text limits of a select", () => {
    expect(
      validateFormFields([
        field({ type: "user", min_length: 10, max_length: 5 }),
      ]),
    ).toBeNull();
  });
});

describe("option fields", () => {
  const opts = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      label: `Option ${i + 1}`,
      value: `option_${i + 1}`,
    }));

  it("tells which fields have options", () => {
    expect(hasOptions(field({ type: "select" }))).toBe(true);
    expect(hasOptions(field({ type: "radio" }))).toBe(true);
    expect(hasOptions(field({ type: "checkboxes" }))).toBe(true);
    expect(hasOptions(field({ type: "checkbox" }))).toBe(false);
    expect(hasOptions(field({ type: "user" }))).toBe(false);
  });

  it("accepts valid option fields and checkboxes", () => {
    for (const f of [
      field({ type: "select", options: opts(25), max_values: 25 }),
      field({ type: "radio", options: opts(2) }),
      field({ type: "checkboxes", options: opts(10), max_values: 3 }),
      field({ type: "checkbox", default: true }),
    ]) {
      expect(validateFormFields([f])).toBeNull();
    }
  });

  it("limits the number of options", () => {
    expect(
      validateFormFields([field({ type: "radio", options: opts(1) })]),
    ).toMatch(/between 2 and 10/);
    expect(
      validateFormFields([field({ type: "radio", options: opts(11) })]),
    ).toMatch(/between 2 and 10/);
    expect(
      validateFormFields([field({ type: "select", options: opts(26) })]),
    ).toMatch(/between 1 and 25/);
    expect(validateFormFields([field({ type: "checkboxes" })])).toMatch(
      /between 1 and 10/,
    );
  });

  it("needs labels and unique values", () => {
    const o = opts(2);
    expect(
      validateFormFields([
        field({ type: "select", options: [{ label: "", value: "a" }] }),
      ]),
    ).toMatch(/needs a label/);
    expect(
      validateFormFields([
        field({ type: "select", options: [{ label: "A", value: "" }] }),
      ]),
    ).toMatch(/needs a value/);
    expect(
      validateFormFields([
        field({
          type: "select",
          options: [o[0], { ...o[1], value: o[0].value }],
        }),
      ]),
    ).toMatch(/more than one option/);
  });

  it("limits defaults and picks", () => {
    const two = opts(3).map((o, i) => ({ ...o, default: i < 2 }));
    expect(
      validateFormFields([field({ type: "radio", options: two })]),
    ).toMatch(/Only one option/);
    expect(
      validateFormFields([field({ type: "select", options: two })]),
    ).toMatch(/by default than it can pick/);
    expect(
      validateFormFields([
        field({ type: "checkboxes", options: opts(3), max_values: 4 }),
      ]),
    ).toMatch(/more values than it has options/);
  });

  it("makes option values from labels", () => {
    expect(optionValueFromLabel("Bug report!")).toBe("bug_report");
  });
});

describe("default labels", () => {
  it("has a label for every type and a valid variable name from it", () => {
    for (const type of [
      "text",
      "user",
      "role",
      "mentionable",
      "channel",
      "select",
      "radio",
      "checkboxes",
      "checkbox",
    ]) {
      expect(DEFAULT_FIELD_LABELS[type]).toBeTruthy();
      expect(fieldKeyFromLabel(DEFAULT_FIELD_LABELS[type])).toMatch(
        /^[a-z][a-z0-9_]*$/,
      );
    }
  });
});
