import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Option = { id: string; name: string };

export function LookupSelector({
  label,
  options,
  selectedId,
  onSelect,
  disabled = false,
  loading = false,
  placeholder,
}: {
  label: string;
  options: Option[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = options.find((option) => option.id === selectedId);
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return query
      ? options.filter((option) =>
          option.name.toLocaleLowerCase().includes(query),
        )
      : options;
  }, [options, search]);

  const close = () => {
    setOpen(false);
    setSearch("");
  };

  return (
    <View className="mb-4">
      <Text className="mb-2 font-semibold text-ink">{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        className={`min-h-12 justify-center rounded-xl border bg-white px-4 ${disabled ? "border-slate-200 opacity-50" : "border-slate-300"}`}
      >
        <Text className={selected ? "text-ink" : "text-slate-500"}>
          {loading ? "Loading…" : (selected?.name ?? placeholder)}
        </Text>
      </Pressable>
      <Modal visible={open} animationType="slide" onRequestClose={close}>
        <SafeAreaView className="flex-1 bg-canvas">
          <View className="flex-row items-center justify-between px-5 py-3">
            <Text className="text-xl font-bold text-ink">{label}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={close}
              className="min-h-11 min-w-11 items-center justify-center"
            >
              <Text className="font-semibold text-brand">Cancel</Text>
            </Pressable>
          </View>
          <TextInput
            accessibilityLabel={`Search ${label}`}
            value={search}
            onChangeText={setSearch}
            placeholder="Search"
            placeholderTextColor="#64748b"
            className="mx-5 mb-3 min-h-12 rounded-xl border border-slate-300 bg-white px-4 text-ink"
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text className="px-5 py-8 text-center text-slate-600">
                No options available.
              </Text>
            }
            renderItem={({ item }) => {
              const isSelected = item.id === selectedId;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => {
                    onSelect(item.id);
                    close();
                  }}
                  className={`min-h-12 justify-center border-b border-slate-200 px-5 ${isSelected ? "bg-red-50" : "bg-white"}`}
                >
                  <Text className="text-base text-ink">{item.name}</Text>
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}
