import type {
  AiMatchAssessment,
  AiMatchAssessmentInput,
} from "./contracts";

export interface AiMatchAssessmentProvider {
  assess(input: AiMatchAssessmentInput): Promise<AiMatchAssessment>;
}
