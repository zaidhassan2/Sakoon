"""Development-only: python with tiktoken installed; no application dependency.
GPT-OSS tokenizer source: https://github.com/openai/gpt-oss/blob/main/gpt_oss/tokenizer.py
"""
import hashlib
import json
import subprocess
import tiktoken

prompt = subprocess.check_output([
    'node', '--input-type=module', '-e',
    "import {systemPrompt} from './lib/modules/stress.js'; process.stdout.write(systemPrompt)"
], text=True)
encoding = tiktoken.get_encoding('o200k_harmony')
cumulative = '\nEarlier in this conversation the user showed crisis signals; stay in careful, warm check-in mode.'
print(json.dumps({
    'encoding': encoding.name,
    'systemPromptTokens': len(encoding.encode(prompt)),
    'withCumulativeSafetyTokens': len(encoding.encode(prompt + cumulative)),
    'characters': len(prompt),
    'sha256': hashlib.sha256(prompt.encode()).hexdigest()
}, indent=2))
