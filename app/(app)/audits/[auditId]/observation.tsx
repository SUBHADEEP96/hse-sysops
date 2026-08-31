import { queryClient } from "@/src/api/query-client";
import {
    Button,
    Card,
    ErrorState,
    LoadingState,
    Screen,
} from "@/src/components/ui";
import { getForms, getOpeningPairs } from "@/src/features/audits/api";
import { useAuth } from "@/src/features/auth/session";
import {
    getDynamicForm,
    submitObservation,
} from "@/src/features/observations/api";
import {
    ObservationAttachmentAdapter,
    validateAttachment,
} from "@/src/features/observations/attachments";
import { DynamicFormRenderer } from "@/src/features/observations/DynamicFormRenderer";
import type {
    AnswerValue,
    Attachment,
} from "@/src/features/observations/model";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
export default function Observation() {
  const { auditId, mode } = useLocalSearchParams<{
    auditId: string;
    mode?: string;
  }>();
  const { user } = useAuth();
  const [formId, setFormId] = useState("");
  const [openingId, setOpeningId] = useState("");
  const [values, setValues] = useState<Record<string, AnswerValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Attachment[]>([]);
  const [fileError, setFileError] = useState("");
  const forms = useQuery({
    queryKey: ["forms", "selection"],
    queryFn: getForms,
  });
  const pairs = useQuery({
    queryKey: ["audits", auditId, "pairs"],
    queryFn: () => getOpeningPairs(auditId),
    enabled: mode === "closing",
  });
  const form = useQuery({
    queryKey: ["dynamic-form", formId],
    queryFn: () => getDynamicForm(formId),
    enabled: !!formId,
  });
  const mutation = useMutation({
    mutationFn: submitObservation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["audits", auditId] });
      router.back();
    },
  });
  if (forms.isLoading) return <LoadingState />;
  if (forms.error)
    return (
      <Screen>
        <ErrorState
          message={forms.error.message}
          retry={() => void forms.refetch()}
        />
      </Screen>
    );
  async function image(camera = false) {
    const permission = camera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted)
      return setFileError("Permission is required to choose an image.");
    const result = camera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.8,
        });
    if (!result.canceled) {
      const a = result.assets[0];
      add({
        uri: a.uri,
        name: a.fileName ?? "image.jpg",
        mimeType: a.mimeType,
        size: a.fileSize,
      });
    }
  }
  async function document() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/jpeg", "image/png", "application/pdf"],
    });
    if (!result.canceled) {
      const a = result.assets[0];
      add({ uri: a.uri, name: a.name, mimeType: a.mimeType, size: a.size });
    }
  }
  function add(a: Attachment) {
    const e = validateAttachment(a);
    setFileError(e ?? "");
    if (!e) setFiles((v) => [...v, a]);
  }
  function submit() {
    if (!form.data || !user) return;
    const next: Record<string, string> = {};
    const questions =
      form.data.sections?.flatMap((s) => s.questions ?? []) ??
      form.data.questions ??
      [];
    for (const q of questions)
      if (
        (q.required || q.is_required) &&
        (values[String(q.id)] == null || values[String(q.id)] === "")
      )
        next[String(q.id)] = "This field is required.";
    if (mode === "closing" && !openingId)
      next.opening = "Select the opening observation being closed.";
    if (files.length && !ObservationAttachmentAdapter.canSubmit)
      setFileError(ObservationAttachmentAdapter.explanation);
    setErrors(next);
    if (Object.keys(next).length || files.length) return;
    mutation.mutate({
      audit_id: auditId,
      submitter_id: user.id,
      form_id: form.data.id,
      sat_answers: questions.map((q) => ({
        question_id: q.id,
        answer: values[String(q.id)] ?? null,
      })),
      ...(mode === "closing" ? { opening_sub_id: openingId } : {}),
    });
  }
  return (
    <Screen>
      <Text className="mb-3 text-lg font-bold text-ink">
        Select {mode === "closing" ? "closing" : "opening"} form
      </Text>
      <View className="mb-5 flex-row flex-wrap gap-2">
        {forms.data?.length ? forms.data.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => setFormId(String(f.id))}
            className={`min-h-11 justify-center rounded-xl border px-3 ${formId === String(f.id) ? "border-brand bg-red-50" : "border-slate-300 bg-white"}`}
          >
            <Text>{f.name}</Text>
          </Pressable>
        )) : <Text className="text-slate-600">No forms are available.</Text>}
      </View>
      {mode === "closing" ? (
        <>
          <Text className="mb-2 font-semibold text-ink">
            Opening observation *
          </Text>
          {Array.isArray(pairs.data)
            ? pairs.data.map((p, i) => {
                const r = p as Record<string, unknown>;
                const id = String(r.opening_sub_id ?? r.id ?? "");
                return (
                  <Pressable
                    key={`${id || "opening"}-${i}`}
                    onPress={() => setOpeningId(id)}
                    className={`mb-2 min-h-11 justify-center rounded-xl border px-3 ${openingId === id ? "border-brand bg-red-50" : "border-slate-300 bg-white"}`}
                  >
                    <Text>
                      {String(r.audit_name ?? r.form_name ?? `Opening ${id}`)}
                    </Text>
                  </Pressable>
                );
              })
            : null}
          {errors.opening ? (
            <Text className="mb-3 text-red-700">{errors.opening}</Text>
          ) : null}
        </>
      ) : null}
      {form.isLoading ? (
        <LoadingState />
      ) : form.data ? (
        <>
          <DynamicFormRenderer
            form={form.data}
            values={values}
            errors={errors}
            onChange={(id, value) => setValues((v) => ({ ...v, [id]: value }))}
          />
          <Card>
            <Text className="mb-2 font-bold text-ink">Attachments</Text>
            <Text className="mb-3 text-sm text-slate-600">
              Choose files now. Attachment submission remains disabled until the
              backend defines its encoding.
            </Text>
            <View className="gap-2">
              <Button
                title="Take photo"
                variant="secondary"
                onPress={() => void image(true)}
              />
              <Button
                title="Choose image"
                variant="secondary"
                onPress={() => void image()}
              />
              <Button
                title="Choose document"
                variant="secondary"
                onPress={() => void document()}
              />
            </View>
            {files.map((f, i) => (
              <Pressable
                accessibilityLabel={`Remove ${f.name}`}
                key={`${f.uri}-${i}`}
                onPress={() => setFiles((v) => v.filter((_, x) => x !== i))}
              >
                <Text className="mt-3 text-brand">{f.name} · Remove</Text>
              </Pressable>
            ))}
            {fileError ? (
              <Text className="mt-2 text-red-700">{fileError}</Text>
            ) : null}
          </Card>
          {mutation.error ? (
            <Text className="mb-3 text-red-700">{mutation.error.message}</Text>
          ) : null}
          <Button
            title={mutation.isPending ? "Submitting…" : "Submit observation"}
            disabled={mutation.isPending}
            onPress={submit}
          />
        </>
      ) : null}
    </Screen>
  );
}
