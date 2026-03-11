/// <reference types="astro/client" />

declare namespace App {
    interface Locals {
        user?: {
            slug: string;
            name: string;
            adminRole: 'admin' | 'editor';
        };
        saasUser?: any; // Objeto de contexto do usuário Supabase Auth (SaaS)
    }
}
