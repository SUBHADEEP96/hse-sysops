import { Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
} from "@/src/components/ui";
import { dashboardKeys, getDashboard } from "@/src/features/dashboard/api";

export default function Dashboard() {
  const query = useQuery({
    queryKey: dashboardKeys.summary,
    queryFn: getDashboard,
  });
  if (query.isLoading) return <LoadingState label="Loading dashboard…" />;
  if (query.error)
    return (
      <Screen>
        <ErrorState
          message={query.error.message}
          retry={() => void query.refetch()}
        />
      </Screen>
    );
  if (!query.data || query.data.empty)
    return (
      <Screen>
        <EmptyState
          title="Dashboard unavailable"
          message="No dashboard summary is available yet."
        />
      </Screen>
    );

  return (
    <Screen>
      <Text className="mb-1 text-2xl font-bold text-ink">Safety overview</Text>
      <Text className="mb-5 text-slate-600">
        Current audit and observation activity
      </Text>
      {query.data.sections.map((section) => (
        <Card key={section.key}>
          <Text className="mb-2 text-lg font-bold text-ink">
            {section.title}
          </Text>
          {section.metrics.map((metric) => (
            <View
              key={metric.key}
              className="min-h-11 flex-row items-center justify-between border-t border-slate-100"
            >
              <Text className="mr-3 flex-1 text-slate-600">{metric.label}</Text>
              <Text className="font-bold text-ink">{metric.value}</Text>
            </View>
          ))}
        </Card>
      ))}
      <Card>
        <Text className="text-lg font-bold text-ink">Critical RPN</Text>
        <Text className="mt-2 text-slate-600">
          {query.data.criticalAuditCount === null
            ? "Critical audit data is unavailable."
            : `${query.data.criticalAuditCount} audits currently have a critical score (32–128).`}
        </Text>
      </Card>
      <Card>
        <Text className="mb-2 text-lg font-bold text-ink">
          Open and closed observations
        </Text>
        {query.data.observationMetrics.length ? (
          query.data.observationMetrics.map((metric) => (
            <View
              key={metric.key}
              className="min-h-11 flex-row items-center justify-between border-t border-slate-100"
            >
              <Text className="text-slate-600">{metric.label}</Text>
              <Text className="font-bold text-ink">{metric.value}</Text>
            </View>
          ))
        ) : (
          <Text className="mt-2 text-slate-600">
            Observation data is unavailable.
          </Text>
        )}
      </Card>
    </Screen>
  );
}
