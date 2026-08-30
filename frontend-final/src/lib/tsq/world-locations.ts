import provinceCitySource from "@/lib/tsq/china-province-cities.json";

export type WorldLocation = {
  province: string;
  cities: string[];
};

type ProvinceCitySource = {
  name: string;
  children?: { name: string }[];
};

const SPECIAL_REGIONS: WorldLocation[] = [
  { province: "香港特别行政区", cities: ["香港特别行政区"] },
  { province: "澳门特别行政区", cities: ["澳门特别行政区"] },
  {
    province: "台湾省",
    cities: [
      "台北市", "新北市", "桃园市", "台中市", "台南市", "高雄市",
      "基隆市", "新竹市", "嘉义市", "新竹县", "苗栗县", "彰化县",
      "南投县", "云林县", "嘉义县", "屏东县", "宜兰县", "花莲县",
      "台东县", "澎湖县", "金门县", "连江县",
    ],
  },
];

export const WORLD_LOCATIONS: WorldLocation[] = [
  ...(provinceCitySource as ProvinceCitySource[]).map((item) => ({
    province: item.name,
    cities: item.children?.map((city) => city.name) ?? [item.name],
  })),
  ...SPECIAL_REGIONS,
];

export const LOCATION_SPECIAL_OPTIONS = ["线上可完成", "暂不确定 / 可协商"];

export function locationValue(item: WorldLocation, city: string) {
  return `${item.province} / ${city}`;
}
