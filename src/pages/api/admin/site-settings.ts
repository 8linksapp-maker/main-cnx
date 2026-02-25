/**
 * api/admin/site-settings.ts
 *
 * Endpoint para leitura e atualização das configurações globais do site
 * armazenadas em src/content/singletons/settings.yaml.
 *
 * GET  /api/admin/site-settings → retorna configurações atuais
 * PUT  /api/admin/site-settings → atualiza configurações (colorScheme, siteName, etc.)
 */

import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import { isGitHubConfigured, githubWriteFile, githubReadFile } from '../../../utils/github-api';

const SETTINGS_PATH     = path.resolve('./src/content/singletons/settings.yaml');
const SETTINGS_GH_PATH  = 'src/content/singletons/settings.yaml';

async function readSettings(): Promise<Record<string, unknown>> {
    try {
        if (isGitHubConfigured()) {
            const file = await githubReadFile(SETTINGS_GH_PATH);
            if (file) return (yaml.load(file.content) as Record<string, unknown>) || {};
        }
        const content = await fs.readFile(SETTINGS_PATH, 'utf-8');
        return (yaml.load(content) as Record<string, unknown>) || {};
    } catch {
        return { activeTheme: 'classic', siteName: 'CNX Agency', colorScheme: 'dark' };
    }
}

async function writeSettings(data: Record<string, unknown>): Promise<boolean> {
    const content = yaml.dump(data, { lineWidth: -1, noRefs: true, quotingType: '"' });
    if (isGitHubConfigured()) {
        return githubWriteFile(SETTINGS_GH_PATH, content, 'content: update site settings');
    }
    await fs.writeFile(SETTINGS_PATH, content, 'utf-8');
    return true;
}

export const GET: APIRoute = async () => {
    try {
        const data = await readSettings();
        return new Response(JSON.stringify({ success: true, data }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('❌ Erro ao ler site-settings:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

export const PUT: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const current = await readSettings();
        const updated = { ...current, ...body };

        const ok = await writeSettings(updated);
        if (!ok) {
            return new Response(JSON.stringify({ success: false, error: 'Erro ao salvar configurações' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ success: true, data: updated }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('❌ Erro ao atualizar site-settings:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
