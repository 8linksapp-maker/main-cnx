/**
 * ensure-workflow-core.ts
 *
 * Lógica compartilhada para garantir que .github/workflows/sync-cnx.yml existe
 * no repositório do usuário. Usado pelo prebuild e pela API do painel.
 *
 * O Deploy Button da Vercel não copia .github ao clonar — esta função corrige isso.
 */

const TEMPLATE_RAW =
  'https://raw.githubusercontent.com/8linksapp-maker/cnx/main/.github/workflows/sync-cnx.yml';

export type EnsureWorkflowResult =
  | { ok: true; status: 'already_exists' }
  | { ok: true; status: 'created' }
  | { ok: false; error: string };

export async function ensureWorkflow(): Promise<EnsureWorkflowResult> {
  const owner = process.env.GITHUB_OWNER?.trim();
  const repo = process.env.GITHUB_REPO?.trim();
  const token = process.env.GITHUB_TOKEN?.trim();
  const branch = process.env.GITHUB_BRANCH?.trim() || 'main';

  if (!owner || !repo || !token) {
    return {
      ok: false,
      error: 'Configure GITHUB_TOKEN, GITHUB_OWNER e GITHUB_REPO nas variáveis de ambiente da Vercel.',
    };
  }

  try {
    const checkRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/.github/workflows/sync-cnx.yml`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    if (checkRes.ok) {
      return { ok: true, status: 'already_exists' };
    }

    if (checkRes.status !== 404) {
      const errBody = await checkRes.text();
      console.error('\x1b[31m✗ [X] Erro ao verificar workflow:\x1b[0m', checkRes.status, errBody);
      return {
        ok: false,
        error: `GitHub retornou ${checkRes.status}. Verifique o token e as permissões do repositório.`,
      };
    }

    const contentRes = await fetch(TEMPLATE_RAW);
    if (!contentRes.ok) {
      console.error('\x1b[31m✗ [X] Erro ao buscar template:\x1b[0m', contentRes.status);
      return {
        ok: false,
        error: 'Não foi possível baixar o template do workflow.',
      };
    }
    const content = await contentRes.text();

    const encoded = Buffer.from(content, 'utf-8').toString('base64');
    const createRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/.github/workflows/sync-cnx.yml`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'chore: adicionar workflow de atualização CNX',
          content: encoded,
          branch,
        }),
      }
    );

    if (createRes.ok || createRes.status === 201) {
      return { ok: true, status: 'created' };
    }

    const errBody = await createRes.text();
    console.error('\x1b[31m✗ [X] Erro ao criar workflow:\x1b[0m', createRes.status, errBody);

    let errorMsg = `GitHub retornou ${createRes.status}.`;
    try {
      const parsed = JSON.parse(errBody) as { message?: string };
      if (parsed?.message) errorMsg += ` ${parsed.message}`;
    } catch {}
    return { ok: false, error: errorMsg };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('\x1b[31m✗ [X] Erro no ensure-workflow:\x1b[0m', e);
    return { ok: false, error: msg };
  }
}
