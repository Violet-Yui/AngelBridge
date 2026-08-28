import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import { Window } from "happy-dom";
import { act, type AnchorHTMLAttributes, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";

mock.module("next/navigation", () => ({
  useRouter: () => ({ push: () => {} }),
}));

mock.module("next/link", () => ({
  default: ({ children, href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import i18n from "@/i18n";
import { usePetStore } from "@/stores/pet-store";
import { Pet } from "./pet";

let browserWindow: Window;
let root: Root;
let container: HTMLElement;

beforeEach(async () => {
  browserWindow = new Window({ url: "https://example.test/me" });
  Object.defineProperty(globalThis, "window", { configurable: true, value: browserWindow });
  Object.defineProperty(globalThis, "document", { configurable: true, value: browserWindow.document });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: browserWindow.navigator });
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: browserWindow.localStorage });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  await i18n.changeLanguage("zh-CN");
  usePetStore.setState({ open: true });
  container = browserWindow.document.createElement("div");
  browserWindow.document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  usePetStore.setState({ open: false });
  await browserWindow.close();
  Reflect.deleteProperty(globalThis, "window");
  Reflect.deleteProperty(globalThis, "document");
  Reflect.deleteProperty(globalThis, "navigator");
  Reflect.deleteProperty(globalThis, "localStorage");
  Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");
});

test("expanded pet panel stays within the original mobile canvas width", async () => {
  await act(async () => {
    root.render(<Pet />);
  });

  const panel = container.querySelector<HTMLElement>('[data-el="pet-panel"]');
  expect(panel).not.toBeNull();
  expect(panel?.className).toContain("max-w-[398px]");
  expect(panel?.className).toContain("left-1/2");
  expect(panel?.className).toContain("-translate-x-1/2");
});
