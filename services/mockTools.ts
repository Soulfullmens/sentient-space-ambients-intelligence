
export interface ToolResponse {
    ok: boolean;
    id?: string;
    error?: string;
}

export function sendAlert(phone: string, msg: string): ToolResponse {
    console.log(`%c[MOCK TOOL] Sending SMS to ${phone}: "${msg}"`, 'color: orange; font-weight: bold; background: #2a1b00; padding: 4px;');
    return { ok: true, id: `mock-sms-${Date.now()}` };
}

export function logIncident(payload: any): ToolResponse {
    console.log(`%c[MOCK TOOL] Logging Incident:`, 'color: red; font-weight: bold; background: #2a0000; padding: 4px;', JSON.stringify(payload, null, 2));
    return { ok: true, id: `mock-incident-${Date.now()}` };
}
