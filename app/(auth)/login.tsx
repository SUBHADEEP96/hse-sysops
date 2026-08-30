import { Button, Screen, TextField } from "@/src/components/ui";
import { useAuth } from "@/src/features/auth/session";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from "react-native";
export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    if (!email || !password) return setError("Enter your email and password.");
    setBusy(true);
    setError("");
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen>
        <View className="flex-1 justify-center mt-20 ">
          <Image
            source={require("../../assets/images/icon.png")}
            className="mb-5 h-24 w-24 self-center"
            resizeMode="contain"
            accessibilityLabel="HSE logo"
          />
          <Text className="text-3xl font-bold text-ink text-center">
            Safety Audit Tool
          </Text>
          <Text className="mb-8 mt-2 text-base text-slate-600 text-center">
            Sign in with your HSE account
          </Text>
          <TextField
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
          <TextField
            label="Password"
            secureTextEntry
            autoComplete="current-password"
            value={password}
            onChangeText={setPassword}
          />
          {error ? (
            <Text accessibilityRole="alert" className="mb-4 text-red-700">
              {error}
            </Text>
          ) : null}
          <Button
            title={busy ? "Signing in…" : "Sign in"}
            disabled={busy}
            onPress={submit}
          />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
