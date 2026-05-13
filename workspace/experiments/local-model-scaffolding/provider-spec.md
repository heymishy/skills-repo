# Local Model Provider Specification

**Scope:** Defines how `run-model-sweep.js` handles models with the `local-` prefix. Extends the `getProvider()` design from EXP-002a (see `workspace/experiments/EXP-002a-cross-provider-discovery/manifest.md` provider abstraction section).

---

## Motivation

Local models (Ollama, llama.cpp, LM Studio, vLLM with OpenAI-compatible endpoints, etc.) enable two use cases this framework requires:

1. **Privacy gate:** Context files containing internal enterprise system names, network topology, or regulated architecture details must not leave the network boundary. When `data_classification_check.approved_for_external_api` is `false`, local models are the only permitted evaluation target.
2. **Cost-free evaluation:** Local models have zero per-token API cost. EXP-LOCAL-001 and subsequent local sweeps run entirely on local infrastructure.

---

## Model ID naming convention

All local models use the prefix `local-`. Examples:

```
local-llama3-8b
local-mistral-7b
local-qwen2.5-14b
local-deepseek-coder-7b
```

The part after `local-` is the model identifier as configured in the local inference server. It must match the value the server expects in `model` field of the `/v1/chat/completions` request.

---

## Environment variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `LOCAL_MODEL_HOST` | No | `localhost` | Hostname or IP of the local inference server |
| `LOCAL_MODEL_PORT` | No | `3000` | Port of the local inference server |
| `LOCAL_MODEL_KEY` | No | (no auth header sent) | Bearer token if the local server requires authentication |

**Note:** Most local inference servers (Ollama, LM Studio) do not require authentication when running on localhost. `LOCAL_MODEL_KEY` is provided for deployments that add an API gateway in front of the inference server.

---

## getProvider() implementation — `local-` prefix

```javascript
function getProvider(modelId) {
  if (modelId.startsWith('claude-')) {
    // Anthropic — see EXP-002a manifest
    return {
      host: 'api.anthropic.com',
      path: '/v1/messages',
      authHeader: () => ({ 'x-api-key': process.env.ANTHROPIC_API_KEY }),
      buildRequest: (model, system, messages) => ({ model, system, messages, max_tokens: 4096 }),
      parseResponse: (body) => body.content[0].text,
    };
  }

  if (modelId.startsWith('gpt-')) {
    // OpenAI — see EXP-002a manifest
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY required for gpt-* models');
    return {
      host: 'api.openai.com',
      path: '/v1/chat/completions',
      authHeader: () => ({ 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }),
      buildRequest: (model, system, messages) => ({
        model,
        messages: [{ role: 'system', content: system }, ...messages],
        max_tokens: 4096
      }),
      parseResponse: (body) => body.choices[0].message.content,
    };
  }

  if (modelId.startsWith('local-')) {
    const host = process.env.LOCAL_MODEL_HOST || 'localhost';
    const port = process.env.LOCAL_MODEL_PORT || '3000';
    const localModelName = modelId.slice('local-'.length); // strip prefix
    return {
      host: `${host}:${port}`,
      path: '/v1/chat/completions',
      authHeader: () => process.env.LOCAL_MODEL_KEY
        ? { 'Authorization': `Bearer ${process.env.LOCAL_MODEL_KEY}` }
        : {},
      buildRequest: (model, system, messages) => ({
        model: localModelName,
        messages: [{ role: 'system', content: system }, ...messages],
        max_tokens: 4096,
        stream: false
      }),
      parseResponse: (body) => body.choices[0].message.content,
    };
  }

  throw new Error(`getProvider: unrecognised model prefix in "${modelId}". Expected claude-*, gpt-*, or local-*`);
}
```

**Implementation note:** The `host` field for local models includes the port (`${host}:${port}`). The `https.request` call in `run-model-sweep.js` must use `http.request` (not `https.request`) for localhost targets. Add a protocol check:

```javascript
const protocol = provider.host.startsWith('localhost') || provider.host.startsWith('127.')
  ? require('http')
  : require('https');
```

---

## PRICING map extension for local models

Local models have zero per-token cost. Add to the existing `PRICING` map:

```javascript
// local-* models: zero cost (local inference, no API billing)
// Add entries as needed for reporting purposes — cost is always 0
'local-llama3-8b': { input: 0, output: 0 },
'local-mistral-7b': { input: 0, output: 0 },
'local-qwen2.5-14b': { input: 0, output: 0 },
// Generic fallback for any unregistered local model:
'local-unknown': { input: 0, output: 0 },
```

For models not in the PRICING map, default to `{ input: 0, output: 0 }` when the model ID starts with `local-`.

---

## data_classification_check field specification

This field is required in any experiment manifest using Scenario 2 or Scenario 3 conditions (context files injected). It also governs whether local models are required.

```json
{
  "data_classification_check": {
    "context_files_used": ["list of files injected"],
    "contains_internal_system_names": false,
    "contains_customer_data": false,
    "approved_for_external_api": true,
    "if_not_approved": "Run with local-* model only. See local-model-scaffolding/provider-spec.md"
  }
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `context_files_used` | Yes | Exact paths of files injected into system prompt |
| `contains_internal_system_names` | Yes | `true` if any context file names an internal application, server, network segment, or database by its actual name |
| `contains_customer_data` | Yes | Must always be `false` — never use real customer data in any experiment corpus |
| `approved_for_external_api` | Yes | `true` only when both `contains_internal_system_names: false` AND `contains_customer_data: false` |
| `if_not_approved` | Yes | Instruction for operator when `approved_for_external_api: false` |

**Harness guard (pseudo-code):**
```javascript
if (manifest.scenario >= 2 && !manifest.data_classification_check.approved_for_external_api) {
  if (!targetModel.startsWith('local-')) {
    throw new Error(
      `Manifest data_classification_check.approved_for_external_api is false. ` +
      `Model "${targetModel}" is a cloud model. ` +
      `Use a local-* model or verify that context files do not contain internal system data.`
    );
  }
}
```

---

## Privacy and data residency note

**When to use local models (beyond the API key cost case):**

| Condition | Required action |
|-----------|----------------|
| Context files contain internal system names (applications, servers, DBs by real name) | Local model required — these names must not leave the network |
| Context files contain network topology (IP ranges, VPN config, firewall rules) | Local model required |
| Context files contain architecture diagrams referencing live systems | Local model required |
| Input brief mentions real customer account numbers, names, or transaction IDs | Do not run at all — sanitise first |
| Context files reference regulatory findings, internal audit reports, risk registers by name | Local model strongly preferred |
| All context files are generic/synthetic (current skills-repo state) | Cloud model permitted |

In a regulated enterprise environment, the default should be "local model unless explicitly approved" rather than "cloud model unless explicitly prohibited". The `approved_for_external_api` field and harness guard enforce this default.

---

## Compatibility note

Local inference servers must support the OpenAI-compatible `/v1/chat/completions` endpoint:

| Server | Compatibility | Notes |
|--------|--------------|-------|
| Ollama | Native (`/api/chat`) + OpenAI-compatible via `/v1/chat/completions` | Enable with `OLLAMA_HOST` env var or direct endpoint |
| LM Studio | OpenAI-compatible at `localhost:1234` | Set `LOCAL_MODEL_PORT=1234` |
| vLLM | OpenAI-compatible | Use `--api-key` flag if `LOCAL_MODEL_KEY` is set |
| llama.cpp server | OpenAI-compatible | Set `LOCAL_MODEL_PORT` to match `--port` flag |

Run the readiness checklist (`local-model-scaffolding/readiness-checklist.md`) before adding a new local model to any experiment manifest.
