import { useMutation, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, Text, View } from "react-native";
import {
  Button,
  Card,
  ErrorState,
  LoadingState,
  Screen,
  StatusBadge,
} from "@/src/components/ui";
import {
  auditKeys,
  getAudit,
  updateAuditStatus,
} from "@/src/features/audits/api";
import { queryClient } from "@/src/api/query-client";
export default function AuditDetail() {
  const { auditId } = useLocalSearchParams<{ auditId: string }>();
  const q = useQuery({
    queryKey: auditKeys.detail(auditId),
    queryFn: () => getAudit(auditId),
  });
  const status = useMutation({
    mutationFn: (s: 1 | 2 | 3) => updateAuditStatus(auditId, s),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: auditKeys.all }),
        queryClient.invalidateQueries({ queryKey: auditKeys.detail(auditId) }),
      ]);
    },
  });
  if (q.isLoading) return <LoadingState />;
  if (q.error)
    return (
      <Screen>
        <ErrorState message={q.error.message} retry={() => void q.refetch()} />
      </Screen>
    );
  const a = q.data!;
  const change = (s: 1 | 2 | 3) =>
    s === 2
      ? Alert.alert(
          "Close audit?",
          "Closing requires all opening observations to have matching closings.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Close",
              style: "destructive",
              onPress: () => status.mutate(2),
            },
          ],
        )
      : status.mutate(s);
  return (
    <Screen>
      <Card>
        <Text className="text-2xl font-bold text-ink">
          {a.audit_name ?? a.name ?? `Audit ${a.id}`}
        </Text>
        <Text className="my-3 text-slate-600">
          {typeof a.location === "object" ? a.location.name : a.location}
        </Text>
        <StatusBadge status={a.status_id ?? a.status ?? "Unknown"} />
      </Card>
      <Text className="mb-2 mt-3 text-lg font-bold text-ink">Status</Text>
      <View className="mb-5 gap-2">
        <Button
          title="Mark open"
          variant="secondary"
          onPress={() => change(1)}
        />
        <Button
          title="Mark in progress"
          variant="secondary"
          onPress={() => change(3)}
        />
        <Button
          title="Close audit"
          variant="danger"
          onPress={() => change(2)}
        />
      </View>
      {status.error ? (
        <Text className="mb-3 text-red-700">{status.error.message}</Text>
      ) : null}
      <Button
        title="Add opening observation"
        onPress={() =>
          router.push({
            pathname: "/(app)/audits/[auditId]/observation",
            params: { auditId, mode: "opening" },
          })
        }
      />
      <View className="h-3" />
      <Button
        title="Add closing observation"
        variant="secondary"
        onPress={() =>
          router.push({
            pathname: "/(app)/audits/[auditId]/observation",
            params: { auditId, mode: "closing" },
          })
        }
      />
    </Screen>
  );
}
