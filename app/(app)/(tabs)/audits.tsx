import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { Card, EmptyState, ErrorState, LoadingState, StatusBadge } from "@/src/components/ui";
import { auditKeys, getAudits, type Audit } from "@/src/features/audits/api";
import { formatAuditDateTime } from "@/src/features/audits/date";
import {
  auditStatus,
  filterAudits,
  type AuditStatusFilter,
} from "@/src/features/audits/model";

const FILTERS: { id: AuditStatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In Progress" },
  { id: "closed", label: "Closed" },
];
type Scope = "my_audits" | "my_location";

function AuditCard({ audit }: { audit: Audit }) {
  const location =
    typeof audit.location === "object" ? audit.location.name : audit.location;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${audit.audit_name ?? audit.name ?? `audit ${audit.id}`}`}
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
        <Text className="mt-1 text-slate-600">{location || "Location unavailable"}</Text>
        {audit.auditor_name || audit.auditor ? (
          <Text className="mt-1 text-slate-600">Auditor: {audit.auditor_name ?? audit.auditor}</Text>
        ) : null}
        {audit.created_at ? <Text className="mb-3 mt-1 text-slate-500">{formatAuditDateTime(audit.created_at)}</Text> : <View className="h-3" />}
        <StatusBadge status={auditStatus(audit)} />
      </Card>
    </Pressable>
  );
}

export default function Audits() {
  const [scope, setScope] = useState<Scope>("my_audits");
  const [filter, setFilter] = useState<AuditStatusFilter>("all");
  const q = useQuery({
    queryKey: [...auditKeys.all, scope],
    queryFn: () => getAudits(scope),
  });
  const data = useMemo(() => filterAudits(q.data ?? [], filter), [filter, q.data]);
  if (q.isLoading) return <LoadingState label="Loading audits…" />;
  if (q.error) return <ErrorState message={q.error.message} retry={() => void q.refetch()} />;
  return (
    <View className="flex-1 bg-canvas px-5 pt-4">
      <View className="mb-3 flex-row rounded-xl bg-slate-200 p-1">
        {([{ id: "my_audits", label: "My Audits" }, { id: "my_location", label: "Opened Audits" }] as const).map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: scope === item.id }}
            className={`min-h-11 flex-1 items-center justify-center rounded-lg ${scope === item.id ? "bg-white" : ""}`}
            onPress={() => { setScope(item.id); setFilter("all"); }}
          ><Text className="font-semibold text-ink">{item.label}</Text></Pressable>
        ))}
      </View>
      <View className="mb-3 flex-row flex-wrap gap-2">
        {FILTERS.map((item) => (
          <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: filter === item.id }} onPress={() => setFilter(item.id)} className={`min-h-11 justify-center rounded-full border px-4 ${filter === item.id ? "border-brand bg-red-50" : "border-slate-300 bg-white"}`}>
            <Text className="font-medium">{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={data}
        keyExtractor={(audit) => String(audit.id)}
        renderItem={({ item }) => <AuditCard audit={item} />}
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} />}
        contentContainerClassName="pb-28"
        ListEmptyComponent={<EmptyState title="No audits" message={scope === "my_location" ? "No open audits at your location." : filter === "all" ? "No audits assigned to you." : `No ${FILTERS.find((item) => item.id === filter)?.label.toLowerCase()} audits found.`} />}
      />
      <Pressable accessibilityRole="button" accessibilityLabel="Create audit" onPress={() => router.push("/(app)/audits/create")} className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-full bg-brand shadow-lg">
        <Ionicons name="add" size={30} color="white" />
      </Pressable>
    </View>
  );
}
