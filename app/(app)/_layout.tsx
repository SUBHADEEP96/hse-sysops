import { Redirect, Stack } from "expo-router";
import { LoadingState } from "@/src/components/ui";
import { useAuth } from "@/src/features/auth/session";
export default function AppLayout() {
  const { ready, user } = useAuth();
  if (!ready) return <LoadingState />;
  if (!user) return <Redirect href="/(auth)/login" />;
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerTintColor: "#172033",
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="audits/create" options={{ title: "Create audit" }} />
      <Stack.Screen
        name="audits/[auditId]/index"
        options={{ title: "Audit details" }}
      />
      <Stack.Screen
        name="audits/[auditId]/observation"
        options={{ title: "Observation" }}
      />
    </Stack>
  );
}
