import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
} from "@/src/components/ui";
import { auditKeys, getAudits } from "@/src/features/audits/api";
export default function Audits() {
  const q = useQuery({
    queryKey: auditKeys.all,
    queryFn: () => getAudits("my_audits"),
  });
  if (q.isLoading) return <LoadingState label="Loading audits…" />;
  if (q.error)
    return (
      <ErrorState message={q.error.message} retry={() => void q.refetch()} />
    );
  return (
    <View className="flex-1 bg-canvas px-5 pt-4">
      <Button
        title="Create audit"
        onPress={() => router.push("/(app)/audits/create")}
      />
      {!q.data?.length ? (
        <EmptyState
          title="No audits"
          message="Audits assigned to you will appear here."
        />
      ) : (
        <ScrollView
          className="mt-4"
          refreshControl={
            <RefreshControl
              refreshing={q.isRefetching}
              onRefresh={() => void q.refetch()}
            />
          }
        >
          {q.data.map((audit) => (
            <Pressable
              key={String(audit.id)}
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: "/(app)/audits/[auditId]",
                  params: { auditId: String(audit.id) },
                })
              }
            >
              <Card>
                <Text className="text-lg font-bold text-ink">
                  {audit.audit_name ?? audit.name ?? `Audit ${audit.id}`}
                </Text>
                <Text className="mb-3 mt-1 text-slate-600">
                  {typeof audit.location === "object"
                    ? audit.location.name
                    : (audit.location ?? "Location unavailable")}
                </Text>
                <StatusBadge
                  status={audit.status_id ?? audit.status ?? "Unknown"}
                />
              </Card>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
