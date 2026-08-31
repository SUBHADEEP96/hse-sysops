import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type PressableProps,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auditStatusLabel, normalizeAuditStatus } from "@/src/features/audits/model";

export function Screen({
  children,
  scroll = true,
}: React.PropsWithChildren<{ scroll?: boolean }>) {
  const content = <View className="flex-1 px-5 py-4">{children}</View>;
  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={["bottom"]}>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="grow"
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
export function Card({
  children,
  className = "",
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <View
      className={`mb-3 rounded-2xl border border-slate-200 bg-white p-4 ${className}`}
    >
      {children}
    </View>
  );
}
export function Button({
  title,
  variant = "primary",
  disabled,
  ...props
}: PressableProps & {
  title: string;
  variant?: "primary" | "secondary" | "danger";
}) {
  const color =
    variant === "secondary"
      ? "border border-slate-300 bg-white"
      : variant === "danger"
        ? "bg-red-700"
        : "bg-brand";
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      className={`min-h-12 items-center justify-center rounded-xl px-5 ${color} ${disabled ? "opacity-50" : ""}`}
      {...props}
    >
      <Text
        className={`font-semibold ${variant === "secondary" ? "text-ink" : "text-white"}`}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function TextField({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  rightIconAccessibilityLabel,
  ...props
}: TextInputProps & {
  label: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  rightIconAccessibilityLabel?: string;
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 font-semibold text-ink">{label}</Text>
      <View
        className={`min-h-12 flex-row items-center rounded-xl border bg-white ${error ? "border-red-600" : "border-slate-300"}`}
      >
        {leftIcon ? <View className="ml-4">{leftIcon}</View> : null}
        <TextInput
          accessibilityLabel={label}
          className="min-h-12 flex-1 px-4 text-base text-ink"
          placeholderTextColor="#64748b"
          {...props}
        />
        {rightIcon ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={rightIconAccessibilityLabel}
            className="min-h-11 min-w-11 items-center justify-center"
            disabled={!onRightIconPress}
            onPress={onRightIconPress}
          >
            {rightIcon}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text accessibilityRole="alert" className="mt-1 text-sm text-red-700">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 py-16">
      <ActivityIndicator color="#dc2626" />
      <Text className="text-slate-600">{label}</Text>
    </View>
  );
}
export function EmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <View className="items-center px-6 py-16">
      <Text className="text-center text-xl font-bold text-ink">{title}</Text>
      <Text className="mt-2 text-center text-slate-600">{message}</Text>
    </View>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <View className="items-center gap-4 py-12">
      <Text accessibilityRole="alert" className="text-center text-red-700">
        {message}
      </Text>
      {retry ? <Button title="Try again" onPress={retry} /> : null}
    </View>
  );
}
export function StatusBadge({ status }: { status: number | string }) {
  const label = auditStatusLabel(normalizeAuditStatus(status));
  return (
    <View className="self-start rounded-full bg-slate-100 px-3 py-1">
      <Text className="text-sm font-semibold text-slate-700">{label}</Text>
    </View>
  );
}
