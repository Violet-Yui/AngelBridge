"use client";

import { create } from "zustand";
import { DEFAULT_ZODIAC_PET_ID } from "@/lib/tsq/pets";

type PetState = {
  open: boolean;
  bubble: string;
  selectedPetId: string;
  toggle: () => void;
  close: () => void;
  setBubble: (b: string) => void;
  setSelectedPetId: (id: string) => void;
};

// 灵宠面板开合与气泡文案的全局状态
export const usePetStore = create<PetState>((set) => ({
  open: false,
  bubble: "",
  selectedPetId: DEFAULT_ZODIAC_PET_ID,
  toggle: () => set((s) => ({ open: !s.open })),
  close: () => set({ open: false }),
  setBubble: (bubble) => set({ bubble }),
  setSelectedPetId: (selectedPetId) => set({ selectedPetId }),
}));
