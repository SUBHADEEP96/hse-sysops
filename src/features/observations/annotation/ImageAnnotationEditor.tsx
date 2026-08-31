import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useRef, useState } from "react";
import { Image, Modal, PanResponder, Pressable, Text, useWindowDimensions, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import ViewShot, { captureRef } from "react-native-view-shot";
import { addStroke, clearStrokes, normalizePoint, strokePath, undoStroke, type Stroke } from "./strokes";

export function ImageAnnotationEditor({ visible, imageUri, onCancel, onSave }: { visible: boolean; imageUri: string; onCancel(): void; onSave(uri: string): void }) {
  const capture = useRef<View>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [active, setActive] = useState<Stroke | null>(null);
  const [size, setSize] = useState({ width: 1, height: 1 });
  const window = useWindowDimensions();
  const canvasHeight = Math.max(280, window.height - 190);
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => setActive({ id: `${Date.now()}`, points: [normalizePoint(event.nativeEvent.locationX, event.nativeEvent.locationY, size.width, size.height)] }),
    onPanResponderMove: (event) => setActive((stroke) => stroke ? { ...stroke, points: [...stroke.points, normalizePoint(event.nativeEvent.locationX, event.nativeEvent.locationY, size.width, size.height)] } : stroke),
    onPanResponderRelease: () => setActive((stroke) => { if (stroke) setStrokes((current) => addStroke(current, stroke)); return null; }),
  }), [size.height, size.width]);
  async function save() {
    const uri = await captureRef(capture, { format: "jpg", quality: 0.95, result: "tmpfile" });
    onSave(uri);
  }
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onCancel}>
      <View className="flex-1 bg-slate-950 pt-12">
        <View className="h-14 flex-row items-center justify-between px-4">
          <Pressable accessibilityRole="button" accessibilityLabel="Cancel marking" className="min-h-11 justify-center px-2" onPress={onCancel}><Text className="font-semibold text-white">Cancel</Text></Pressable>
          <Text className="text-lg font-bold text-white">Mark Image</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Save marking" className="min-h-11 justify-center px-2" onPress={() => void save()}><Text className="font-semibold text-red-400">Save</Text></Pressable>
        </View>
        <ViewShot ref={capture} style={{ height: canvasHeight, width: window.width, backgroundColor: "black" }}>
          <Image source={{ uri: imageUri }} resizeMode="contain" style={{ height: canvasHeight, width: window.width }} />
          <View {...pan.panHandlers} onLayout={(event) => setSize(event.nativeEvent.layout)} style={{ position: "absolute", inset: 0 }}>
            <Svg width="100%" height="100%">
              {[...strokes, ...(active ? [active] : [])].map((stroke) => <Path key={stroke.id} d={strokePath(stroke, size.width, size.height)} stroke="#ef2626" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" />)}
            </Svg>
          </View>
        </ViewShot>
        <View className="flex-1 flex-row items-start justify-center gap-8 pt-5">
          <Pressable accessibilityRole="button" accessibilityLabel="Undo marking" disabled={!strokes.length} className="min-h-14 min-w-20 items-center justify-center" onPress={() => setStrokes(undoStroke)}><Ionicons name="arrow-undo" size={26} color={strokes.length ? "white" : "#64748b"} /><Text className="mt-1 text-white">Undo</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Clear markings" disabled={!strokes.length} className="min-h-14 min-w-20 items-center justify-center" onPress={() => setStrokes(clearStrokes())}><Ionicons name="trash-outline" size={26} color={strokes.length ? "white" : "#64748b"} /><Text className="mt-1 text-white">Clear</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}
