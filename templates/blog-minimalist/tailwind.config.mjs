/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: 'rgb(var(--color-primary) / 0.05)',
                    100: 'rgb(var(--color-primary) / 0.1)',
                    200: 'rgb(var(--color-primary) / 0.2)',
                    500: 'rgb(var(--color-primary))',
                    600: 'rgb(var(--color-primary-dark))',
                    700: 'rgb(var(--color-primary-dark) / 0.8)',
                },
                accent: {
                    50: 'rgb(var(--color-accent) / 0.05)',
                    100: 'rgb(var(--color-accent) / 0.1)',
                    200: 'rgb(var(--color-accent) / 0.2)',
                    500: 'rgb(var(--color-accent))',
                    600: 'rgb(var(--color-accent) / 0.9)',
                    700: 'rgb(var(--color-accent) / 0.8)',
                }
            },
            fontFamily: {
                sans: ['Outfit', 'Inter', 'sans-serif'],
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
