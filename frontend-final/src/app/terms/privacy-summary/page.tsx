import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

const highlights = ["个人信息", "敏感个人信息", "公开", "仅匹配对象可见", "仅自己可见", "桥约", "自动化规则", "人工智能", "第三方", "跨境", "保存", "保护", "查阅", "复制", "更正", "删除", "撤回同意", "注销账号", "未成年人"];

function renderText(text: string) {
  const pattern = new RegExp(`(${highlights.join("|")})`, "g");
  return text.split(pattern).map((part, index) => highlights.includes(part) ? <mark key={`${part}-${index}`} className="rounded-md bg-[#e7f5dc] px-1 font-bold text-[#1f7a3a]">{part}</mark> : part);
}

const infoRows = [
  ["账号与资料", "邮箱或手机号、登录凭证、昵称、头像、简介、所在地", "注册登录、展示身份和保护账号安全"],
  ["资源与匹配", "您填写的资源、需求、可见范围、互动和匹配反馈", "展示内容、寻找候选连接和生成推荐理由"],
  ["桥约与消息", "参与人、资源和需求、留言、时间窗口、大致区域、消息及确认记录", "支持沟通、协作确认、举报和安全治理"],
  ["智能助手", "您的输入、相关上下文、资源与需求、任务结果和反馈", "识别意图、生成建议和辅助匹配"],
  ["运行与安全", "IP 地址、设备/浏览器类型、访问和错误日志、语言及通知偏好", "维持运行、排查故障、防范攻击和记住设置"],
];

const sections = [
  { title: "一、我们是谁", body: ["天使桥提供资源与需求记录、发现与匹配、桥约协作、消息沟通、成长记录、通知提醒以及智能助手等服务。"] },
  { title: "二、您需要特别注意的事项", body: ["天使桥常规服务原则上不要求身份证件、银行卡、精确住址、医疗健康等敏感个人信息。请勿在公开主页、资源、需求或初次消息中主动填写这些信息。", "您可为资源选择公开、仅匹配对象可见或仅自己可见。公开内容可能被其他用户查看，请审慎选择可见范围。", "桥约只需填写便于协作的大致区域和时间窗口，不建议填写详细住址。涉及线下会面、金钱或贵重物品时，请独立核验并采取安全措施。", "匹配分数、推荐理由和智能助手输出可能由自动化规则或人工智能生成，仅供参考，不代表对身份、信用、能力或交易结果的保证。", "相机、相册、麦克风、定位或文件权限仅会在相关功能由您主动触发时申请；拒绝授权只影响相应功能。"] },
  { title: "三、信息如何共享", body: ["平台原则上不向其他独立个人信息处理者提供您的个人信息。为实现云托管、内容存储、消息送达、安全运维、客服或智能服务，平台可能委托服务商处理必要信息，并通过合同和监督措施约束其处理活动。", "涉及第三方共享或跨境提供个人信息时，平台将依法告知接收方、目的、方式和信息种类，并在法律要求时取得您的单独同意。实际接入的第三方和 SDK 将在产品清单中列明。"] },
  { title: "四、信息如何保存和保护", body: ["平台仅在实现处理目的所必要的最短期限内保存信息，并采取访问控制、身份认证、传输与存储保护、日志审计、备份恢复和应急处置等措施。", "发生或可能发生个人信息泄露、篡改或丢失时，平台将依法采取补救措施，并按规定通知您及有关主管部门。"] },
  { title: "五、您的权利", body: ["在法律规定范围内，您可以查阅、复制、更正、补充或删除个人信息，调整资源可见范围，撤回同意，关闭通知，注销账号，要求解释处理规则，并对自动化决策提出异议。", "您可通过“我的—设置/资料/资源可见范围”、账号注销入口或产品内客服入口提交请求。平台一般将在核验身份后 15 个工作日内答复。"] },
  { title: "六、未成年人保护", body: ["天使桥目前不主动面向不满 14 周岁儿童。未满 18 周岁的用户应在监护人指导下使用，不应独自参与涉及金钱、贵重物品、线下会面或其他高风险桥约。"] },
  { title: "七、阅读完整版", body: ["本概要用于快速说明隐私保护要点，不替代《天使桥隐私政策》全文。若本概要与完整政策存在不一致，以完整政策为准。"] },
];

export default function PrivacySummaryPage() {
  return (
    <main className="min-h-dvh bg-[#f4fbec] px-[var(--page-gutter)] py-6 text-[#31412f]"><div className="tsq-app-frame mx-auto pb-10"><div className="sticky top-0 z-10 -mx-4 mb-4 bg-[#f4fbec]/95 px-4 py-3 backdrop-blur"><Link href="/auth" className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-[#386a30] shadow-sm"><ArrowLeft className="h-4 w-4" />返回登录</Link></div><header className="rounded-[28px] border border-[#dfeacb] bg-white p-5 shadow-[0_16px_38px_rgba(70,110,50,.14)]"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7f5dc] text-[#1f7a3a]"><Shield className="h-6 w-6" /></div><p className="text-xs font-semibold text-[#6f8a5c]">版本 V1.0 · 更新/生效日期 8.29</p><h1 className="mt-2 text-2xl font-bold tracking-tight">天使桥隐私政策概要</h1><p className="mt-3 text-sm leading-7 text-[#5a6a52]">帮助您快速了解平台如何处理和保护个人信息。请重点关注绿色标识内容。</p></header><section className="mt-4 overflow-hidden rounded-3xl border border-[#dfeacb] bg-white/95 shadow-sm"><div className="bg-[#e7f5dc] px-5 py-3 text-[15px] font-bold text-[#1f7a3a]">二、我们处理哪些个人信息</div><div className="divide-y divide-[#eef4e6]">{infoRows.map(([scene, info, use]) => (<div key={scene} className="p-4"><h2 className="text-[16px] font-bold text-[#20351d]">{scene}</h2><p className="mt-2 text-[14px] leading-7 text-[#485943]"><b className="text-[#1f7a3a]">可能处理：</b>{renderText(info)}</p><p className="mt-1 text-[14px] leading-7 text-[#485943]"><b className="text-[#1f7a3a]">主要用途：</b>{renderText(use)}</p></div>))}</div></section><div className="mt-4 space-y-3">{sections.map((section) => (<article key={section.title} className="rounded-3xl border border-[#e1ead1] bg-white/95 p-5 shadow-sm"><h2 className="text-lg font-bold text-[#1f7a3a]">{section.title}</h2><div className="mt-3 space-y-3 text-[15px] leading-8 text-[#485943]">{section.body.map((p) => <p key={p}>{renderText(p)}</p>)}</div></article>))}</div><Link href="/terms/privacy-policy" className="mt-5 flex items-center justify-center rounded-full bg-[#1f7a3a] px-5 py-3.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(31,122,58,.22)]">阅读完整《隐私政策》</Link></div></main>
  );
}
