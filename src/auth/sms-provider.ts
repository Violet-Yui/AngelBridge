import Dysmsapi20170525, { SendSmsRequest } from "@alicloud/dysmsapi20170525";
import { Config } from "@alicloud/openapi-client";

const AliyunSmsClient = (
  (Dysmsapi20170525 as unknown as { default?: typeof Dysmsapi20170525 }).default ??
  Dysmsapi20170525
);

export interface SmsCodeSender {
  sendCode(phone: string, code: string): Promise<void>;
}

export class AliyunSmsCodeSender implements SmsCodeSender {
  private readonly client: Dysmsapi20170525;

  constructor(
    accessKeyId: string,
    accessKeySecret: string,
    private readonly signName: string,
    private readonly templateCode: string,
    private readonly codeParam = "code",
  ) {
    this.client = new AliyunSmsClient(new Config({
      accessKeyId,
      accessKeySecret,
      endpoint: "dysmsapi.aliyuncs.com",
    }));
  }

  async sendCode(phone: string, code: string): Promise<void> {
    const response = await this.client.sendSms(new SendSmsRequest({
      phoneNumbers: phone,
      signName: this.signName,
      templateCode: this.templateCode,
      templateParam: JSON.stringify({ [this.codeParam]: code }),
    }));
    const responseCode = response.body?.code;
    if (responseCode !== "OK") {
      throw new Error(`Aliyun SMS rejected the request: ${responseCode ?? "UNKNOWN"}`);
    }
  }
}
