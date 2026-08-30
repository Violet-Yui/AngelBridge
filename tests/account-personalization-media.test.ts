import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AngelBridgeApplication } from "../src/application/app-service";
import { AccountAuthService } from "../src/auth/account-auth-service";
import { InMemoryAccountRepository } from "../src/auth/repository";
import { createApiHandler } from "../src/http/api";
import { createLocalApiServer } from "../src/http/node-server";
import { FileSystemImageStore } from "../src/media/image-store";
import type { PetChatProvider } from "../src/pet-ai/provider";
import { InMemoryMatchPoolStateRepository } from "../src/pool/repository";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })
  ));
});

const requestJson = async (
  handle: (request: Request) => Promise<Response>,
  path: string,
  options: { method?: string; token?: string; body?: unknown } = {},
) => {
  const response = await handle(new Request(`http://local.test${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.token ? { "x-demo-role-token": options.token } : {}),
      ...(options.body !== undefined ? { "content-type": "application/json" } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  }));
  return { response, body: await response.json() as any };
};

describe("real account personalization and media", () => {
  it("starts every account empty and only accepts the 15 frontend personality tags", async () => {
    const accounts = new InMemoryAccountRepository();
    const poolState = new InMemoryMatchPoolStateRepository();
    const auth = new AccountAuthService(accounts);
    const session = await auth.registerPhone("13800138009", "新桥友");
    const handle = createApiHandler(
      new AngelBridgeApplication(),
      undefined,
      accounts,
      poolState,
    );

    const account = await requestJson(handle, "/api/me/account", { token: session.token });
    expect(account.body.data).toMatchObject({
      nickname: "新桥友",
      personalityTags: [],
      petName: "小天",
      avatarUrl: null,
    });
    expect((await requestJson(handle, "/api/me/profile", { token: session.token })).body.data)
      .toBeNull();
    expect((await requestJson(handle, "/api/matches", { token: session.token })).body.data)
      .toEqual([]);
    expect((await requestJson(handle, "/api/conversations", { token: session.token })).body.data)
      .toEqual([]);
    expect((await requestJson(handle, "/api/pet/messages", { token: session.token })).body.data)
      .toEqual([]);

    const rejected = await requestJson(handle, "/api/me/account", {
      method: "PATCH",
      token: session.token,
      body: { personalityTags: ["自定义标签"] },
    });
    expect(rejected.response.status).toBe(400);
    expect(rejected.body.error.code).toBe("invalid_request");

    const updated = await requestJson(handle, "/api/me/account", {
      method: "PATCH",
      token: session.token,
      body: {
        personalityTags: ["热爱生活", "长期主义", "共情力强"],
        petName: "小桥",
        avatarUrl: "/api/media/11111111-1111-4111-8111-111111111111",
      },
    });
    expect(updated.body.data).toMatchObject({
      personalityTags: ["热爱生活", "长期主义", "共情力强"],
      petName: "小桥",
      avatarUrl: "/api/media/11111111-1111-4111-8111-111111111111",
    });

    const postImage = {
      url: "/api/media/44444444-4444-4444-8444-444444444444",
      mimeType: "image/webp",
      fileName: "resource.webp",
    };
    const profileInput = {
      bio: "这是我的价值档案",
      offers: [{
        domain: "skill",
        title: "产品策划",
        description: "可提供产品策划和原型梳理服务",
        keywords: ["产品策划"],
        deliverables: ["产品方案"],
        visibility: "match_only",
        images: [postImage],
      }],
      needs: [{
        domain: "service",
        title: "品牌摄影",
        description: "需要一组品牌摄影作品",
        keywords: ["品牌摄影"],
        deliverables: [],
        visibility: "match_only",
        images: [],
      }],
      goals: [],
      acceptedExchangeModes: ["collaboration"],
      constraints: { locations: [], availability: [] },
      disclosurePolicy: {
        matchLocationPrecision: "region",
        contactDisclosure: "after_mutual_consent",
        exactLocationDisclosure: "after_pact_active",
      },
    };
    expect((await requestJson(handle, "/api/me/profile", {
      method: "PUT",
      token: session.token,
      body: profileInput,
    })).response.status).toBe(200);
    const restored = createApiHandler(
      new AngelBridgeApplication(),
      undefined,
      accounts,
      poolState,
    );
    const profile = await requestJson(restored, "/api/me/profile", { token: session.token });
    expect(profile.body.data.profile.nodes[0].images).toEqual([postImage]);
  });

  it("uploads and serves a persisted image", async () => {
    const directory = await mkdtemp(join(tmpdir(), "angelbridge-media-"));
    temporaryDirectories.push(directory);
    const accounts = new InMemoryAccountRepository();
    const auth = new AccountAuthService(accounts);
    const session = await auth.registerPhone("13800138010", "图片用户");
    const handle = createApiHandler(
      new AngelBridgeApplication(),
      undefined,
      accounts,
      new InMemoryMatchPoolStateRepository(),
      undefined,
      undefined,
      undefined,
      new FileSystemImageStore(directory),
    );
    const form = new FormData();
    form.set("image", new File([new Uint8Array([137, 80, 78, 71])], "avatar.png", {
      type: "image/png",
    }));
    const uploaded = await handle(new Request("http://local.test/api/media/images", {
      method: "POST",
      headers: { "x-demo-role-token": session.token },
      body: form,
    }));
    expect(uploaded.status).toBe(201);
    const attachment = (await uploaded.json() as any).data;
    expect(attachment).toMatchObject({ mimeType: "image/png", fileName: "avatar.png" });

    const saved = await requestJson(handle, "/api/me/account", {
      method: "PATCH",
      token: session.token,
      body: { avatarUrl: attachment.url },
    });
    expect(saved.response.status).toBe(200);
    expect(saved.body.data.avatarUrl).toBe(attachment.url);

    const restored = createApiHandler(
      new AngelBridgeApplication(),
      undefined,
      accounts,
      new InMemoryMatchPoolStateRepository(),
      undefined,
      undefined,
      undefined,
      new FileSystemImageStore(directory),
    );
    const account = await requestJson(restored, "/api/me/account", { token: session.token });
    expect(account.body.data.avatarUrl).toBe(attachment.url);

    const served = await restored(new Request(`http://local.test${attachment.url}`));
    expect(served.status).toBe(200);
    expect(served.headers.get("content-type")).toBe("image/png");
    expect([...new Uint8Array(await served.arrayBuffer())]).toEqual([137, 80, 78, 71]);
  });

  it("keeps multipart image bytes intact through the real Node HTTP server", async () => {
    const directory = await mkdtemp(join(tmpdir(), "angelbridge-http-media-"));
    temporaryDirectories.push(directory);
    const accounts = new InMemoryAccountRepository();
    const session = await new AccountAuthService(accounts)
      .registerPhone("13800138012", "HTTP图片用户");
    const handler = createApiHandler(
      new AngelBridgeApplication(),
      undefined,
      accounts,
      new InMemoryMatchPoolStateRepository(),
      undefined,
      undefined,
      undefined,
      new FileSystemImageStore(directory),
    );
    const server = createLocalApiServer(handler);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    try {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("missing test port");
      const form = new FormData();
      form.set("image", new File([new Uint8Array([1, 2, 3, 4])], "chat.webp", {
        type: "image/webp",
      }));
      const response = await fetch(`http://127.0.0.1:${address.port}/api/media/images`, {
        method: "POST",
        headers: { "x-demo-role-token": session.token },
        body: form,
      });
      expect(response.status).toBe(201);
      const attachment = (await response.json() as any).data;
      const image = await fetch(`http://127.0.0.1:${address.port}${attachment.url}`);
      expect([...new Uint8Array(await image.arrayBuffer())]).toEqual([1, 2, 3, 4]);
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) =>
        error ? reject(error) : resolve()
      ));
    }
  });

  it("persists Xiaotian image turns and passes user tags and pet name to the AI", async () => {
    const accounts = new InMemoryAccountRepository();
    const auth = new AccountAuthService(accounts);
    const session = await auth.registerPhone("13800138011", "小雨");
    await auth.updateAccountProfile(session.token, {
      personalityTags: ["创意驱动", "温柔倾听"],
      petName: "芽芽",
    });
    const reply = vi.fn<PetChatProvider["reply"]>(async () => "我看到了，我们一起梳理这份资源。" );
    const petProvider: PetChatProvider = { reply };
    const poolState = new InMemoryMatchPoolStateRepository();
    const first = createApiHandler(
      new AngelBridgeApplication(),
      undefined,
      accounts,
      poolState,
      undefined,
      undefined,
      undefined,
      undefined,
      petProvider,
    );
    const image = {
      url: "/api/media/22222222-2222-4222-8222-222222222222",
      mimeType: "image/jpeg",
      fileName: "idea.jpg",
    };
    const sent = await requestJson(first, "/api/pet/messages", {
      method: "POST",
      token: session.token,
      body: { message: "帮我看看这个想法", images: [image] },
    });
    expect(sent.response.status).toBe(201);
    expect(sent.body.data.userImages).toEqual([image]);
    expect(reply).toHaveBeenCalledWith(expect.objectContaining({
      nickname: "小雨",
      petName: "芽芽",
      personalityTags: ["创意驱动", "温柔倾听"],
      images: [image],
    }));

    const restored = createApiHandler(
      new AngelBridgeApplication(),
      undefined,
      accounts,
      poolState,
      undefined,
      undefined,
      undefined,
      undefined,
      petProvider,
    );
    const history = await requestJson(restored, "/api/pet/messages", { token: session.token });
    expect(history.body.data).toHaveLength(1);
    expect(history.body.data[0].assistantText).toBe("我看到了，我们一起梳理这份资源。");
  });
});
