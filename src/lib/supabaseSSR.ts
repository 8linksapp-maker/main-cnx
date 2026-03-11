import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'

export function supabaseSSR(context: any) {
    return createServerClient(
        import.meta.env.PUBLIC_SUPABASE_URL,
        import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    const parsed = parseCookieHeader(context.request.headers.get('Cookie') ?? '')
                    return parsed.map(c => ({ name: c.name, value: c.value || '' }))
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        context.cookies.set(name, value, options as any)
                    )
                },
            },
        }
    )
}
