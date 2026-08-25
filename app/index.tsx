import { Redirect } from "expo-router";
import { LoadingState } from "@/src/components/ui";
import { useAuth } from "@/src/features/auth/session";
export default function Index() { const { ready, user } = useAuth(); if (!ready) return <LoadingState label="Restoring secure session…"/>; return <Redirect href={user ? "/(app)/(tabs)/dashboard" : "/(auth)/login"}/>; }
