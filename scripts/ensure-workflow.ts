/**
 * ensure-workflow.ts
 *
 * Garante que o arquivo .github/workflows/sync-cnx.yml existe no repositório do usuário.
 * O Deploy Button da Vercel não copia a pasta .github ao clonar — este script corrige isso.
 *
 * Roda no prebuild. Se o arquivo não existir, cria via GitHub API.
 * Nunca quebra o build: em caso de erro, sai silenciosamente.
 */

const TEMPLATE_RAW =
  'https://raw.githubusercontent.com/8linksapp-maker/cnx/main/.github/workflows/sync-cnx.yml';

async function main(): Promise<void> {
  const owner = process.env.GITHUB_OWNER?.trim();
  const repo = process.env.GITHUB_REPO?.trim();
  const token = process.env.GITHUB_TOKEN?.trim();

  if (!owner || !repo || !token) {
    // Variáveis não configuradas — não fazer nada
    return;
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
      // Arquivo já existe
      return;
    }

    if (checkRes.status !== 404) {
      console.error('\x1b[31m✗ [X] Erro ao verificar workflow:\x1b[0m', checkRes.status);
      return;
    }

    // Buscar conteúdo do template
    const contentRes = await fetch(TEMPLATE_RAW);
    if (!contentRes.ok) {
      console.error('\x1b[31m✗ [X] Erro ao buscar template:\x1b[0m', contentRes.status);
      return;
    }
    const content = await contentRes.text();

    // Criar o arquivo (base64)
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
        }),
      }
    );

    if (createRes.ok || createRes.status === 201) {
      console.log('✅ Workflow .github/workflows/sync-cnx.yml criado com sucesso.');
      return;
    }

    const errBody = await createRes.text();
    console.error('\x1b[31m✗ [X] Erro ao criar workflow:\x1b[0m', createRes.status, errBody);
  } catch (e) {
    console.error('\x1b[31m✗ [X] Erro no ensure-workflow:\x1b[0m', e);
  }
}

main().finally(() => process.exit(0));
