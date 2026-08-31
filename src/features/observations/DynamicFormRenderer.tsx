import { TextField } from "@/src/components/ui";
import React, { useEffect, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { calculateRpn, toggleMultiSelect, type AnswerValue, type DynamicForm, type Question } from "./model";

function kind(q: Question) {
  const raw =
    (typeof q.question_type === "object"
      ? q.question_type.name
      : q.question_type) ??
    q.type ??
    "text";
  return raw.toLowerCase().replaceAll("_", " ");
}
function role(q: Question): "likelihood" | "severity" | "rpn" | undefined {
  if (q.metadata?.role) return q.metadata.role;
  const type = kind(q);
  if (type.includes("likelihood")) return "likelihood";
  if (type.includes("severity")) return "severity";
  if (type === "rpn" || type.includes("risk priority")) return "rpn";
}
export function isMultiSelectQuestion(q: Question) {
  const type = kind(q);
  return type.includes("multi") || type.includes("checkbox");
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
  const questions = useMemo(
    () => form.sections?.flatMap((s) => s.questions ?? []) ?? form.questions ?? [],
    [form],
  );
  const likelihood = questions.find((q) => role(q) === "likelihood");
  const severity = questions.find((q) => role(q) === "severity");
  const rpn = questions.find((q) => role(q) === "rpn");
  const likelihoodValue = likelihood ? Number(values[String(likelihood.id)]) : NaN;
  const severityValue = severity ? Number(values[String(severity.id)]) : NaN;
  const score = Number.isFinite(likelihoodValue) && Number.isFinite(severityValue)
    ? calculateRpn(likelihoodValue, severityValue)
    : null;
  useEffect(() => {
    if (!rpn || !score || values[String(rpn.id)] === score.score) return;
    onChange(String(rpn.id), score.score);
  }, [onChange, rpn, score, values]);
  return (
    <View>
      {questions.map((q) => {
        const id = String(q.id),
          type = kind(q),
          label = q.label ?? q.question ?? "Question";
        const multi = isMultiSelectQuestion(q);
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
                {(q.options ?? []).map((o, optionIndex) => {
                  const option = o.value ?? o.id;
                  const current = values[id];
                  const selected = Array.isArray(current)
                    ? (current as (string | number)[]).includes(option)
                    : current === option;
                  return (
                    <Pressable
                      key={`${String(o.id)}-${optionIndex}`}
                      accessibilityRole={multi ? "checkbox" : "radio"}
                      accessibilityState={multi ? { checked: selected } : { selected }}
                      onPress={() =>
                        onChange(
                          id,
                          multi
                            ? toggleMultiSelect(
                                current,
                                option,
                                (q.options ?? []).map((item) => item.value ?? item.id),
                              )
                            : option,
                        )
                      }
                      className={`min-h-11 justify-center rounded-xl border px-4 ${selected ? "border-brand bg-red-50" : "border-slate-300 bg-white"}`}
                    >
                      <Text>{multi ? `${selected ? "☑" : "☐"} ` : ""}{o.label ?? o.option ?? String(option)}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {errors[id] ? (
                <Text className="mt-1 text-red-700">{errors[id]}</Text>
              ) : null}
            </View>
          );
        const computedRpn = role(q) === "rpn";
        const numeric =
          type.includes("number") ||
          type.includes("numeric") ||
          q.metadata?.role === "rpn";
        return (
          <TextField
            key={id}
            label={`${label}${q.required || q.is_required ? " *" : ""}`}
            value={values[id] == null ? "" : String(values[id])}
            editable={!computedRpn}
            onChangeText={(v) =>
              onChange(id, numeric && v !== "" ? Number(v) : v)
            }
            keyboardType={numeric ? "numeric" : "default"}
            multiline={type.includes("multiline") || type.includes("textarea")}
            error={errors[id]}
          />
        );
      })}
      {score ? (
        <View accessibilityLabel={`RPN ${score.score}`} className={`mb-4 rounded-xl border p-4 ${score.critical ? "border-red-600 bg-red-50" : "border-slate-300 bg-white"}`}>
          <Text className="text-sm font-semibold text-slate-600">Calculated RPN</Text>
          <Text className={`text-3xl font-bold ${score.critical ? "text-red-700" : "text-ink"}`}>{score.score}</Text>
          <Text className="text-sm text-slate-600">{score.critical ? "Critical risk score" : "Risk score"}</Text>
        </View>
      ) : null}
    </View>
  );
}
