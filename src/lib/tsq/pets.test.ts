import { expect, test } from "bun:test";
import { ZODIAC_PETS } from "./pets";

test("zodiac pet collection keeps all twelve original companion choices", () => {
  expect(ZODIAC_PETS).toHaveLength(12);
  expect(ZODIAC_PETS.map((pet) => pet.id)).toEqual([
    "01-rat", "02-ox", "03-tiger", "04-rabbit", "05-dragon", "06-snake",
    "07-horse", "08-goat", "09-monkey", "10-rooster", "11-dog", "12-pig",
  ]);
  expect(ZODIAC_PETS[3]).toMatchObject({
    name: "卯兔",
    image: "/tsq/zodiac/04-rabbit.svg",
  });
});

test("every zodiac companion has a distinct local image and a trait", () => {
  expect(new Set(ZODIAC_PETS.map((pet) => pet.image)).size).toBe(12);
  expect(ZODIAC_PETS.every((pet) => pet.trait.length > 0)).toBe(true);
});
