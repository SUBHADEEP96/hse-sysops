import { Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Card, ErrorState, LoadingState, Screen } from "@/src/components/ui";
import { dashboardKeys, getDashboard } from "@/src/features/dashboard/api";
export default function Dashboard() {
  const q = useQuery({
    queryKey: dashboardKeys.summary,
    queryFn: getDashboard,
  });
  if (q.isLoading) return <LoadingState label="Loading dashboard…" />;
  if (q.error)
    return (
      <Screen>
        <ErrorState message={q.error.message} retry={() => void q.refetch()} />
      </Screen>
    );
  const stats = q.data?.stats ?? {};
  return (
    <Screen>
      <Text className="mb-1 text-2xl font-bold text-ink">Safety overview</Text>
      <Text className="mb-5 text-slate-600">
        Current audit and observation activity
      </Text>
      <View className="flex-row flex-wrap justify-between">
        {Object.entries(stats)
          .slice(0, 6)
          .map(([key, value]) => (
            <Card key={key} className="w-[48%]">
              <Text className="text-3xl font-bold text-brand">
                {typeof value === "number" || typeof value === "string"
                  ? value
                  : "—"}
              </Text>
              <Text className="mt-1 capitalize text-slate-600">
                {key.replaceAll("_", " ")}
              </Text>
            </Card>
          ))}
      </View>
      <Card>
        <Text className="text-lg font-bold text-ink">Critical RPN</Text>
        <Text className="mt-2 text-slate-600">
          {Array.isArray(q.data?.critical) ? q.data.critical.length : 0} audits
          currently have a critical score (32–128).
        </Text>
      </Card>
      <Card>
        <Text className="text-lg font-bold text-ink">
          Open and closed observations
        </Text>
        {Object.entries(q.data?.observations ?? {}).map(([k, v]) => (
          <Text key={k} className="mt-2 capitalize text-slate-700">
            {k.replaceAll("_", " ")}: {String(v)}
          </Text>
        ))}
      </Card>
    </Screen>
  );
}
