import { queryClient } from "@/src/api/query-client";
import { Button, ErrorState, Screen, TextField } from "@/src/components/ui";
import {
  auditKeys,
  createAudit,
  getCountries,
  getLocationsByCountry,
} from "@/src/features/audits/api";
import { LookupSelector } from "@/src/features/audits/LookupSelector";
import { useAuth } from "@/src/features/auth/session";
import { useMutation, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Alert, Pressable, Text, View } from "react-native";

export default function CreateAudit() {
  const { user } = useAuth();
  const fields = useForm<{ name: string; workArea: string }>({
    defaultValues: { name: "", workArea: "" },
  });
  const name = fields.watch("name");
  const workArea = fields.watch("workArea");
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(
    null,
  );
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null,
  );
  const [observedDate, setObservedDate] = useState(new Date());
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [picker, setPicker] = useState<"date" | "start" | "end" | null>(null);
  const countries = useQuery({
    queryKey: auditKeys.countries,
    queryFn: getCountries,
  });
  const locations = useQuery({
    queryKey: [...auditKeys.locations, selectedCountryId],
    queryFn: () =>
      selectedCountryId === null
        ? Promise.resolve([])
        : getLocationsByCountry(selectedCountryId),
    enabled: selectedCountryId !== null,
    staleTime: 5 * 60 * 1000,
  });
  const mutation = useMutation({
    mutationFn: createAudit,
    onSuccess: async (audit) => {
      await queryClient.invalidateQueries({ queryKey: auditKeys.all });
      router.replace({
        pathname: "/(app)/audits/[auditId]",
        params: { auditId: String(audit.id) },
      });
    },
  });

  if (countries.error)
    return (
      <Screen>
        <ErrorState
          message={countries.error.message}
          retry={() => void countries.refetch()}
        />
      </Screen>
    );

  const valid =
    Boolean(name.trim()) &&
    selectedCountryId !== null &&
    selectedLocationId !== null;
  return (
    <Screen>
      <View className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <Text className="text-sm font-semibold text-slate-600">Auditor</Text>
        <Text className="mt-1 text-base font-semibold text-ink">
          {user?.employee_name ?? user?.name ?? user?.email ?? "Authenticated auditor"}
        </Text>
      </View>
      <TextField
        label="Audit name *"
        value={name}
        onChangeText={(value) => fields.setValue("name", value)}
      />
      <LookupSelector
        label="Country *"
        options={countries.data ?? []}
        selectedId={selectedCountryId}
        loading={countries.isLoading}
        disabled={countries.isLoading}
        placeholder="Select a country"
        onSelect={(id) => {
          if (id === selectedCountryId) return;
          setSelectedLocationId(null);
          setSelectedCountryId(id);
        }}
      />
      <LookupSelector
        label="Location *"
        options={locations.data ?? []}
        selectedId={selectedLocationId}
        loading={locations.isLoading}
        disabled={
          selectedCountryId === null || locations.isLoading || !!locations.error
        }
        placeholder={
          selectedCountryId === null
            ? "Select a country first"
            : "Select a location"
        }
        onSelect={setSelectedLocationId}
      />
      {locations.error ? (
        <ErrorState
          message={locations.error.message}
          retry={() => void locations.refetch()}
        />
      ) : null}
      <TextField
        label="Work area"
        value={workArea}
        onChangeText={(value) => fields.setValue("workArea", value)}
        placeholder="Enter work area (optional)"
      />
      <Text className="mb-2 font-semibold text-ink">Observed date *</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Choose observed date" className="mb-4 min-h-12 justify-center rounded-xl border border-slate-300 bg-white px-4" onPress={() => setPicker("date")}>
        <Text>{observedDate.toLocaleDateString()}</Text>
      </Pressable>
      <View className="mb-4 flex-row gap-3">
        <Pressable accessibilityRole="button" accessibilityLabel="Choose start time" className="min-h-12 flex-1 justify-center rounded-xl border border-slate-300 bg-white px-4" onPress={() => setPicker("start")}><Text>{startTime ? startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Start time"}</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Choose end time" className="min-h-12 flex-1 justify-center rounded-xl border border-slate-300 bg-white px-4" onPress={() => setPicker("end")}><Text>{endTime ? endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "End time"}</Text></Pressable>
      </View>
      {picker ? <DateTimePicker value={picker === "date" ? observedDate : picker === "start" ? (startTime ?? new Date()) : (endTime ?? new Date())} mode={picker === "date" ? "date" : "time"} onChange={(_, value) => { if (value) { if (picker === "date") setObservedDate(value); else if (picker === "start") setStartTime(value); else setEndTime(value); } setPicker(null); }} /> : null}
      {mutation.error ? (
        <Text accessibilityRole="alert" className="mb-3 text-red-700">
          {mutation.error.message}
        </Text>
      ) : null}
      <Button
        title={mutation.isPending ? "Creating…" : "Create audit"}
        disabled={!valid || mutation.isPending}
        onPress={() => {
          if (!user || !selectedCountryId || !selectedLocationId) return;
          const payload = {
            auditor_id: user.id,
            audit_name: name.trim(),
            country: selectedCountryId,
            location: selectedLocationId,
            observed_at: observedDate.toISOString().slice(0, 10),
            ...(startTime ? { start_time: startTime.toTimeString().slice(0, 5) } : {}),
            ...(endTime ? { end_time: endTime.toTimeString().slice(0, 5) } : {}),
            ...(workArea.trim() ? { work_area: workArea.trim() } : {}),
          };
          mutation.mutate(payload);
        }}
      />
      <View className="h-3" />
      <Button title="Reset" variant="secondary" onPress={() => Alert.alert("Reset audit?", "This clears the audit details you entered.", [{ text: "Cancel", style: "cancel" }, { text: "Reset", style: "destructive", onPress: () => { fields.reset(); setSelectedCountryId(null); setSelectedLocationId(null); setObservedDate(new Date()); setStartTime(null); setEndTime(null); } }])} />
    </Screen>
  );
}
