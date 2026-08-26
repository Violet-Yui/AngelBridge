import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  DomainSchema,
  ExchangeModeSchema,
  ParseResultSchema,
  VisibilitySchema,
} from "../../domain/contracts";
import type { LanguageModelProvider, VoiceContext } from "../providers";

const GeneratedNodeSchema = z.object({
  direction: z.enum(["offer", "need", "goal"]),
  domain: DomainSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  keywords: z.array(z.string().min(1)).min(1),
  deliverables: z.array(z.string().min(1)),
  visibility: VisibilitySchema,
  evidenceCompleteness: z.number().min(0).max(1),
});

const GeneratedInterpretationSchema = z.object({
  nodes: z.array(GeneratedNodeSchema).min(1),
  acceptedExchangeModes: z.array(ExchangeModeSchema).min(1),
  constraints: z.object({
    locations: z.array(z.string().min(1)),
    availability: z.array(z.string().min(1)),
  }),
  replyText: z.string().min(1).max(180),
});

const ArkResponseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        tool_calls: z.array(
          z.object({
            function: z.object({
              name: z.string(),
              arguments: z.string(),
            }),
          }),
        ).min(1),
      }),
    }),
  ).min(1),
});

const interpretationTool = {
  type: "function",
  function: {
    name: "record_value_nodes",
    description: "把用户表达整理为价值节点、交换意向和灵宠确认回复",
    parameters: {
      type: "object",
      properties: {
        nodes: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            properties: {
              direction: { type: "string", enum: ["offer", "need", "goal"] },
              domain: {
                type: "string",
                enum: [
                  "space",
                  "item",
                  "skill",
                  "service",
                  "opportunity",
                  "growth",
                ],
              },
              title: { type: "string" },
              description: { type: "string" },
              keywords: { type: "array", items: { type: "string" } },
              deliverables: { type: "array", items: { type: "string" } },
              visibility: {
                type: "string",
                enum: ["private", "match_only", "mutual_consent"],
              },
              evidenceCompleteness: { type: "number", minimum: 0, maximum: 1 },
            },
            required: [
              "direction",
              "domain",
              "title",
              "description",
              "keywords",
              "deliverables",
              "visibility",
              "evidenceCompleteness",
            ],
          },
        },
        acceptedExchangeModes: {
          type: "array",
          items: {
            type: "string",
            enum: ["money", "barter", "skill_swap", "collaboration", "gift"],
          },
        },
        constraints: {
          type: "object",
          properties: {
            locations: { type: "array", items: { type: "string" } },
            availability: { type: "array", items: { type: "string" } },
          },
          required: ["locations", "availability"],
        },
        replyText: {
          type: "string",
          description: "不超过两句话，温暖自然地复述识别结果并邀请用户确认",
        },
      },
      required: [
        "nodes",
        "acceptedExchangeModes",
        "constraints",
        "replyText",
      ],
    },
  },
} as const;

type DoubaoArkOptions = {
  apiKey: string;
  model: string;
  endpoint?: string;
  datasetVersion?: string;
  fetchImpl?: typeof fetch;
  idFactory?: () => string;
  now?: () => Date;
};

export class DoubaoArkLanguageModelProvider implements LanguageModelProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly endpoint: string;
  private readonly datasetVersion: string;
  private readonly fetchImpl: typeof fetch;
  private readonly idFactory: () => string;
  private readonly now: () => Date;

  constructor(options: DoubaoArkOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.endpoint =
      options.endpoint ??
      "https://ark.cn-beijing.volces.com/api/v3/chat/completions";
    this.datasetVersion = options.datasetVersion ?? "live-v1";
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.idFactory = options.idFactory ?? randomUUID;
    this.now = options.now ?? (() => new Date());
  }

  async interpret(transcript: string, context: VoiceContext) {
    const response = await this.fetchImpl(this.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "你是天使桥灵宠小天。只提取用户明确表达的资源、需求和目标，不补造事实；交换方式没有明说时优先标为 collaboration。",
          },
          { role: "user", content: transcript },
        ],
        tools: [interpretationTool],
        tool_choice: {
          type: "function",
          function: { name: "record_value_nodes" },
        },
      }),
    });
    if (!response.ok) {
      throw new Error(`Doubao Ark HTTP ${response.status}`);
    }
    const result = ArkResponseSchema.parse(await response.json());
    const toolCall = result.choices[0].message.tool_calls[0].function;
    if (toolCall.name !== "record_value_nodes") {
      throw new Error(`unexpected Doubao tool call: ${toolCall.name}`);
    }
    const generated = GeneratedInterpretationSchema.parse(
      JSON.parse(toolCall.arguments),
    );
    const updatedAt = this.now().toISOString();
    const nodes = generated.nodes.map((node) => ({
      ...node,
      id: `node:${this.idFactory()}`,
      personaId: context.personaId,
      updatedAt,
      isSynthetic: false,
      datasetVersion: this.datasetVersion,
    }));
    const parseResult = ParseResultSchema.parse({
      personaId: context.personaId,
      sourceText: transcript,
      source: "live_ai",
      nodes,
      intent: {
        offerNodeIds: nodes
          .filter((node) => node.direction === "offer")
          .map((node) => node.id),
        needNodeIds: nodes
          .filter((node) => node.direction === "need")
          .map((node) => node.id),
        goalNodeIds: nodes
          .filter((node) => node.direction === "goal")
          .map((node) => node.id),
        acceptedExchangeModes: generated.acceptedExchangeModes,
        constraints: generated.constraints,
        status: "draft",
      },
      isSynthetic: false,
      datasetVersion: this.datasetVersion,
    });
    return { parseResult, replyText: generated.replyText };
  }
}
