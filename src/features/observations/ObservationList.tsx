import { Button, Card, EmptyState, ErrorState, LoadingState } from "@/src/components/ui";
import { env } from "@/src/config/env";
import { Image } from "expo-image";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import type { SavedObservation } from "./model";

const imageSource = (uri: string) =>
  uri.startsWith("/") ? `${env.origin}${uri}` : uri;

function Badge({ value, tone }: { value: string; tone: "status" | "risk" }) {
  return (
    <View
      className={`rounded-full px-3 py-1 ${tone === "risk" ? "bg-amber-100" : "bg-slate-100"}`}
    >
      <Text
        className={`text-xs font-semibold ${tone === "risk" ? "text-amber-900" : "text-slate-700"}`}
      >
        {value}
      </Text>
    </View>
  );
}

export function ObservationList({
  observations,
  loading,
  error,
  retry,
  onClose,
}: {
  observations: SavedObservation[];
  loading: boolean;
  error?: string;
  retry: () => void;
  onClose?: (submissionId: string) => void;
}) {
  const [preview, setPreview] = useState<{ images: string[]; index: number }>();
  const [failedImages, setFailedImages] = useState(() => new Set<string>());

  if (loading) return <LoadingState label="Loading observations…" />;
  if (error) return <ErrorState message={error} retry={retry} />;
  if (!observations.length)
    return (
      <Card>
        <EmptyState
          title="No observations"
          message="No observations have been submitted for this audit."
        />
      </Card>
    );

  return (
    <>
      {observations.map((observation, index) => (
        <Card key={observation.id ?? `observation-${index}`}>
          <View className="flex-row items-start justify-between gap-3">
            <Text className="flex-1 text-base font-bold text-ink">
              {`Observation ${index + 1}`}{observation.title ? ` · ${observation.title}` : ""}
            </Text>
            <View className="flex-row flex-wrap justify-end gap-2">
              {observation.severity ? <Badge value={observation.severity} tone="risk" /> : null}
              {observation.status ? <Badge value={observation.status} tone="status" /> : null}
            </View>
          </View>
          {observation.submissionId ? <Text className="mt-2 text-sm text-slate-600">Submission ID: {observation.submissionId}</Text> : null}
          {observation.submitter ? <Text className="mt-1 text-sm text-slate-600">Submitted by {observation.submitter}</Text> : null}
          {observation.createdAt ? <Text className="mt-1 text-sm text-slate-600">Created {observation.createdAt}</Text> : null}

          {observation.details.map((detail, detailIndex) => (
            <View
              key={`${detail.label}-${detailIndex}`}
              className="mt-3 border-t border-slate-100 pt-3"
            >
              <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {detail.label}
              </Text>
              <Text selectable className="mt-1 text-base leading-6 text-ink">
                {detail.value}
              </Text>
            </View>
          ))}

          {observation.images.map((uri, imageIndex) => (
            <Pressable
              key={`${uri.slice(0, 80)}-${imageIndex}`}
              accessibilityRole="imagebutton"
              accessibilityLabel={`Preview marked image ${imageIndex + 1}`}
              className="mt-4 min-h-44 overflow-hidden rounded-xl bg-slate-100"
              onPress={() => setPreview({ images: observation.images.map(imageSource), index: imageIndex })}
            >
              {failedImages.has(uri) ? <View className="h-56 items-center justify-center"><Text className="text-slate-600">Image unavailable</Text></View> : <Image
                source={{ uri: imageSource(uri) }}
                contentFit="contain"
                className="h-56 w-full"
                accessibilityLabel={`Observation marked image ${imageIndex + 1}`}
                onError={() => setFailedImages((current) => new Set(current).add(uri))}
              />}
            </Pressable>
          ))}
          {observation.closingSubmissionId ? (
            <View className="mt-4 border-t border-slate-200 pt-4">
              <Text className="font-bold text-ink">Closing submission {observation.closingSubmissionId}</Text>
              {(observation.closingDetails ?? []).map((detail, detailIndex) => (
                <View key={`closing-${detail.label}-${detailIndex}`} className="mt-3">
                  <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500">{detail.label}</Text>
                  <Text selectable className="mt-1 text-base text-ink">{detail.value}</Text>
                </View>
              ))}
              {(observation.closingImages ?? []).map((uri, imageIndex) => (
                <Pressable key={`closing-${imageIndex}`} className="mt-4 min-h-44 overflow-hidden rounded-xl bg-slate-100" onPress={() => setPreview({ images: (observation.closingImages ?? []).map(imageSource), index: imageIndex })}>
                  <Image source={{ uri: imageSource(uri) }} contentFit="contain" className="h-56 w-full" />
                </Pressable>
              ))}
            </View>
          ) : observation.submissionId && onClose ? (
            <View className="mt-4"><Button title="Close observation" variant="secondary" onPress={() => onClose(observation.submissionId!)} /></View>
          ) : null}
        </Card>
      ))}

      <Modal
        visible={preview !== undefined}
        animationType="fade"
        onRequestClose={() => setPreview(undefined)}
      >
        <View className="flex-1 bg-black">
          <View className="absolute right-4 top-12 z-10">
            <Button
              title="Close"
              variant="secondary"
              accessibilityLabel="Close image preview"
              onPress={() => setPreview(undefined)}
            />
          </View>
          {preview ? (
            <Image
              source={{ uri: preview.images[preview.index] }}
              contentFit="contain"
              className="h-full w-full"
              accessibilityLabel="Full-screen marked observation image"
            />
          ) : null}
          {preview && preview.images.length > 1 ? <View className="absolute bottom-12 left-4 right-4 flex-row justify-between">
            <Button title="Previous" variant="secondary" disabled={preview.index === 0} onPress={() => setPreview((current) => current ? { ...current, index: current.index - 1 } : current)} />
            <Text className="self-center text-white">{preview.index + 1} / {preview.images.length}</Text>
            <Button title="Next" variant="secondary" disabled={preview.index === preview.images.length - 1} onPress={() => setPreview((current) => current ? { ...current, index: current.index + 1 } : current)} />
          </View> : null}
        </View>
      </Modal>
    </>
  );
}
