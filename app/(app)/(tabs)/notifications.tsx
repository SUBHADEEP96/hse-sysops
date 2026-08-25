import { useMutation, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, Text } from "react-native";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
} from "@/src/components/ui";
import { queryClient } from "@/src/api/query-client";
import {
  getNotifications,
  markAllRead,
  markRead,
  notificationKeys,
} from "@/src/features/notifications/api";
export default function Notifications() {
  const q = useQuery({
    queryKey: notificationKeys.all,
    queryFn: getNotifications,
  });
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread }),
    ]);
  const one = useMutation({ mutationFn: markRead, onSuccess: invalidate });
  const all = useMutation({ mutationFn: markAllRead, onSuccess: invalidate });
  if (q.isLoading) return <LoadingState />;
  if (q.error)
    return (
      <Screen>
        <ErrorState message={q.error.message} retry={() => void q.refetch()} />
      </Screen>
    );
  return (
    <Screen>
      <Button
        title="Mark all as read"
        variant="secondary"
        disabled={!q.data?.length || all.isPending}
        onPress={() => all.mutate()}
      />
      {!q.data?.length ? (
        <EmptyState
          title="No notifications"
          message="Audit updates will appear here."
        />
      ) : (
        q.data.map((n) => (
          <Pressable
            key={String(n.id)}
            onPress={() => {
              if (!n.is_read) one.mutate(n.id);
              if (n.audit_id)
                router.push({
                  pathname: "/(app)/audits/[auditId]",
                  params: { auditId: String(n.audit_id) },
                });
            }}
          >
            <Card className={n.is_read ? "opacity-70" : "border-red-200"}>
              <Text className="font-bold text-ink">
                {n.title ?? "Audit notification"}
              </Text>
              <Text className="mt-1 text-slate-600">
                {n.message ?? "Open for details"}
              </Text>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}
