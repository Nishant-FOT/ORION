export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'expired';

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'above' | 'below' | 'change_pct';
  threshold: number;
  durationMinutes: number;
  severity: AlertSeverity;
  enabled: boolean;
  notifyPush: boolean;
  notifyEmail: boolean;
  email?: string;
  cooldownMinutes: number;
  createdAt: string;
  lastTriggered?: string;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  metric: string;
  severity: AlertSeverity;
  status: AlertStatus;
  value: number;
  threshold: number;
  message: string;
  triggeredAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

const STORAGE_KEY = 'orion-alert-rules';
const ALERTS_STORAGE_KEY = 'orion-alerts';

function loadRules(): AlertRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRules(rules: AlertRule[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
}

function loadAlerts(): Alert[] {
  try {
    const raw = localStorage.getItem(ALERTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAlerts(alerts: Alert[]): void {
  localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
}

export function createAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt'>): AlertRule {
  const newRule: AlertRule = {
    ...rule,
    id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  const rules = loadRules();
  rules.push(newRule);
  saveRules(rules);
  return newRule;
}

export function updateAlertRule(id: string, updates: Partial<AlertRule>): AlertRule | null {
  const rules = loadRules();
  const idx = rules.findIndex(r => r.id === id);
  if (idx === -1) return null;
  const existing = rules[idx]!;
  rules[idx] = { ...existing, ...updates, id: existing.id, createdAt: existing.createdAt };
  saveRules(rules);
  return rules[idx];
}

export function deleteAlertRule(id: string): boolean {
  const rules = loadRules();
  const filtered = rules.filter(r => r.id !== id);
  if (filtered.length === rules.length) return false;
  saveRules(filtered);
  return true;
}

export function getAlertRules(): AlertRule[] {
  return loadRules();
}

export function getActiveAlerts(): Alert[] {
  return loadAlerts().filter(a => a.status === 'active');
}

export function getAllAlerts(): Alert[] {
  return loadAlerts();
}

export function acknowledgeAlert(id: string): boolean {
  const alerts = loadAlerts();
  const alert = alerts.find(a => a.id === id);
  if (!alert) return false;
  alert.status = 'acknowledged';
  alert.acknowledgedAt = new Date().toISOString();
  saveAlerts(alerts);
  return true;
}

export function resolveAlert(id: string): boolean {
  const alerts = loadAlerts();
  const alert = alerts.find(a => a.id === id);
  if (!alert) return false;
  alert.status = 'resolved';
  alert.resolvedAt = new Date().toISOString();
  saveAlerts(alerts);
  return true;
}

export async function evaluateAlertRules(
  metricValues: Map<string, number>,
): Promise<Alert[]> {
  const rules = loadRules().filter(r => r.enabled);
  const alerts = loadAlerts();
  const newAlerts: Alert[] = [];

  for (const rule of rules) {
    const value = metricValues.get(rule.metric);
    if (value === undefined) continue;

    const lastTriggered = rule.lastTriggered ? new Date(rule.lastTriggered).getTime() : 0;
    const cooldownMs = rule.cooldownMinutes * 60 * 1000;
    if (Date.now() - lastTriggered < cooldownMs) continue;

    let triggered = false;
    switch (rule.condition) {
      case 'above':
        triggered = value > rule.threshold;
        break;
      case 'below':
        triggered = value < rule.threshold;
        break;
      case 'change_pct':
        triggered = Math.abs(value) > rule.threshold;
        break;
    }

    if (triggered) {
      const alert: Alert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ruleId: rule.id,
        ruleName: rule.name,
        metric: rule.metric,
        severity: rule.severity,
        status: 'active',
        value,
        threshold: rule.threshold,
        message: `${rule.name}: ${rule.metric} is ${value} (threshold: ${rule.threshold})`,
        triggeredAt: new Date().toISOString(),
      };
      newAlerts.push(alert);

      rule.lastTriggered = new Date().toISOString();

      if (rule.notifyPush && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(`ORION Alert: ${rule.name}`, {
          body: alert.message,
          icon: '/favicon.ico',
        });
      }
    }
  }

  if (newAlerts.length > 0) {
    alerts.push(...newAlerts);
    saveAlerts(alerts);
    saveRules(rules);

    for (const alert of newAlerts) {
      window.dispatchEvent(new CustomEvent('wm:alert-triggered', { detail: alert }));
    }
  }

  return newAlerts;
}

export function getAlertStats(): {
  total: number;
  active: number;
  acknowledged: number;
  resolved: number;
  bySeverity: Record<AlertSeverity, number>;
} {
  const alerts = loadAlerts();
  return {
    total: alerts.length,
    active: alerts.filter(a => a.status === 'active').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
    bySeverity: {
      critical: alerts.filter(a => a.severity === 'critical' && a.status === 'active').length,
      high: alerts.filter(a => a.severity === 'high' && a.status === 'active').length,
      medium: alerts.filter(a => a.severity === 'medium' && a.status === 'active').length,
      low: alerts.filter(a => a.severity === 'low' && a.status === 'active').length,
    },
  };
}

export const DEFAULT_ALERT_RULES: Omit<AlertRule, 'id' | 'createdAt'>[] = [
  {
    name: 'Hormuz Disruption Critical',
    metric: 'orion.chokepoint.disruption_prob',
    condition: 'above',
    threshold: 78,
    durationMinutes: 5,
    severity: 'critical',
    enabled: true,
    notifyPush: true,
    notifyEmail: false,
    cooldownMinutes: 30,
  },
  {
    name: 'Brent Price Spike',
    metric: 'orion.market.brent',
    condition: 'above',
    threshold: 100,
    durationMinutes: 15,
    severity: 'high',
    enabled: true,
    notifyPush: true,
    notifyEmail: false,
    cooldownMinutes: 60,
  },
  {
    name: 'Shipping Stress Elevated',
    metric: 'orion.shipping.stress',
    condition: 'above',
    threshold: 70,
    durationMinutes: 30,
    severity: 'medium',
    enabled: true,
    notifyPush: false,
    notifyEmail: false,
    cooldownMinutes: 120,
  },
  {
    name: 'Energy Shock Score Critical',
    metric: 'orion.energy.shock_score',
    condition: 'above',
    threshold: 80,
    durationMinutes: 10,
    severity: 'critical',
    enabled: true,
    notifyPush: true,
    notifyEmail: false,
    cooldownMinutes: 30,
  },
];
