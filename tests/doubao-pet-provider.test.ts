import { describe, expect, it, vi } from "vitest";
import { DoubaoArkPetChatProvider } from "../src/pet-ai/doubao-ark-provider";

describe("Doubao Xiaotian provider", () => {
  it("sends the pet name, user tags and public image URL to the multimodal model", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => Response.json({
      choices: [{ message: { content: "这是一张工作室照片，我们可以继续完善资源信息。" } }],
    }));
    const provider = new DoubaoArkPetChatProvider({
      apiKey: "test-key",
      model: "doubao-test",
      publicAppUrl: "https://angel.xxpeople.com",
      fetchImpl,
    });

    const reply = await provider.reply({
      nickname: "小雨",
      petName: "芽芽",
      personalityTags: ["创意驱动", "温柔倾听"],
      message: "帮我看看这个空间",
      images: [{
        url: "/api/media/55555555-5555-4555-8555-555555555555",
        mimeType: "image/jpeg",
        fileName: "studio.jpg",
      }],
      recentTurns: [],
    });

    expect(reply).toContain("工作室照片");
    const request = JSON.parse(String(fetchImpl.mock.calls[0][1]?.body));
    expect(request.messages[0].content).toContain("芽芽");
    expect(request.messages[0].content).toContain("创意驱动、温柔倾听");
    expect(request.messages[1].content).toEqual([
      {
        type: "image_url",
        image_url: {
          url: "https://angel.xxpeople.com/api/media/55555555-5555-4555-8555-555555555555",
        },
      },
      { type: "text", text: "帮我看看这个空间" },
    ]);
  });
});
