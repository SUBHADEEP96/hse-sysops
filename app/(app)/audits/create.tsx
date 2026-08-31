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
import { Text } from "react-native";

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
          console.log("[debug] country selected", {
            countryId: id,
            selectedCountryId,
          });
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
        onChangeText={(value) => {
          console.log("[debug] work_area field changed", {
            work_area: value,
            isEmpty: !value.trim(),
          });
          fields.setValue("workArea", value);
        }}
        placeholder="Enter work area (optional)"
      />
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
            ...(workArea.trim() ? { work_area: workArea.trim() } : {}),
          };
          console.log("[debug] Creating audit with payload:", {
            payload,
            work_area: workArea.trim() || "(empty - not sent)",
          });
          mutation.mutate(payload);
        }}
      />
    </Screen>
  );
}
