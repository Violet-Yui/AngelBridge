export type ZodiacPet = {
  id: string;
  name: string;
  trait: string;
  image: string;
};

export const ZODIAC_PETS: ZodiacPet[] = [
  { id: "01-rat", name: "子鼠", trait: "机敏陪伴", image: "/tsq/zodiac/01-rat.svg" },
  { id: "02-ox", name: "丑牛", trait: "稳稳托举", image: "/tsq/zodiac/02-ox.svg" },
  { id: "03-tiger", name: "寅虎", trait: "勇敢开路", image: "/tsq/zodiac/03-tiger.svg" },
  { id: "04-rabbit", name: "卯兔", trait: "温柔倾听", image: "/tsq/zodiac/04-rabbit.svg" },
  { id: "05-dragon", name: "辰龙", trait: "连接机会", image: "/tsq/zodiac/05-dragon.svg" },
  { id: "06-snake", name: "巳蛇", trait: "洞察需求", image: "/tsq/zodiac/06-snake.svg" },
  { id: "07-horse", name: "午马", trait: "行动加速", image: "/tsq/zodiac/07-horse.svg" },
  { id: "08-goat", name: "未羊", trait: "暖心守护", image: "/tsq/zodiac/08-goat.svg" },
  { id: "09-monkey", name: "申猴", trait: "灵感搭档", image: "/tsq/zodiac/09-monkey.svg" },
  { id: "10-rooster", name: "酉鸡", trait: "准时提醒", image: "/tsq/zodiac/10-rooster.svg" },
  { id: "11-dog", name: "戌狗", trait: "可靠伙伴", image: "/tsq/zodiac/11-dog.svg" },
  { id: "12-pig", name: "亥猪", trait: "松弛陪伴", image: "/tsq/zodiac/12-pig.svg" },
];

export const DEFAULT_ZODIAC_PET_ID = "04-rabbit";

export function getZodiacPet(id: string): ZodiacPet {
  return ZODIAC_PETS.find((pet) => pet.id === id) ?? ZODIAC_PETS[3];
}
