"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// 十二生肖灵宠：key 与 pets 页保持一致，emoji 作为形象兜底
export type PetKind = {
  name: string;
  emoji: string;
};

// 默认灵宠「卯兔·小天」使用官方手绘形象（TSQ_ASSETS.pet），其余生肖用 emoji 呈现
export const DEFAULT_PET_NAME = "卯兔";
export const DEFAULT_PET_NICKNAME = "小天";

type PetState = {
  // 面板 / 气泡
  open: boolean;
  bubble: string;
  toggle: () => void;
  close: () => void;
  setBubble: (b: string) => void;
  // 灵宠设置草稿（设置页编辑中使用）
  selectedPet: string;
  petName: string;
  setSelectedPet: (name: string) => void;
  setPetName: (name: string) => void;
  // 已应用的灵宠：所有产品内展示位统一读取这里，确保保存后全局同步
  appliedPet: string;
  appliedPetName: string;
  applyPet: (name: string, nickname?: string) => void;
};

// 灵宠面板开合、气泡文案与选中灵宠的全局状态（用户选择持久化到本地）
export const usePetStore = create<PetState>()(
  persist(
    (set, get) => ({
      open: false,
      bubble: "我发现 3 个新机会",
      toggle: () => set((s) => ({ open: !s.open })),
      close: () => set({ open: false }),
      setBubble: (bubble) => set({ bubble }),
      selectedPet: DEFAULT_PET_NAME,
      petName: DEFAULT_PET_NICKNAME,
      setSelectedPet: (selectedPet) => set({ selectedPet }),
      setPetName: (petName) => set({ petName }),
      appliedPet: DEFAULT_PET_NAME,
      appliedPetName: DEFAULT_PET_NICKNAME,
      applyPet: (appliedPet, nickname) => {
        const appliedPetName = (nickname ?? get().petName).trim() || DEFAULT_PET_NICKNAME;
        set({ appliedPet, selectedPet: appliedPet, petName: appliedPetName, appliedPetName });
      },
    }),
    {
      name: "tsq-pet",
      // 仅持久化用户的灵宠选择，不持久化面板开合等临时态
      partialize: (state) => ({
        selectedPet: state.selectedPet,
        petName: state.petName,
        appliedPet: state.appliedPet,
        appliedPetName: state.appliedPetName,
      }),
      version: 2,
      migrate: (persisted) => {
        const state = persisted as Partial<PetState> | undefined;
        const nickname = state?.appliedPetName ?? state?.petName ?? DEFAULT_PET_NICKNAME;
        return {
          ...state,
          appliedPetName: nickname,
          petName: state?.petName ?? nickname,
          selectedPet: state?.selectedPet ?? state?.appliedPet ?? DEFAULT_PET_NAME,
          appliedPet: state?.appliedPet ?? state?.selectedPet ?? DEFAULT_PET_NAME,
        };
      },
    },
  ),
);
