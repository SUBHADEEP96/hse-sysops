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
import { ImageAnnotationEditor } from "@/src/features/observations/annotation/ImageAnnotationEditor";
import {
    getDynamicForm,
    submitObservation
} from "@/src/features/observations/api";
import {
    ObservationAttachmentAdapter,
    validateAttachment,
} from "@/src/features/observations/attachments";
import { DynamicFormRenderer, questionKind } from "@/src/features/observations/DynamicFormRenderer";
import type {
    AnswerValue,
    Attachment,
    SatAnswer,
    SubmissionPayload,
} from "@/src/features/observations/model";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Image, Modal, Pressable, Text, View } from "react-native";
export default function Observation() {
  const { auditId, mode, openingSubId, formId: initialFormId } = useLocalSearchParams<{
    auditId: string;
    mode?: string;
    openingSubId?: string;
    formId?: string;
  }>();
  const { user } = useAuth();
  const [formId, setFormId] = useState(initialFormId ?? "");
  const [openingId, setOpeningId] = useState(openingSubId ?? "");
  const [values, setValues] = useState<Record<string, AnswerValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filesByQuestion, setFilesByQuestion] = useState<Record<string, Attachment[]>>({});
  const [fileError, setFileError] = useState("");
  const [annotating, setAnnotating] = useState<{ questionId: string; index: number } | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
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
    mutationFn: (payload: SubmissionPayload) => submitObservation(payload),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ["audits", auditId] });
      const record = typeof response === "object" && response !== null ? response as Record<string, unknown> : {};
      const data = typeof record.data === "object" && record.data !== null ? record.data as Record<string, unknown> : {};
      const submissionId = data.submission_id ?? record.submission_id;
      Alert.alert("Observation submitted", submissionId == null ? "The observation was saved." : `Submission ${String(submissionId)} was saved.`, [
        { text: "OK", onPress: () => router.back() },
      ]);
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
  async function image(questionId: string, camera = false) {
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
      add(questionId, {
        uri: a.uri,
        name: a.fileName ?? "image.jpg",
        mimeType: a.mimeType,
        size: a.fileSize,
      });
    }
  }
  async function document(questionId: string) {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/jpeg", "image/png", "application/pdf"],
    });
    if (!result.canceled) {
      const a = result.assets[0];
      add(questionId, { uri: a.uri, name: a.name, mimeType: a.mimeType, size: a.size });
    }
  }
  function add(questionId: string, a: Attachment) {
    const e = validateAttachment(a);
    setFileError(e ?? "");
    if (!e) setFilesByQuestion((current) => ({ ...current, [questionId]: [...(current[questionId] ?? []), a] }));
  }
  async function submit() {
    if (!form.data || !user) return;
    const next: Record<string, string> = {};
    const questions =
      form.data.sections?.flatMap((s) => s.questions ?? []) ??
      form.data.questions ??
      [];
    for (const q of questions) {
      const value = values[String(q.id)];
      if (
        (q.required || q.is_required) &&
        (questionKind(q).match(/media|image|attachment|file/)
          ? !(filesByQuestion[String(q.id)]?.length)
          : value == null || value === "" || (Array.isArray(value) && value.length === 0))
      )
        next[String(q.id)] = "This field is required.";
    }
    if (mode === "closing" && !openingId)
      next.opening = "Select the opening observation being closed.";
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      const satAnswers: SatAnswer[] = [];
      for (const q of questions) {
        const questionId = String(q.id);
        const attachments = filesByQuestion[questionId] ?? [];
        const type = questionKind(q);
        const isMedia = type.includes("media") || type.includes("image") || type.includes("attachment") || type.includes("file");
        if (isMedia) {
          satAnswers.push({
            question_id: q.id,
            is_media: true,
            answer_value: null,
            media: await ObservationAttachmentAdapter.encode(attachments),
          });
          continue;
        }
        const answer = values[questionId] ?? null;
        satAnswers.push({
          question_id: q.id,
          answer_value: Array.isArray(answer)
            ? answer.filter((item): item is string | number => typeof item === "string" || typeof item === "number")
            : answer,
        });
      }

      mutation.mutate({
        audit_id: auditId,
        submitter_id: user.id,
        form_id: form.data.id,
        sat_answers: satAnswers,
        ...(mode === "closing" ? { opening_sub_id: openingId } : {}),
      });
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "Failed to encode media");
    }
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
          {(
            form.data.sections?.flatMap((section) => section.questions ?? []) ?? form.data.questions ?? []
          ).filter((question) => /media|image|attachment|file/.test(questionKind(question))).map((question) => {
            const questionId = String(question.id);
            const questionFiles = filesByQuestion[questionId] ?? [];
            return (
              <Card key={questionId}>
                <Text className="mb-2 font-bold text-ink">{question.label ?? question.question ?? "Images"}{question.required || question.is_required ? " *" : ""}</Text>
                <Text className="mb-3 text-sm text-slate-600">Add and mark photographic evidence in occurrence order.</Text>
                <View className="gap-2">
                  <Button title="Take photo" variant="secondary" onPress={() => void image(questionId, true)} />
                  <Button title="Choose image" variant="secondary" onPress={() => void image(questionId)} />
                  <Button title="Choose document" variant="secondary" onPress={() => void document(questionId)} />
                </View>
                {questionFiles.map((file, index) => (
                  <View key={`${file.uri}-${index}`} className="mt-3 rounded-xl border border-slate-200 p-3">
                    {file.mimeType?.startsWith("image/") ? (
                      <Pressable accessibilityRole="button" accessibilityLabel={`Preview ${file.name}`} onPress={() => setPreviewUri(file.uri)}>
                        <Image source={{ uri: file.uri }} resizeMode="cover" className="h-40 w-full rounded-lg" />
                      </Pressable>
                    ) : null}
                    <Text className="mt-2 font-medium text-ink">{file.name}{file.annotated ? " · Marked" : ""}</Text>
                    <View className="mt-2 flex-row gap-2">
                      {file.mimeType?.startsWith("image/") ? <Button title={file.annotated ? "Edit marking" : "Mark image"} variant="secondary" accessibilityLabel="Mark image" onPress={() => setAnnotating({ questionId, index })} /> : null}
                      <Button title="Remove" variant="danger" accessibilityLabel="Remove attachment" onPress={() => setFilesByQuestion((current) => ({ ...current, [questionId]: (current[questionId] ?? []).filter((_, itemIndex) => itemIndex !== index) }))} />
                    </View>
                  </View>
                ))}
                {errors[questionId] ? <Text className="mt-2 text-red-700">{errors[questionId]}</Text> : null}
                {fileError ? <Text className="mt-2 text-red-700">{fileError}</Text> : null}
              </Card>
            );
          })}
          {mutation.error ? (
            <Text className="mb-3 text-red-700">{mutation.error.message}</Text>
          ) : null}
          <Button
            title={mutation.isPending ? "Submitting…" : "Submit observation"}
            disabled={mutation.isPending}
            onPress={submit}
          />
          {annotating !== null && filesByQuestion[annotating.questionId]?.[annotating.index] ? (
            <ImageAnnotationEditor
              visible
              imageUri={filesByQuestion[annotating.questionId][annotating.index].originalUri ?? filesByQuestion[annotating.questionId][annotating.index].uri}
              onCancel={() => setAnnotating(null)}
              onSave={(uri) => {
                setFilesByQuestion((current) => ({ ...current, [annotating.questionId]: (current[annotating.questionId] ?? []).map((file, index) => index === annotating.index ? { ...file, uri, originalUri: file.originalUri ?? file.uri, annotated: true, name: `marked-${file.name.replace(/^marked-/, "")}` } : file) }));
                setAnnotating(null);
              }}
            />
          ) : null}
          <Modal visible={previewUri !== null} transparent animationType="fade" onRequestClose={() => setPreviewUri(null)}>
            <Pressable accessibilityRole="button" accessibilityLabel="Close image preview" onPress={() => setPreviewUri(null)} className="flex-1 items-center justify-center bg-black/90 p-4">
              {previewUri ? <Image source={{ uri: previewUri }} resizeMode="contain" className="h-full w-full" /> : null}
            </Pressable>
          </Modal>
        </>
      ) : null}
    </Screen>
  );
}
