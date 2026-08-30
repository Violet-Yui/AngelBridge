"use client";

import { useEffect, useMemo, useState } from "react";
import { LOCATION_SPECIAL_OPTIONS, WORLD_LOCATIONS, locationValue } from "@/lib/tsq/world-locations";

type Props = {
  value: string;
  onChange: (value: string) => void;
  includeSpecial?: boolean;
  className?: string;
};

function parseValue(value: string) {
  const [province, city] = value.split(" / ");
  return province && city ? { province, city } : null;
}

export function WorldLocationPicker({ value, onChange, includeSpecial = false, className = "" }: Props) {
  const parsed = parseValue(value);
  const defaultProvince = WORLD_LOCATIONS.some((item) => item.province === parsed?.province)
    ? parsed!.province
    : WORLD_LOCATIONS[0].province;
  const [province, setProvince] = useState(defaultProvince);
  const activeProvince = useMemo(
    () => WORLD_LOCATIONS.find((item) => item.province === province) ?? WORLD_LOCATIONS[0],
    [province],
  );
  const [city, setCity] = useState(
    parsed?.province === defaultProvince && activeProvince.cities.includes(parsed.city)
      ? parsed.city
      : activeProvince.cities[0],
  );

  useEffect(() => {
    if (!activeProvince.cities.includes(city)) setCity(activeProvince.cities[0]);
  }, [activeProvince, city]);

  useEffect(() => {
    if (LOCATION_SPECIAL_OPTIONS.includes(value)) return;
    const nextValue = locationValue(activeProvince, city);
    if (nextValue !== value) onChange(nextValue);
  }, [activeProvince, city, onChange, value]);

  return (
    <div className={`space-y-2 ${className}`}>
      {includeSpecial && (
        <div className="grid grid-cols-2 gap-2">
          {LOCATION_SPECIAL_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`rounded-xl px-2.5 py-2 text-[12px] font-semibold active:scale-95 ${value === option ? "bg-[#62A75C] text-white" : "bg-[#eef8e6] text-[#2F7D32]"}`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 gap-2">
        <div>
          <span className="mb-1 block text-[11px] font-bold text-[#6b7b66]">省份 / 自治区 / 直辖市</span>
          <select value={province} onChange={(event) => setProvince(event.target.value)} className="w-full rounded-xl border border-[#dfe8d8] bg-[#fbfcf8] px-3 py-2 text-[13px] text-[#20351d] outline-none focus:border-[color:var(--primary)]">
            {WORLD_LOCATIONS.map((item) => <option key={item.province} value={item.province}>{item.province}</option>)}
          </select>
        </div>
        <div>
          <span className="mb-1 block text-[11px] font-bold text-[#6b7b66]">城市 / 地区 / 自治州</span>
          <select value={city} onChange={(event) => setCity(event.target.value)} className="w-full rounded-xl border border-[#dfe8d8] bg-[#fbfcf8] px-3 py-2 text-[13px] text-[#20351d] outline-none focus:border-[color:var(--primary)]">
            {activeProvince.cities.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
