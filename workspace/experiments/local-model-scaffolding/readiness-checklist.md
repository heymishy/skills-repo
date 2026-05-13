# Local Model Readiness Checklist

**Purpose:** Step-by-step operator checklist to confirm a local model is reachable, responds correctly, and is safe to use in an experiment run. Complete all steps before adding a model to any experiment manifest.

---

## Step 1 — Confirm the inference server is running

Run a basic health check to confirm the server is up and the endpoint is reachable:

```powershell
# PowerShell — replace host and port as needed
Invoke-WebRequest -Uri "http://localhost:3000/v1/models" -UseBasicParsing | Select-Object StatusCode, Content
```

Expected: HTTP 200 with a JSON body listing available models.

If the server is not running, start it:
- **Ollama:** `ollama serve` (model must be pulled first: `ollama pull <model-name>`)
- **LM Studio:** Start the server from the LM Studio UI (Server tab, default port 1234)
- **vLLM:** `python -m vllm.entrypoints.openai.api_server --model <path-to-model> --port 3000`
- **llama.cpp:** `./server -m <model.gguf> --port 3000`

---

## Step 2 — Confirm the model responds to a test prompt

Send a minimal `/v1/chat/completions` request and verify the response parses correctly:

```powershell
$body = @{
  model = "YOUR-MODEL-NAME-HERE"
  messages = @(
    @{ role = "user"; content = "Reply with the word READY and nothing else." }
  )
  max_tokens = 10
  stream = $false
} | ConvertTo-Json -Depth 4

$response = Invoke-RestMethod -Uri "http://localhost:3000/v1/chat/completions" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

Write-Host "Model response: $($response.choices[0].message.content)"
```

Expected: response contains the word `READY`.

If the request fails or the response is malformed, the model is NOT ready for eval use.

---

## Step 3 — Confirm the system prompt field is accepted

Confirm the server correctly handles a separate `system` role message (some local servers treat it differently):

```powershell
$body = @{
  model = "YOUR-MODEL-NAME-HERE"
  messages = @(
    @{ role = "system"; content = "You are a pipeline evaluation assistant. Always respond in valid JSON." }
    @{ role = "user"; content = "Return a JSON object with a single key `status` set to `ok`." }
  )
  max_tokens = 50
  stream = $false
} | ConvertTo-Json -Depth 4

$response = Invoke-RestMethod -Uri "http://localhost:3000/v1/chat/completions" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

Write-Host "System prompt response: $($response.choices[0].message.content)"
```

Expected: JSON object `{"status": "ok"}` or similar. If the model ignores the system prompt instruction (responds in prose instead of JSON), record this — some local models have weak system prompt adherence, which affects skill instruction following. It does not block L1/L2 tier evaluation but should be noted in the model registry.

---

## Step 4 — Set environment variables

Set the environment variables for the sweep run session:

```powershell
$env:LOCAL_MODEL_HOST = "localhost"        # or remote host if applicable
$env:LOCAL_MODEL_PORT = "3000"             # or 1234 for LM Studio, etc.
# $env:LOCAL_MODEL_KEY = "your-key-here"  # only if server requires auth
```

Verify:
```powershell
Write-Host "LOCAL_MODEL_HOST: $env:LOCAL_MODEL_HOST"
Write-Host "LOCAL_MODEL_PORT: $env:LOCAL_MODEL_PORT"
```

---

## Step 5 — Confirm the model ID is registered

The model ID used in the experiment manifest (`local-<name>`) must match what the server accepts. Verify:

```powershell
# List models available on the server
$models = Invoke-RestMethod -Uri "http://localhost:$env:LOCAL_MODEL_PORT/v1/models" -UseBasicParsing
$models.data | Select-Object id
```

Note the exact `id` value from the response. The `local-<name>` manifest ID must use this exact value after the `local-` prefix. Example:
- Server reports model id: `llama3:8b` → manifest ID: `local-llama3:8b`
- Server reports model id: `mistral-7b-v0.2` → manifest ID: `local-mistral-7b-v0.2`

---

## Step 6 — Data classification check

Before any eval run that injects context files (Scenario 2 or 3), complete the data classification check:

| Question | Answer |
|----------|--------|
| Do the context files contain internal system names (real application names, server hostnames, database names)? | [ ] Yes — local model required / [ ] No |
| Do the context files contain network topology (IP ranges, VPN config, firewall rules)? | [ ] Yes — local model required / [ ] No |
| Do the context files contain regulatory findings, audit reports, or risk register items by name? | [ ] Yes — local model strongly preferred / [ ] No |
| Is `approved_for_external_api: true` set in the manifest's `data_classification_check` block? | [ ] Yes — cloud model permitted / [ ] No — local model required |

If any "local model required" box is checked, confirm you are using a `local-*` model ID. Do not proceed with a cloud model.

---

## Step 7 — Run a dry-run sweep cell

Before running the full eval corpus, run a single dry-run cell to confirm the harness can communicate with the model:

```powershell
node scripts/run-model-sweep.js `
  --manifest workspace/experiments/EXP-LOCAL-001/manifest.md `
  --model local-<your-model-name> `
  --case T1 `
  --dry-run
```

Expected: harness reads manifest, constructs request, sends to local endpoint, returns a response with content. No scoring is run in dry-run mode. Confirm there are no HTTP errors or JSON parse failures.

---

## Step 8 — Record in model registry

After completing steps 1–7, add an entry to `workspace/experiments/local-model-scaffolding/model-registry.md`:

```markdown
| Model ID | Server | Host | Port | System prompt support | Step 1–7 passed | Date | Notes |
|----------|--------|------|------|--------------------|-----------------|------|-------|
| local-<name> | Ollama/LM Studio/vLLM/other | localhost | 3000 | Yes/Partial/No | Yes | 2026-xx-xx | |
```

A model without a model registry entry may not be added to any experiment manifest.

---

## Step 9 — Tier evaluation (full corpus run)

If the model will be used in production pipeline routing (not just for experimentation), run the full discovery corpus (T1–T5) through the model and record results. Assign a tier per `capability-tiers.md`.

This step is required before the model appears in a routing policy recommendation. It is optional for experiment-only use (the experiment itself is the tier evaluation).

---

## Checklist sign-off

| Step | Completed | Notes |
|------|-----------|-------|
| 1 — Server running and reachable | [ ] | |
| 2 — Test prompt returns READY | [ ] | |
| 3 — System prompt field accepted | [ ] | |
| 4 — Environment variables set | [ ] | |
| 5 — Model ID confirmed in registry | [ ] | |
| 6 — Data classification check complete | [ ] | |
| 7 — Dry-run sweep cell passed | [ ] | |
| 8 — Model registry entry added | [ ] | |
| 9 — Tier evaluation run (if production use) | [ ] N/A — experiment only | |

Sign off operator: [name] — Date: [date]
