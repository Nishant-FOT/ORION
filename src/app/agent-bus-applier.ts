export type AgentBusApplyStatus = 'applied' | 'denied' | 'invalid' | 'skipped';

export interface AgentBusApplyTargetResult {
  target: string;
  status: AgentBusApplyStatus;
  reason?: string;
}
