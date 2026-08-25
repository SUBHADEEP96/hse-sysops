import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  getUnreadCount,
  notificationKeys,
} from "@/src/features/notifications/api";
export default function TabLayout() {
  const { data } = useQuery({
    queryKey: notificationKeys.unread,
    queryFn: getUnreadCount,
  });
  const badge = data?.unread_count ?? data?.count;
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#dc2626",
        headerTitleStyle: { fontWeight: "700" },
        tabBarStyle: { minHeight: 62, paddingBottom: 8 },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="audits"
        options={{
          title: "Audits",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarBadge: badge || undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
