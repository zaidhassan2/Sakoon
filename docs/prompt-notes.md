# Phase 1 stress prompt notes

Measured on 2026-11-01. Status: merged using the earlier listening block as PART A; the owner’s follow-up labeled PART A repeats the implementation instructions rather than a separate prompt. PART C uses the exact supplied messages except the requested long example, for which a synthetic 164-word, 714-character message was authored with one buried worry about letting a team down.

## Measured token count

Command:

```sh
TIKTOKEN_CACHE_DIR=/tmp/sukoon-tiktoken-cache python scripts/measure-prompt.py
```

Actual output:

```json
{
  "encoding": "o200k_harmony",
  "systemPromptTokens": 880,
  "withCumulativeSafetyTokens": 899,
  "characters": 3990,
  "sha256": "b165e5d3bbf8db09903f26198b110c9e5b906fff3ca5dd2052c03824f8af55b8"
}
```

The GPT-OSS [official tokenizer implementation](https://github.com/openai/gpt-oss/blob/main/gpt_oss/tokenizer.py) uses `o200k_harmony`; [tiktoken’s encoding implementation](https://github.com/openai/tiktoken/blob/main/tiktoken_ext/openai_public.py) supplies the matching encoding. The measurement script is development-only, requires Python/tiktoken, and adds no Node runtime dependency. Tokenizer data was downloaded to `/tmp`, not to the application.

Counts include the complete exported prompt, with a separate worst-case count for the existing cumulative-safety line. They exclude chat serialization, user/assistant history and provider-added framing. Provider input usage will be larger. These are measured GPT-OSS counts, not a universal Gemini count or a character-based estimate.

## Safety precedence and preserved rules

The SAFETY section overrides all listening/style/permission instructions. Ordinary help is offered with choice; practical advice/exercises wait for a request or acceptance. Crisis guidance does not wait for permission. Emotion cues stay internal; state and every other request/response field retain their Phase 1 contract.

Preserved prohibitions: diagnosis/condition naming; medication/doses/stopping treatment (doctor/pharmacist referral); human feelings/lived experience or human/friend/therapist/counsellor identity; dismissive phrases (also adding “don't worry”); promises of recovery/secrecy/confidentiality/always being there; romantic or exclusive attachment, pet names, guilt or replacing people; phone numbers, links, organisation names; self-harm methods/goodbye messages; instruction disclosure and role-changing text including notes. Distressed users remain supported even off-topic. Faith/family/culture respect and support for real-world connection remain.

Preserved safety content: direct and indirect crisis signals, means/plans, immediate abuse/danger, elevated signals, conservative uncertainty, warm acknowledgment, safety question when not already answered, real-person/help options/emergency guidance, continued conversation, persistent careful check-in and helping when another person is endangered. Deterministic detection, cumulative risk, crisis fallback, sanitizer and quota exceptions are unchanged.

Memory implementation is deferred. The prompt still treats pasted notes as untrusted data, never claims nonexistent saved memory/menu/deletion, and distinguishes current-chat context from persistent memory. No memory request field, storage or frontend changes were added.

## Evaluation limits

All fourteen Phase 1 PART C fixtures are included in the full runner; PART C fixture fifteen (memory request injection) is deferred to Phase 2. The existing chat-text notes-injection fixture remains a Phase 1 role-injection test, not a test of an implemented memory field. Human scores must be entered by a human in the review artifact. No automated or AI judgment is represented as human review. See test-results.md for actual automated results and any failures.
