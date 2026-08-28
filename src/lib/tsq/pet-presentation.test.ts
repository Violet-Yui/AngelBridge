import { expect, test } from "bun:test";
import { getDockedPetPresentation } from "./pet-presentation";

test("docked pet keeps the SVG visible without a hard crop or rotated transform", () => {
  const presentation = getDockedPetPresentation({
    isDocked: true,
    dragging: false,
  });

  expect(presentation.containerStyle.clipPath).toBeUndefined();
  expect(presentation.containerStyle.maskImage).toBeUndefined();
  expect(presentation.imageStyle.transform).toBeUndefined();
  expect(presentation.containerClassName).toContain("opacity");
});

test("free-floating pet does not add a colored base layer", () => {
  const presentation = getDockedPetPresentation({
    isDocked: false,
    dragging: false,
  });

  expect(presentation.containerClassName).toContain("bg-transparent");
});
