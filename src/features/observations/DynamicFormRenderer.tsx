import React from "react";
import { Pressable, Text, View } from "react-native";
import { TextField } from "@/src/components/ui";
import type { AnswerValue, DynamicForm, Question } from "./model";

function kind(q: Question) {
  const raw =
    (typeof q.question_type === "object"
      ? q.question_type.name
      : q.question_type) ??
    q.type ??
    "text";
  return raw.toLowerCase().replaceAll("_", " ");
}
export function DynamicFormRenderer({
  form,
  values,
  errors,
  onChange,
}: {
  form: DynamicForm;
  values: Record<string, AnswerValue>;
  errors: Record<string, string>;
  onChange(id: string, value: AnswerValue): void;
}) {
  const questions =
    form.sections?.flatMap((s) => s.questions ?? []) ?? form.questions ?? [];
  return (
    <View>
      {questions.map((q) => {
        const id = String(q.id),
          type = kind(q),
          label = q.label ?? q.question ?? "Question";
        if (
          type.includes("choice") ||
          type.includes("select") ||
          type.includes("likelihood") ||
          type.includes("severity")
        )
          return (
            <View key={id} className="mb-4">
              <Text className="mb-2 font-semibold text-ink">
                {label}
                {q.required || q.is_required ? " *" : ""}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {(q.options ?? []).map((o) => {
                  const option = o.value ?? o.id;
                  const current = values[id];
                  const selected = Array.isArray(current)
                    ? (current as (string | number)[]).includes(option)
                    : current === option;
                  return (
                    <Pressable
                      key={String(o.id)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      onPress={() => onChange(id, option)}
                      className={`min-h-11 justify-center rounded-xl border px-4 ${selected ? "border-brand bg-red-50" : "border-slate-300 bg-white"}`}
                    >
                      <Text>{o.label ?? o.option ?? String(option)}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {errors[id] ? (
                <Text className="mt-1 text-red-700">{errors[id]}</Text>
              ) : null}
            </View>
          );
        const numeric =
          type.includes("number") ||
          type.includes("numeric") ||
          q.metadata?.role === "rpn";
        return (
          <TextField
            key={id}
            label={`${label}${q.required || q.is_required ? " *" : ""}`}
            value={values[id] == null ? "" : String(values[id])}
            onChangeText={(v) =>
              onChange(id, numeric && v !== "" ? Number(v) : v)
            }
            keyboardType={numeric ? "numeric" : "default"}
            multiline={type.includes("multiline") || type.includes("textarea")}
            error={errors[id]}
          />
        );
      })}
    </View>
  );
}
