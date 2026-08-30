import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://127.0.0.1:3000";
const OUT = "/home/user/design-frames";
const W = 390, H = 844;

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const routes = [
  ["01-home", "/"],
  ["02-discover", "/discover"],
  ["03-create", "/create"],
  ["04-me", "/me"],
  ["05-pets", "/pets"],
  ["06-messages", "/messages"],
  ["07-messages-chat", "/messages/chat"],
  ["08-bridge", "/bridge"],
  ["09-bridge-detail", "/bridge/detail"],
  ["10-bridge-confirm", "/bridge/confirm"],
  ["11-bridge-schedule", "/bridge/schedule"],
  ["12-xiaotian-chat", "/xiaotian/chat"],
  ["13-xiaotian-intent", "/xiaotian/intent"],
  ["14-xiaotian-bridging", "/xiaotian/bridging"],
  ["15-login", "/login"],
  ["16-auth-route", "/auth"],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--force-device-scale-factor=2"],
});

async function newPage() {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 2 });
  return page;
}

async function shoot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file });
  console.log("saved", file);
}

// click a button/element whose visible text matches (within active auth screen)
async function clickByText(page, text) {
  return page.evaluate((t) => {
    const nodes = [...document.querySelectorAll(".ab-screen.active button, .ab-modal button, .ab-agree")];
    const el = nodes.find((n) => n.textContent && n.textContent.replace(/\s+/g, "").includes(t.replace(/\s+/g, "")));
    if (el) { el.click(); return true; }
    return false;
  }, text);
}

async function typeInto(page, placeholder, value) {
  const sel = `.ab-screen.active input[placeholder*="${placeholder}"]`;
  const found = await page.$(sel);
  if (found) { await found.click({ clickCount: 3 }); await found.type(value); return true; }
  return false;
}

// --- Regular routes ---
for (const [name, route] of routes) {
  const page = await newPage();
  try {
    await page.goto(BASE + route, { waitUntil: "networkidle2", timeout: 45000 });
    await sleep(1200);
    await shoot(page, name);
  } catch (e) {
    console.error("route failed", route, e.message);
  }
  await page.close();
}

// --- Auth flow screens driven step by step (via /auth) ---
{
  const page = await newPage();
  await page.goto(BASE + "/auth", { waitUntil: "networkidle2", timeout: 45000 });
  await sleep(1000);

  // A: 温馨提示弹框
  await shoot(page, "auth-01-welcome-modal");

  // agree modal -> welcome
  await clickByText(page, "同意");
  await sleep(600);
  await shoot(page, "auth-02-welcome");

  // check agreement radio, then 注册/登录 -> verify
  await clickByText(page, "我已认真阅读");
  await sleep(200);
  await clickByText(page, "注册/登录");
  await sleep(600);
  await shoot(page, "auth-03-verify-empty");

  // fill phone (odd -> new user), nickname, code -> profile
  await typeInto(page, "手机号", "13800001357");
  await typeInto(page, "昵称", "小天使");
  await typeInto(page, "验证码", "8888");
  await sleep(300);
  await shoot(page, "auth-04-verify-filled");

  await clickByText(page, "往前走");
  await sleep(700);
  await shoot(page, "auth-05-profile");

  await clickByText(page, "登上天使桥");
  await sleep(700);
  await shoot(page, "auth-06-home-success");
  await page.close();
}

await browser.close();
console.log("ALL DONE");
