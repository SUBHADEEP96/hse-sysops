import {
    Card,
    EmptyState,
    ErrorState,
    LoadingState,
    Screen,
} from "@/src/components/ui";
import {
    buildChartSeries,
    dashboardKeys,
    getDashboard,
    type DashboardMetric,
} from "@/src/features/dashboard/api";
import { useQuery } from "@tanstack/react-query";
import { Text, View } from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";

const CHART_COLORS = ["#dc2626", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#0f172a"];

function MetricStrip({ metrics }: { metrics: DashboardMetric[] }) {
  return (
    <View className="mb-4 flex-row flex-wrap -mx-1">
      {metrics.map((metric) => (
        <View key={metric.key} className="mb-2 w-1/2 px-1">
          <View className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <Text className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
              {metric.label}
            </Text>
            <Text className="mt-2 text-2xl font-black text-ink">{metric.value}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function DonutChart({
  metrics,
  totalLabel,
  title,
}: {
  metrics: DashboardMetric[];
  totalLabel: string;
  title: string;
}) {
  const chart = buildChartSeries(metrics);
  const total = chart.reduce((sum, item) => sum + item.value, 0);
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <View className="flex-row items-center gap-4">
      <View className="items-center justify-center">
        <Svg width={150} height={150} viewBox="0 0 150 150">
          <Circle
            cx="75"
            cy="75"
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={18}
          />
          {chart.map((segment, index) => {
            const segmentLength = total > 0 ? (segment.value / total) * circumference : 0;
            const dashOffset = -cumulative;
            cumulative += segmentLength;
            return (
              <Circle
                key={segment.key}
                cx="75"
                cy="75"
                r={radius}
                fill="none"
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth={18}
                strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform="rotate(-90 75 75)"
              />
            );
          })}
          <SvgText x="75" y="70" textAnchor="middle" fontSize="24" fontWeight="700" fill="#111827">
            {total}
          </SvgText>
          <SvgText x="75" y="90" textAnchor="middle" fontSize="12" fill="#64748b">
            {totalLabel}
          </SvgText>
        </Svg>
      </View>

      <View className="flex-1 gap-2">
        {chart.map((segment, index) => (
          <View key={segment.key} className="flex-row items-center justify-between gap-3">
            <View className="flex-row items-center gap-2">
              <View
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
              />
              <Text className="text-sm text-slate-600">{segment.label}</Text>
            </View>
            <Text className="text-sm font-bold text-ink">{segment.value}</Text>
          </View>
        ))}
        {!chart.length ? (
          <Text className="text-sm text-slate-500">{title} is unavailable.</Text>
        ) : null}
      </View>
    </View>
  );
}

function AnswerBars({ metrics }: { metrics: DashboardMetric[] }) {
  const chart = buildChartSeries(metrics);
  const total = chart.reduce((sum, item) => sum + item.value, 0);

  return (
    <View className="gap-3">
      {chart.map((segment, index) => {
        const width = total > 0 ? (segment.value / total) * 100 : 0;
        return (
          <View key={segment.key} className="gap-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-base text-slate-700">{segment.label}</Text>
              <Text className="text-base font-bold text-ink">{segment.value}</Text>
            </View>
            <View className="h-2.5 overflow-hidden rounded-full bg-slate-200">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${width}%`,
                  backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

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

  const summary = query.data.sections.find((section) => section.key === "stats");
  const rpnSection = query.data.sections.find(
    (section) => section.key === "rpn_distribution",
  );
  const answerSection = query.data.sections.find(
    (section) => section.key === "answer_types",
  );
  const observations = query.data.observationMetrics;

  return (
    <Screen>
      <View className="pb-6">
        <Text className="mb-1 text-3xl font-black tracking-tight text-ink">
          Dashboard
        </Text>
        <Text className="mb-5 text-base text-slate-600">
          Current audit and observation activity
        </Text>

        {summary ? <MetricStrip metrics={summary.metrics} /> : null}

        {rpnSection ? (
          <Card className="border-slate-200 bg-white">
            <Text className="mb-4 text-2xl font-black text-ink">
              RPN distribution
            </Text>
            <DonutChart
              title="RPN distribution"
              totalLabel="Total"
              metrics={rpnSection.metrics}
            />
          </Card>
        ) : null}

        {answerSection ? (
          <Card className="border-slate-200 bg-white">
            <Text className="mb-4 text-2xl font-black text-ink">
              Answer types
            </Text>
            <AnswerBars metrics={answerSection.metrics} />
          </Card>
        ) : null}

        <Card className="border-slate-200 bg-gradient-to-br from-white to-red-50">
          <Text className="mb-2 text-2xl font-black text-ink">Critical RPN</Text>
          <Text className="text-base text-slate-700">
            {query.data.criticalAuditCount === null
              ? "Critical audit data is unavailable."
              : `${query.data.criticalAuditCount} audits currently have a critical score (32–128).`}
          </Text>
        </Card>

        <Card className="border-slate-200 bg-white">
          <Text className="mb-4 text-2xl font-black text-ink">
            Open and closed observations
          </Text>
          {observations.length ? (
            <DonutChart
              title="Observations"
              totalLabel="Observations"
              metrics={observations}
            />
          ) : (
            <Text className="text-slate-600">Observation data is unavailable.</Text>
          )}
        </Card>
      </View>
    </Screen>
  );
}
