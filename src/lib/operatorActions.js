const API_URL = import.meta.env.API_URL || '';

export function buildConnectorCredentials(connectionPrefs = {}) {
  return {
    openaiApiKey: connectionPrefs.openaiApiKey || '',
    openaiModel: connectionPrefs.openaiModel || '',
    groqApiKey: connectionPrefs.groqApiKey || '',
    groqModel: connectionPrefs.groqModel || '',
    geminiApiKey: connectionPrefs.geminiApiKey || '',
    geminiModel: connectionPrefs.geminiModel || '',
    ollamaBaseUrl: connectionPrefs.ollamaBaseUrl || '',
    ollamaModel: connectionPrefs.ollamaModel || '',
    browserWorkerUrl: connectionPrefs.browserWorkerUrl || '',
    runtimeTarget: connectionPrefs.runtimeTarget || '',
    localRuntimeUrl: connectionPrefs.localRuntimeUrl || '',
    cloudRuntimeUrl: connectionPrefs.cloudRuntimeUrl || '',
    githubToken: connectionPrefs.githubToken || '',
    githubRepoOwner: connectionPrefs.githubRepoOwner || '',
    githubRepoName: connectionPrefs.githubRepoName || '',
    githubRepoBranch: connectionPrefs.githubRepoBranch || '',
    githubWorkflowFile: connectionPrefs.githubWorkflowFile || '',
    vercelToken: connectionPrefs.vercelToken || '',
    vercelProjectId: connectionPrefs.vercelProjectId || '',
    vercelTeamId: connectionPrefs.vercelTeamId || '',
    vercelDeployHookUrl: connectionPrefs.vercelDeployHookUrl || '',
    repoTarget: connectionPrefs.repoTarget || '',
    deploymentTarget: connectionPrefs.deploymentTarget || '',
    twilioWebhookUrl: connectionPrefs.twilioWebhookUrl || '',
    sendgridWebhookUrl: connectionPrefs.sendgridWebhookUrl || '',
    genericWebhookUrl: connectionPrefs.genericWebhookUrl || '',
    twilioAccountSid: connectionPrefs.twilioAccountSid || '',
    twilioAuthToken: connectionPrefs.twilioAuthToken || '',
    twilioPhoneNumber: connectionPrefs.twilioPhoneNumber || '',
    sendgridApiKey: connectionPrefs.sendgridApiKey || '',
    sendgridFromEmail: connectionPrefs.sendgridFromEmail || '',
  };
}

export async function executeControlAction(action, payload = {}) {
  try {
    const res = await fetch(`${API_URL}/api/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || `Control plane returned ${res.status}`);
    }
    return data;
  } catch (err) {
    throw new Error(`Failed to connect to control API: ${err.message}`);
  }
}

export function normalizeConnectorResult(data, fallbackConnector) {
  const workspaceObject = data?.workspace_object || null;
  return {
    status: data?.status || 'blocked',
    mode: data?.mode || 'blocked',
    connector: data?.connector || workspaceObject?.meta?.connector || fallbackConnector,
    message: data?.message || data?.reason || workspaceObject?.content || 'No response returned.',
    reason: data?.reason || workspaceObject?.meta?.reason || null,
    workspaceObject,
    externalId: data?.external_id || workspaceObject?.meta?.externalId || null,
    raw: data,
  };
}

export async function executeTwilioCall(payload = {}) {
  const data = await executeControlAction('twilio_call', payload);
  return normalizeConnectorResult(data, 'twilio');
}

export async function executeSendGridEmail(payload = {}) {
  const data = await executeControlAction('sendgrid_email', payload);
  return normalizeConnectorResult(data, 'sendgrid');
}
