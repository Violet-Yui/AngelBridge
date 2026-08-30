import {
  MatchPoolStateSchema,
  type MatchPoolState,
} from "./contracts";

export interface MatchPoolStateRepository {
  load(): Promise<MatchPoolState | null>;
  save(state: MatchPoolState): Promise<void>;
  ping(): Promise<void>;
}

export class InMemoryMatchPoolStateRepository
implements MatchPoolStateRepository {
  private state: MatchPoolState | null = null;

  async load() {
    return this.state ? structuredClone(this.state) : null;
  }

  async save(state: MatchPoolState) {
    this.state = structuredClone(MatchPoolStateSchema.parse(state));
  }

  async ping() {}
}
