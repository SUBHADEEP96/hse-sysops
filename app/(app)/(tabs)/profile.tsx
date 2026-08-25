import { Text } from "react-native";
import { Button, Card, Screen } from "@/src/components/ui";
import { useAuth } from "@/src/features/auth/session";
export default function Profile() {
  const { user, signOut } = useAuth();
  const roles = user?.roles
    ?.map((r) => (typeof r === "string" ? r : r.name))
    .join(", ");
  return (
    <Screen>
      <Card>
        <Text className="text-2xl font-bold text-ink">
          {user?.employee_name ?? user?.name ?? "HSE user"}
        </Text>
        <Text className="mt-3 text-slate-600">
          {user?.email ?? "Email unavailable"}
        </Text>
        <Text className="mt-2 text-slate-600">
          {roles || "Role unavailable"}
        </Text>
      </Card>
      <Button title="Log out" variant="danger" onPress={() => void signOut()} />
    </Screen>
  );
}
