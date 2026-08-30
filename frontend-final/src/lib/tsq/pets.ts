// 天使桥 · 十二生肖灵宠形象数据（pets 选择页与聊天页共用）
import { DEFAULT_PET_NAME } from "@/stores/pet-store";
import { TSQ_ASSETS } from "@/lib/tsq/assets";

export type ZodiacPet = {
  name: string;
  emoji: string;
  trait?: string;
  line: string;
  image?: string; // 灵宠形象图片（放在 public/pets/ 下）；缺省时回退 emoji
};

export const ZODIAC_PETS: ZodiacPet[] = [
  { name: "子鼠", emoji: "🐭", line: "帮你捕捉隐藏机会", image: "/pets/z/rat.png" },
  { name: "丑牛", emoji: "🐮", line: "陪你长期积累资源", image: "/pets/z/ox.png" },
  { name: "寅虎", emoji: "🐯", line: "提醒你主动发起连接", image: "/pets/z/tiger.png" },
  { name: "卯兔", emoji: "🐰", line: "在低落时给你安慰", image: "/pets/z/rabbit.png" },
  { name: "辰龙", emoji: "🐲", line: "帮你看见更大的桥", image: "/pets/z/dragon.png" },
  { name: "巳蛇", emoji: "🐍", line: "识别偏好与习惯变化", image: "/pets/z/snake.png" },
  { name: "午马", emoji: "🐴", line: "快速推荐可执行机会", image: "/pets/z/horse.png" },
  { name: "未羊", emoji: "🐑", line: "让交换更温暖顺畅", image: "/pets/z/goat.png" },
  { name: "申猴", emoji: "🐵", line: "发掘有趣的新玩法", image: "/pets/z/monkey.png" },
  { name: "酉鸡", emoji: "🐔", line: "守住约定和排期", image: "/pets/z/rooster.png" },
  { name: "戌狗", emoji: "🐶", line: "不论如何都守护你", image: "/pets/z/dog.png" },
  { name: "亥猪", emoji: "🐷", line: "帮你恢复能量与好运", image: "/pets/z/pig.png" },
  { name: "熊猫", emoji: "🐼", line: "温柔陪你慢下来", image: "/pets/panda.png" },
  { name: "狐狸", emoji: "🦊", line: "带你发现有趣的点子", image: "/pets/fox.png" },
  { name: "猫", emoji: "🐱", line: "好奇又懂你的小伙伴", image: "/pets/cat.png" },
  { name: "熊", emoji: "🐻", line: "给你温暖的抱抱", image: "/pets/bear.png" },
];

export type PetVisual =
  | { type: "image"; src: string }
  | { type: "emoji"; emoji: string };

// 根据选中的灵宠返回其形象：默认灵宠使用官方手绘图，其余生肖用对应 emoji
// variant="perch" 时，默认灵宠返回「双爪扒边缘、探身打招呼」的趴姿图
export function getPetVisual(
  selectedPet: string,
  variant: "avatar" | "perch" = "avatar",
): PetVisual {
  if (selectedPet === DEFAULT_PET_NAME) {
    return {
      type: "image",
      src: variant === "perch" ? TSQ_ASSETS.petPerch : TSQ_ASSETS.pet,
    };
  }
  const found = ZODIAC_PETS.find((pet) => pet.name === selectedPet);
  if (found?.image) {
    return { type: "image", src: found.image };
  }
  return { type: "emoji", emoji: found?.emoji ?? "🌱" };
}
