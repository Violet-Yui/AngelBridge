"use client";

import { useRef, useState } from "react";
import { useProfileStore } from "@/stores/profile-store";
import { WorldLocationPicker } from "@/components/tsq/world-location-picker";
import { WORLD_LOCATIONS, locationValue } from "@/lib/tsq/world-locations";

/**
 * 新人引导（登录成功后 → 进首页前）。两步：
 *  1. 基本资料：头像 / 昵称 / 性别 / 生日日期 / 城市
 *  2. 个人表达：一句话介绍（可选）+ 兴趣标签（可选，3-5 个）
 */

const GENDERS = ["女", "男", "其他"];
const YEARS = Array.from({ length: 55 }, (_, i) => `${2010 - i} 年`);
const MONTHS = Array.from({ length: 12 }, (_, i) => `${i + 1} 月`);
const DAYS = Array.from({ length: 31 }, (_, i) => `${i + 1} 日`);

export const INTEREST_TAGS = [
  "公益", "社会时政", "职场", "教育校园", "科技",
  "财经", "法律", "医疗健康", "科普", "三农",
  "生活家居", "亲子", "传统文化", "摄影摄像", "生活记录",
];
const STEPS = ["基本资料", "兴趣"];
const MAX_INTERESTS = 5;

export type OnboardingProfile = {
  avatarFile: File | null;
  nickname: string;
  gender: string;
  birthday: string;
  city: string;
  bio: string;
  interests: string[];
};

export default function OnboardingWizard({ onDone, initialNickname = "" }: { onDone: (profile: OnboardingProfile) => void | Promise<void>; initialNickname?: string }) {
  const [step, setStep] = useState(0);
  const setPersona = useProfileStore((s) => s.setPersona);

  const [avatar, setAvatar] = useState<string>("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [nickname, setNickname] = useState(initialNickname);
  const [gender, setGender] = useState("");
  const [birthYear, setBirthYear] = useState("1995 年");
  const [birthMonth, setBirthMonth] = useState("6 月");
  const [birthDay, setBirthDay] = useState("6 日");
  const [city, setCity] = useState(locationValue(WORLD_LOCATIONS[0], WORLD_LOCATIONS[0].cities[0]));
  const avatarRef = useRef<HTMLInputElement>(null);

  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);

  const progress = ((step + 1) / STEPS.length) * 100;
  const birthday = `${birthYear.replace(" 年", "")}-${birthMonth.replace(" 月", "").padStart(2, "0")}-${birthDay.replace(" 日", "").padStart(2, "0")}`;

  function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f && f.type.startsWith("image/")) {
      setAvatarFile(f);
      setAvatar(URL.createObjectURL(f));
    }
    e.target.value = "";
  }

  function toggleInterest(t: string) {
    setInterests((cur) => {
      if (cur.includes(t)) return cur.filter((x) => x !== t);
      if (cur.length >= MAX_INTERESTS) return cur;
      return [...cur, t];
    });
  }

  const step1Ok = nickname.trim().length > 0 && !!gender && !!birthYear && !!birthMonth && !!birthDay && city.trim().length > 0;
  const canNext = step === 0 ? step1Ok : true;

  function next() {
    if (!canNext) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function complete() {
    setPersona({
      avatar: avatar || "🙂",
      nickname: nickname.trim(),
      gender,
      ageRange: birthday,
      city: city.trim(),
      bio: bio.trim(),
      interests,
    });
    void onDone({
      avatarFile,
      nickname: nickname.trim(),
      gender,
      birthday,
      city: city.trim(),
      bio: bio.trim(),
      interests,
    });
  }

  return (
    <div className="ow-shell">
      <style>{CSS}</style>
      <header className="ow-head">
        {step > 0 && <button className="ow-back" onClick={back} aria-label="返回上一步">‹</button>}
        <div className="ow-progress-wrap">
          <div className="ow-progress"><i style={{ width: `${progress}%` }} /></div>
          <div className="ow-steps">
            {STEPS.map((label, i) => <span key={label} className={i <= step ? "on" : ""}>{label}</span>)}
          </div>
        </div>
      </header>

      <main className="ow-body">
        {step === 0 && (
          <section className="ow-card">
            <h1>完善你的资料</h1>
            <p className="ow-sub">请统一设置头像、昵称、性别、生日和城市</p>

            <div className="ow-avatar-row">
              <button className="ow-avatar" onClick={() => avatarRef.current?.click()} aria-label="上传头像图片">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="头像" />
                ) : (
                  <span className="ow-avatar-ph" aria-hidden="true">
                    <svg viewBox="0 0 64 64" fill="none">
                      <circle cx="32" cy="24" r="11" fill="currentColor" opacity=".88" />
                      <path d="M14 54c2.4-13.5 12.6-21 18-21s15.6 7.5 18 21" fill="currentColor" opacity=".88" />
                    </svg>
                  </span>
                )}
              </button>
              <div className="ow-avatar-hint">
                <div className="ow-avatar-title">上传头像图片</div>
                <div className="ow-avatar-sub">点一下选择图片</div>
              </div>
              <input ref={avatarRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onPickAvatar} />
            </div>

            <label className="ow-label">昵称选择</label>
            <input className="ow-input" placeholder="取一个昵称" maxLength={16} value={nickname} onChange={(e) => setNickname(e.target.value)} />

            <label className="ow-label">性别</label>
            <div className="ow-chips">
              {GENDERS.map((g) => <button key={g} className={`ow-chip ${gender === g ? "sel" : ""}`} onClick={() => setGender(g)}>{g}</button>)}
            </div>

            <label className="ow-label">生日日期</label>
            <div className="ow-birthday">
              <WheelSelect label="年" values={YEARS} value={birthYear} onChange={setBirthYear} />
              <WheelSelect label="月" values={MONTHS} value={birthMonth} onChange={setBirthMonth} />
              <WheelSelect label="日" values={DAYS} value={birthDay} onChange={setBirthDay} />
            </div>
            <div className="ow-birthday-value">已选择：{birthday}</div>

            <label className="ow-label">所在城市</label>
            <WorldLocationPicker value={city} onChange={setCity} className="ow-location-picker" />
          </section>
        )}

        {step === 1 && (
          <section className="ow-card">
            <h1>补充你的身份与爱好</h1>
            <p className="ow-sub">用一句话说明你是谁，再选择几个兴趣爱好，让同类更快认识你</p>
            <label className="ow-label">一句话介绍<span className="ow-opt">（可选）</span></label>
            <textarea className="ow-textarea" rows={2} maxLength={40} placeholder="例如：爱拍照的插画师，想找同城搭子一起玩" value={bio} onChange={(e) => setBio(e.target.value)} />
            <label className="ow-label">选择兴趣<span className="ow-opt">（可选，最多 {MAX_INTERESTS} 个）</span></label>
            <div className="ow-tags">
              {INTEREST_TAGS.map((t) => {
                const sel = interests.includes(t);
                const full = !sel && interests.length >= MAX_INTERESTS;
                return <button key={t} className={`ow-tag ${sel ? "sel" : ""} ${full ? "dim" : ""}`} onClick={() => toggleInterest(t)}>{t}</button>;
              })}
            </div>
            <p className="ow-count">已选 {interests.length} / {MAX_INTERESTS}</p>
          </section>
        )}
      </main>

      <footer className="ow-foot">
        {step < STEPS.length - 1 ? (
          <button className={`ow-cta ${canNext ? "" : "off"}`} onClick={next} disabled={!canNext}>{canNext ? "下一步" : "请先完善基本资料"}</button>
        ) : (
          <button className="ow-cta" onClick={complete}>{interests.length || bio.trim() ? "完成，进入天使桥" : "跳过，进入天使桥"}</button>
        )}
      </footer>
    </div>
  );
}

function WheelSelect({ label, values, value, onChange }: { label: string; values: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="ow-wheel-box">
      <select aria-label={label} className="ow-wheel-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {values.map((v) => <option key={v} value={v}>{v}</option>)}
      </select>
    </div>
  );
}

const CSS = `
.ow-shell{--orange:#F4A987;--ink:#3F463C;--green:#A8C98F;--green-deep:#788575;--bg:#FAF8F1;position:absolute;inset:0;display:flex;flex-direction:column;background:radial-gradient(120% 60% at 80% 0%,rgba(243,213,138,.28),transparent 60%),radial-gradient(120% 60% at 10% 4%,rgba(168,201,143,.30),transparent 60%),var(--bg);font-family:'PingFang SC','PingFang TC',-apple-system,BlinkMacSystemFont,'Noto Sans SC',system-ui,sans-serif;color:var(--ink);padding-top:max(56px,env(safe-area-inset-top,0px));padding-bottom:max(34px,env(safe-area-inset-bottom,0px));overflow:hidden}
.ow-shell *{box-sizing:border-box}.ow-shell button{border:0;cursor:pointer;color:inherit;background:transparent;font:inherit}.ow-head{padding:8px 22px 4px;display:flex;align-items:center;gap:10px}.ow-back{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.6);font-size:22px;line-height:1;flex:0 0 auto}.ow-progress-wrap{flex:1;min-width:0}.ow-progress{height:6px;border-radius:999px;background:rgba(26,26,26,.08);overflow:hidden}.ow-progress i{display:block;height:100%;background:linear-gradient(90deg,var(--orange),#F3D58A);border-radius:999px;transition:width .4s cubic-bezier(.2,.8,.2,1)}.ow-steps{display:flex;justify-content:space-between;margin-top:6px;font-size:11px;color:#788575}.ow-steps .on{color:var(--orange);font-weight:700}.ow-body{flex:1;overflow-y:auto;padding:14px 22px 6px}.ow-card{background:rgba(255,255,255,.72);border:1px solid rgba(26,26,26,.08);border-radius:24px;box-shadow:0 22px 60px rgba(95,45,30,.12);backdrop-filter:blur(14px);padding:24px 20px}.ow-shell h1{font-size:22px;font-weight:700;letter-spacing:-.02em;margin:0 0 8px}.ow-sub{font-size:14px;line-height:1.55;color:#788575;margin:0 0 18px}.ow-avatar-row{display:flex;align-items:center;gap:14px;margin-bottom:6px}.ow-avatar{width:76px;height:76px;border-radius:50%;overflow:hidden;background:linear-gradient(180deg,#F4F7F2,#E7EEE2);display:grid;place-items:center;flex:0 0 auto;border:1px solid rgba(31,122,58,.12);box-shadow:inset 0 0 0 1px rgba(255,255,255,.65)}.ow-avatar img{width:100%;height:100%;object-fit:cover}.ow-avatar-ph{width:100%;height:100%;display:grid;place-items:center;color:#9AAF96;background:radial-gradient(circle at 50% 28%,rgba(255,255,255,.9),rgba(235,243,230,.88))}.ow-avatar-ph svg{width:48px;height:48px}.ow-avatar-title{font-size:15px;font-weight:700}.ow-avatar-sub{font-size:12px;color:#788575;margin-top:2px}.ow-label{display:block;font-size:13px;color:#4a3a37;font-weight:700;margin:18px 0 8px}.ow-opt{font-weight:500;color:#a08f8a;margin-left:4px}.ow-input{width:100%;height:46px;border:1px solid rgba(26,26,26,.14);border-radius:14px;padding:0 14px;font-size:15px;background:rgba(255,255,255,.85);outline:0}.ow-input:focus{border-color:var(--green)}.ow-chips{display:flex;flex-wrap:wrap;gap:8px}.ow-chip{padding:8px 16px;border-radius:999px;background:rgba(255,255,255,.7);border:1px solid rgba(26,26,26,.12);font-size:14px;font-weight:600;transition:.15s}.ow-chip.sel{background:rgba(168,201,143,.18);color:var(--green-deep);border-color:var(--green);box-shadow:0 0 0 3px rgba(168,201,143,.20)}.ow-birthday{display:grid;grid-template-columns:1.2fr .9fr .9fr;gap:8px;position:relative;padding:8px;border-radius:18px;background:rgba(255,255,255,.58);border:1px solid rgba(26,26,26,.08)}.ow-birthday::before{content:"";position:absolute;left:10px;right:10px;top:50%;height:34px;transform:translateY(-50%);border-top:1px solid rgba(168,201,143,.35);border-bottom:1px solid rgba(168,201,143,.35);pointer-events:none}.ow-wheel-box{position:relative;z-index:1}.ow-wheel-select{width:100%;height:96px;border:0;outline:0;background:transparent;text-align:center;text-align-last:center;font-size:16px;font-weight:700;color:#788575;appearance:auto;padding:0 4px}.ow-birthday-value{font-size:12px;color:#788575;margin-top:8px;text-align:center}.ow-textarea{width:100%;border:1px solid rgba(26,26,26,.14);border-radius:14px;padding:12px 14px;font-size:14px;background:rgba(255,255,255,.85);outline:0;resize:none;line-height:1.5}.ow-textarea:focus{border-color:var(--green)}.ow-tags{display:flex;flex-wrap:wrap;gap:10px}.ow-tag{padding:9px 15px;border-radius:999px;background:rgba(255,255,255,.7);border:1px solid rgba(26,26,26,.12);font-size:14px;font-weight:600;transition:.15s}.ow-tag.sel{background:var(--green);color:#fff;border-color:var(--green);box-shadow:0 8px 18px rgba(168,201,143,.42)}.ow-tag.dim{opacity:.45}.ow-count{font-size:12px;color:#788575;margin:12px 0 0}.ow-foot{padding:10px 22px 14px}.ow-cta{width:100%;height:52px;border-radius:18px;background:var(--green);color:#fff;font-weight:700;box-shadow:0 14px 30px rgba(168,201,143,.42);transition:.18s}.ow-cta:active{transform:scale(.98)}.ow-cta.off{background:#d9cdc8;box-shadow:none;cursor:not-allowed}@media (prefers-reduced-motion:reduce){.ow-shell *{animation:none!important;transition:none!important}}
`;
