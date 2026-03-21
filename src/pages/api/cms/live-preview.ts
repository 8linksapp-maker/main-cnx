import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
        return new Response('Missing target URL', { status: 400 });
    }

    try {
        const fetchRes = await fetch(targetUrl);
        let htmlContent = await fetchRes.text();

        // 1. Injeta base href e o CDN do Lucide Icons para renderizar ícones dinamicamente
        if (!htmlContent.includes('<base ')) {
            htmlContent = htmlContent.replace('<head>', `<head><base href="${targetUrl}"><script src="https://unpkg.com/lucide@latest"></script>`);
        }

        // 2. Injeta Script de Live Preview com Mini-DOM Reconciler
        const injectScript = `
        <script>
            window.addEventListener('message', (event) => {
                const pd = event.data;
                if (!pd || pd.type !== 'LIVE_PREVIEW' || !pd.data) return;
                const data = pd.data;

                const safeUrl = (url) => {
                    if(!url) return '';
                    if(url.startsWith('blob:') || url.startsWith('http')) return url;
                    return url.startsWith('/') ? url : '/' + url.replace('public/', '');
                };

                const safeIcon = (iconStr, containerDiv, size=24) => {
                    if (!iconStr || !containerDiv) return;
                    let kebab = iconStr.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
                    containerDiv.innerHTML = '<i data-lucide="'+kebab+'" style="width: '+size+'px; height: '+size+'px;"></i>';
                };

                // Mapeamento Invencível por Index e Hashes
                const allSections = Array.from(document.querySelectorAll('section'));

                // --- 1. HERO ---
                if (data.hero) {
                    const heroSec = allSections[0];
                    if (heroSec && data.hero.bgImage) {
                        const heroImg = heroSec.querySelector('img');
                        if (heroImg) heroImg.src = safeUrl(data.hero.bgImage);
                        // Limpa pra n encavalar estilo falso de tentativa passada
                        heroSec.style.backgroundImage = 'none';
                    }

                    const heroTitle = document.querySelector('h1');
                    if (heroTitle) {
                        if (data.hero.title) heroTitle.textContent = data.hero.title;
                        if (data.hero.titleSize) {
                            const mapSz = { 
                              small: ['text-4xl', 'md:text-5xl'], 
                              normal: ['text-5xl', 'md:text-6xl'], 
                              large: ['text-6xl', 'md:text-7xl'], 
                              xlarge: ['text-6xl', 'md:text-8xl'], 
                              giant: ['text-7xl', 'md:text-[7rem]'] 
                            };
                            if (mapSz[data.hero.titleSize]) {
                                // Limpa rigorosamente as classes remanescentes de tamanhos velhos
                                Array.from(heroTitle.classList).forEach(cls => {
                                    if (cls.startsWith('text-') && cls !== 'text-white' && cls !== 'text-transparent') {
                                        heroTitle.classList.remove(cls);
                                    }
                                    if (cls.startsWith('md:text-') || cls.startsWith('lg:text-')) {
                                        heroTitle.classList.remove(cls);
                                    }
                                });
                                // Anexa os novos parâmetros
                                mapSz[data.hero.titleSize].forEach(cls => heroTitle.classList.add(cls));
                            }
                        }
                    }

                    const heroSubtitle = document.querySelector('h1 + p');
                    if (heroSubtitle && data.hero.subtitle) heroSubtitle.textContent = data.hero.subtitle;
                    const heroBtnSpan = document.querySelector('h1 ~ div a span');
                    if (heroBtnSpan && data.hero.btnText) heroBtnSpan.textContent = data.hero.btnText;
                }

                // --- 2. BENEFITS ---
                if (data.benefits) {
                    const benSec = allSections.find(s => s.classList.contains('bg-white') && !s.querySelector('.bg-primary-100')) || allSections[1];
                    if (benSec) {
                        const benTitle = benSec.querySelector('h2');
                        if (benTitle && data.benefits.title) benTitle.textContent = data.benefits.title;
                        
                        const grid = benSec.querySelector('.grid');
                        if (grid && data.benefits.items) {
                            const template = grid.querySelector(':scope > div')?.cloneNode(true) || grid.querySelector('div')?.cloneNode(true);
                            if (template) {
                                grid.innerHTML = '';
                                data.benefits.items.forEach(item => {
                                    const card = template.cloneNode(true);
                                    const h3 = card.querySelector('h3');
                                    const p = card.querySelector('p');
                                    const iconWrap = card.querySelector('.text-primary-600') || card.querySelector('svg')?.parentElement;
                                    
                                    if (h3) h3.textContent = item.title || '';
                                    if (p) p.textContent = item.desc || '';
                                    if (iconWrap && item.icon) safeIcon(item.icon, iconWrap, 32);
                                    grid.appendChild(card);
                                });
                            }
                        }
                    }
                }

                // --- 3. DIFFERENTIATORS ---
                if (data.differentiators) {
                    const diffSec = allSections.find(s => s.classList.contains('bg-slate-50')) || allSections[2];
                    if (diffSec) {
                        const diffTitle = diffSec.querySelector('h2');
                        if (diffTitle && data.differentiators.title) diffTitle.textContent = data.differentiators.title;

                        const diffBadge = diffSec.querySelector('.absolute p.font-bold');
                        if (diffBadge && data.differentiators.badgeText) diffBadge.textContent = data.differentiators.badgeText;

                        const diffImg = diffSec.querySelector('img');
                        if (diffImg && data.differentiators.image) diffImg.src = safeUrl(data.differentiators.image);

                        const container = diffSec.querySelector('.space-y-10');
                        if (container && data.differentiators.items) {
                            const template = container.querySelector(':scope > div')?.cloneNode(true) || container.querySelector('div')?.cloneNode(true);
                            if (template) {
                                container.innerHTML = '';
                                data.differentiators.items.forEach((item, idx) => {
                                    const row = template.cloneNode(true);
                                    const numBadge = row.querySelector('.bg-primary-600');
                                    const h3 = row.querySelector('h3');
                                    const p = row.querySelector('p.text-lg') || row.querySelector('p');
                                    
                                    if (numBadge) numBadge.textContent = '0' + (idx + 1);
                                    if (h3) h3.textContent = item.title || '';
                                    if (p) p.textContent = item.desc || '';
                                    container.appendChild(row);
                                });
                            }
                        }
                    }
                }

                // --- 4. CATEGORIES ---
                if (data.categories) {
                    const catSec = allSections.find(s => s.classList.contains('bg-slate-950') && s.querySelector('.grid')) || allSections[3];
                    if (catSec) {
                        const catTitle = catSec.querySelector('h2');
                        if (catTitle && data.categories.title) catTitle.textContent = data.categories.title;

                        const grid = catSec.querySelector('.grid');
                        if (grid && data.categories.items) {
                            const template = grid.querySelector(':scope > div')?.cloneNode(true) || grid.querySelector('div')?.cloneNode(true);
                            if (template) {
                                grid.innerHTML = '';
                                data.categories.items.forEach((item) => {
                                    const card = template.cloneNode(true);
                                    const h3 = card.querySelector('h3');
                                    const p = card.querySelector('p.text-slate-400') || card.querySelector('p');
                                    const a = card.querySelector('a');
                                    const iconWrap = card.querySelector('.text-primary-400') || card.querySelector('svg')?.parentElement;
                                    
                                    if (h3) h3.textContent = item.title || '';
                                    if (p) p.textContent = item.desc || '';
                                    if (iconWrap && item.icon) safeIcon(item.icon, iconWrap, 28);
                                    if (a) {
                                        a.innerHTML = 'Explorar ' + (item.title || '') + ' <span class="ml-2">→</span>';
                                    }
                                    grid.appendChild(card);
                                });
                            }
                        }
                    }
                }

                // --- 5. ABOUT ---
                if (data.about) {
                    const aboutSec = allSections.find(s => s.querySelector('.bg-primary-100')) || allSections[4];
                    if (aboutSec) {
                        const aboutTitle = aboutSec.querySelector('h2');
                        if (aboutTitle && data.about.title) aboutTitle.textContent = data.about.title;

                        const aboutDesc = aboutSec.querySelector('p.text-xl');
                        if (aboutDesc && data.about.desc) aboutDesc.textContent = data.about.desc;

                        const aboutBadgeTitle = aboutSec.querySelector('.absolute.text-white p.text-2xl');
                        if (aboutBadgeTitle && data.about.badgeTitle) aboutBadgeTitle.textContent = data.about.badgeTitle;
                        
                        const aboutBadgeSub = aboutSec.querySelector('.absolute.text-white p.opacity-80');
                        if (aboutBadgeSub && data.about.badgeSubtitle) aboutBadgeSub.textContent = data.about.badgeSubtitle;

                        const aboutBtn = aboutSec.querySelector('a.bg-slate-900');
                        if (aboutBtn && data.about.btnText) {
                            aboutBtn.innerHTML = data.about.btnText + ' <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right ml-3 group-hover:translate-x-2 transition-transform"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
                        }

                        const aboutImg = aboutSec.querySelector('img');
                        if (aboutImg && data.about.image) aboutImg.src = safeUrl(data.about.image);

                        const gridStats = aboutSec.querySelector('.grid.grid-cols-2');
                        if (gridStats && data.about.stats) {
                            const templateStat = gridStats.querySelector(':scope > div')?.cloneNode(true) || gridStats.querySelector('div')?.cloneNode(true);
                            if (templateStat) {
                                gridStats.innerHTML = '';
                                data.about.stats.forEach(stat => {
                                    const statDiv = templateStat.cloneNode(true);
                                    const pVal = statDiv.querySelector('p.text-4xl');
                                    const pLabel = statDiv.querySelector('p.text-slate-500');
                                    if (pVal) pVal.textContent = stat.value || '';
                                    if (pLabel) pLabel.textContent = stat.label || '';
                                    gridStats.appendChild(statDiv);
                                });
                            }
                        }
                    }
                }
                
                // Reprocessa todos os recem-anexados SVG (Render Cycle Sincrono)
                if (window.lucide) {
                    try { window.lucide.createIcons(); } catch(e) {}
                }
            });
        </script>
        `;

        htmlContent = htmlContent.replace('</body>', `${injectScript}</body>`);

        return new Response(htmlContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'X-Frame-Options': 'ALLOWALL',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Content-Security-Policy': "frame-ancestors *"
            }
        });
    } catch (err: any) {
        console.error('Error fetching URL for live preview:', err);
        return new Response('Error loading live preview proxy: ' + err.message, { status: 500 });
    }
};
