export const runtime = 'edge';

export async function POST(request: Request) {
  const { code, target, language } = await request.json();

  if (!code || !target) {
    return new Response(JSON.stringify({ error: 'Missing code or target' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing API key' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const systemPrompt = `You are an expert code migration assistant. The user will provide code and a migration target. Respond with EXACTLY this format:
<migrated>
[the complete migrated code, nothing else]
</migrated>
<explanation>
[Step-by-step explanation of changes made, using numbered list. Be specific about what changed and why.]
</explanation>`;

  const userPrompt = `Language: ${language}
Migration target: ${target}

Code to migrate:
\`\`\`
${code}
\`\`\``;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 4096,
      stream: true,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return new Response(JSON.stringify({ error: `Anthropic API error: ${error}` }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Pass through the SSE stream directly
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const transformStream = new TransformStream({
    async transform(chunk, controller) {
      const text = decoder.decode(chunk, { stream: true });
      const lines = text.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`)
              );
            }
          } catch {
            // Skip non-JSON lines
          }
        }
      }
    },
  });

  return new Response(response.body!.pipeThrough(transformStream), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
