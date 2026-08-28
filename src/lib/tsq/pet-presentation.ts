import type { CSSProperties } from "react";

type PetPresentationInput = {
  isDocked: boolean;
  dragging: boolean;
};

type PetPresentation = {
  containerClassName: string;
  containerStyle: CSSProperties;
  imageStyle: CSSProperties;
};

export function getDockedPetPresentation({ dragging }: PetPresentationInput): PetPresentation {
  return {
    containerClassName: `fixed z-[46] w-[72px] bg-transparent transition-opacity duration-200 ${
      dragging ? "select-none opacity-95" : "opacity-100"
    }`,
    containerStyle: {},
    imageStyle: {},
  };
}
