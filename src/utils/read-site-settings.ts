export async function readSiteSettings(): Promise<any> {
    return {
        siteName: 'Main Astro',
        canonicalUrl: '',
        generateSitemap: true,
        generateRobots: true,
        robotsDisallow: ['/dashboard', '/api']
    };
}
