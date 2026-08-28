import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { SettingsEntry } from "./settings-entry";

test("settings entry renders an accessible link to the settings route", () => {
  const html = renderToStaticMarkup(<SettingsEntry label="打开设置" />);

  expect(html).toContain('href="/settings"');
  expect(html).toContain('aria-label="打开设置"');
  expect(html).toContain('data-el="me-settings-entry"');
  expect(html).toContain("<svg");
});
