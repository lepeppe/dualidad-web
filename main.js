// --- NAVBAR SLIDING BUBBLE / SCROLLSPY ---
const navBubble = document.getElementById('nav-bubble');
const navLinksContainer = document.getElementById('nav-links');
const navLinks = document.querySelectorAll('.nav-links .nav-link');
const sections = document.querySelectorAll('section[id]');

let activeNavLink = document.querySelector('.nav-links .nav-link.active') || navLinks[0];

function updateBubblePosition(targetLink) {
    if (!navBubble || !targetLink || !navLinksContainer) return;
    const linkRect = targetLink.getBoundingClientRect();
    const containerRect = navLinksContainer.getBoundingClientRect();
    
    const left = linkRect.left - containerRect.left;
    const width = linkRect.width;
    
    navBubble.style.left = `${left}px`;
    navBubble.style.width = `${width}px`;
    navBubble.style.opacity = '1';
}

// Initial positioning and on window resize
function initNavBubble() {
    if (activeNavLink) updateBubblePosition(activeNavLink);
}

window.addEventListener('DOMContentLoaded', initNavBubble);
window.addEventListener('load', initNavBubble);
window.addEventListener('resize', () => {
    if (activeNavLink) updateBubblePosition(activeNavLink);
});

let hoverScrollTimer = null;
let isProgrammaticScrolling = false;

// Hover navigation: simply hovering moves the bubble and immediately scrolls to that section
navLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
        if (hoverScrollTimer) clearTimeout(hoverScrollTimer);
        
        // Visually update bubble position and active state
        updateBubblePosition(link);
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        activeNavLink = link;
        
        // Immediately navigate / scroll to the hovered section
        const targetId = link.getAttribute('href');
        if (targetId && targetId.startsWith('#')) {
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const currentY = window.pageYOffset || document.documentElement.scrollTop;
                const targetY = targetElement.offsetTop;
                const dir = targetY >= currentY ? 'down' : 'up';
                scrollDirection = dir;
                targetElement.dataset.cascadeDir = dir;
                if (typeof triggerSectionCascade === 'function') {
                    triggerSectionCascade(targetElement, dir);
                }
                
                isProgrammaticScrolling = true;
                targetElement.scrollIntoView({ behavior: 'smooth' });
                
                // Keep programmatic lock until smooth scroll completes
                hoverScrollTimer = setTimeout(() => {
                    isProgrammaticScrolling = false;
                }, 750);
            }
        }
    });
    
    // Smooth scroll if clicked anyway
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        if (targetId && targetId.startsWith('#')) {
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                isProgrammaticScrolling = true;
                targetElement.scrollIntoView({ behavior: 'smooth' });
                setTimeout(() => { isProgrammaticScrolling = false; }, 750);
            }
        }
    });
});

// Return to active section when mouse leaves nav bar
if (navLinksContainer) {
    navLinksContainer.addEventListener('mouseleave', () => {
        if (!isProgrammaticScrolling && activeNavLink) {
            updateBubblePosition(activeNavLink);
        }
    });
}

// Scrollspy: update active link and move bubble as user scrolls through sections
window.addEventListener('scroll', () => {
    if (isProgrammaticScrolling) return; // Prevent bubble flickering during hover-triggered scroll
    
    const scrollPosition = window.scrollY + 220;
    
    let currentSectionId = '';
    sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        if (scrollPosition >= top && scrollPosition < top + height) {
            currentSectionId = section.getAttribute('id');
        }
    });
    
    if (currentSectionId) {
        const matchingLink = document.querySelector(`.nav-links .nav-link[href="#${currentSectionId}"]`);
        if (matchingLink && matchingLink !== activeNavLink) {
            navLinks.forEach(l => l.classList.remove('active'));
            matchingLink.classList.add('active');
            activeNavLink = matchingLink;
            updateBubblePosition(matchingLink);
        }
    }
});

// --- 3D TILT EFFECT ---
const tiltCards = document.querySelectorAll('.tilt-card');

tiltCards.forEach(card => {
    card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left; // x position within the element.
        const y = e.clientY - rect.top;  // y position within the element.
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -10; // Max rotation 10deg
        const rotateY = ((x - centerX) / centerX) * 10;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = `perspective(1000px) rotateX(0) rotateY(0)`;
        card.style.transition = `transform 0.5s ease`;
        setTimeout(() => card.style.transition = '', 500); // Remove transition after reset to prevent lag on mouseenter
    });
});

// --- DYNAMIC CONTACT FORM ---
const clientTypeSelect = document.getElementById('client-type');
const dynamicFields = document.querySelectorAll('.dynamic-field');

if(clientTypeSelect) {
    clientTypeSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        dynamicFields.forEach(field => field.classList.remove('active'));
        const activeField = document.getElementById(`dynamic-${val}`);
        if(activeField) activeField.classList.add('active');
    });
}

// --- PORTFOLIO FILTERING WITH FLIP PHYSICS ---
const filterBtns = document.querySelectorAll('.filter-btn');
const portfolioItems = document.querySelectorAll('.portfolio-item');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active class
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filter = btn.dataset.filter;
        
        portfolioItems.forEach(item => {
            // Remove previous animation classes
            item.classList.remove('flip-in');
            
            // Wait a tiny bit to trigger reflow, then apply display logic
            if(filter === 'all' || item.dataset.category === filter) {
                item.classList.remove('hide-item');
                // Force reflow
                void item.offsetWidth;
                item.classList.add('flip-in');
            } else {
                item.classList.add('hide-item');
            }
        });
    });
});

// --- ADMIN CMS MODAL ---
const btnAdmin = document.getElementById('btn-admin');
const adminModal = document.getElementById('admin-modal');
const closeAdmin = document.getElementById('close-admin');

if(btnAdmin && adminModal && closeAdmin) {
    btnAdmin.addEventListener('click', () => {
        adminModal.classList.add('active');
    });
    
    closeAdmin.addEventListener('click', () => {
        adminModal.classList.remove('active');
    });
    
    // Close on click outside
    adminModal.addEventListener('click', (e) => {
        if(e.target === adminModal) adminModal.classList.remove('active');
    });
}

// --- LANGUAGE SWITCHER DICTIONARY ---
const translations = {
    es: {
        nav_home: "Inicio", nav_b2b: "Marcas (B2B)", nav_b2c: "Sociales (B2C)", 
        nav_academy: "Academia", nav_portfolio: "Portafolio", nav_blog: "Blog", nav_contact: "Contacto",
        nav_admin: "Admin CMS",
        hero_title: "Creamos Impacto Visual", hero_subtitle: "Estrategia, arte y tecnología en un solo lugar.",
        hero_reel: "Reel Dinámico (Showcase Video)",
        router_b2b: "🏢 Soluciones para Marcas y Empresas", router_b2c: "🥂 Eventos Sociales y Lifestyle", router_academy: "🎓 Academia Dualidad",
        b2b_title: "Soluciones Corporativas y Comerciales", b2b_desc: "Para clientes de alto perfil que valoran la especialización y las características técnicas.",
        b2b_serv1_title: "Filmmaking y Fotografía", b2b_serv1_desc: "Dirección de arte, sesiones de producto y corporativo con equipos de alta gama (cámaras full frame, DJI).",
        b2b_serv2_title: "Marketing Estratégico", b2b_serv2_desc: "Planificación de campañas y psicología del consumidor para redes y medios tradicionales.",
        b2b_serv3_title: "Desarrollo Web y Apps", b2b_serv3_desc: "Programación a medida y arquitecturas ultrarrápidas con Vercel y GitHub.",
        b2b_serv4_title: "Producción de Audio", b2b_serv4_desc: "Locución comercial y diseño sonoro para spots publicitarios.",
        b2c_title: "Eventos Sociales y Lifestyle", b2c_desc: "Enfocados al 100% en capturar la emoción y el momento perfecto.",
        b2c_serv1_title: "Bodas y Quince Años", b2c_serv1_desc: "Cobertura audiovisual completa, desde la preproducción hasta el material final.",
        b2c_serv2_title: "Edición y Animación", b2c_serv2_desc: "Álbumes digitales, invitaciones animadas optimizadas para WhatsApp y gráficos en movimiento.",
        academy_title: "Academia Dualidad", academy_desc: "Ecosistema educativo estructurado para formar creadores integrales.",
        academy_school1: "Escuela de Fotografía", academy_list1: "<li>Técnica y óptica (ISO, Apertura, Velocidad).</li><li>Iluminación de estudio y exteriores.</li><li>Dirección de modelos.</li>",
        academy_school2: "Escuela de Filmmaking", academy_list2: "<li>Preproducción y guion.</li><li>Estabilización y movimiento.</li><li>Flujo de trabajo Adobe.</li>",
        academy_school3: "Escuela de Marketing", academy_list3: "<li>Psicología del consumidor.</li><li>Campañas en redes sociales.</li>",
        academy_sim_title: "Herramienta de Apoyo: Simulador Óptico", academy_sim_desc: "Practica en tiempo real la exposición y el triángulo fotográfico.",
        academy_sim_btn: "Abrir Simulador Completo",
        portfolio_title: "Portafolio Dinámico", portfolio_desc: "Explora nuestros mejores trabajos.",
        filter_all: "Todos", filter_com: "Comerciales", filter_hot: "Hoteles", filter_wed: "Bodas", filter_web: "Webs",
        blog_title: "Blog & Noticias", blog_desc: "Novedades, tips y artículos del sector audiovisual.", blog_read: "Leer más →",
        contact_title: "Contacto Inteligente", contact_desc: "Cuéntanos sobre tu proyecto o interés.",
        contact_type: "¿Qué tipo de cliente eres?", opt_empresa: "Empresa / Marca", opt_evento: "Evento Social", opt_alumno: "Alumno / Academia",
        contact_name: "Nombre completo", contact_rubro: "Rubro de la empresa", contact_obj: "Objetivo de la campaña",
        contact_date: "Fecha del evento", contact_loc: "Locación principal", contact_mod: "Módulo de interés", contact_btn: "Enviar Mensaje",
        admin_title: "Panel de Administración CMS", admin_desc: "Aquí podrás gestionar las galerías, añadir nuevos proyectos y redactar artículos del blog de forma dinámica."
    },
    en: {
        nav_home: "Home", nav_b2b: "Brands (B2B)", nav_b2c: "Social (B2C)", 
        nav_academy: "Academy", nav_portfolio: "Portfolio", nav_blog: "Blog", nav_contact: "Contact",
        nav_admin: "Admin CMS",
        hero_title: "Creating Visual Impact", hero_subtitle: "Strategy, art, and technology in one place.",
        hero_reel: "Dynamic Reel (Showcase Video)",
        router_b2b: "🏢 Brand & Corporate Solutions", router_b2c: "🥂 Social Events & Lifestyle", router_academy: "🎓 Dualidad Academy",
        b2b_title: "Corporate & Commercial Solutions", b2b_desc: "For high-profile clients who value specialization and technical features.",
        b2b_serv1_title: "Filmmaking & Photography", b2b_serv1_desc: "Art direction, product sessions, and corporate shoots with high-end gear (Full Frame, DJI).",
        b2b_serv2_title: "Strategic Marketing", b2b_serv2_desc: "Campaign planning and consumer psychology for social and traditional media.",
        b2b_serv3_title: "Web & App Development", b2b_serv3_desc: "Custom programming and ultra-fast architectures with Vercel and GitHub.",
        b2b_serv4_title: "Audio Production", b2b_serv4_desc: "Commercial voiceovers and sound design for advertising spots.",
        b2c_title: "Social Events & Lifestyle", b2c_desc: "100% focused on capturing emotion and the perfect moment.",
        b2c_serv1_title: "Weddings & Sweet Fifteens", b2c_serv1_desc: "Complete audiovisual coverage, from pre-production to the final material.",
        b2c_serv2_title: "Editing & Animation", b2c_serv2_desc: "Digital albums, animated WhatsApp invitations, and motion graphics.",
        academy_title: "Dualidad Academy", academy_desc: "Structured educational ecosystem to form well-rounded creators.",
        academy_school1: "School of Photography", academy_list1: "<li>Technique & optics (ISO, Aperture, Shutter).</li><li>Studio & outdoor lighting.</li><li>Model direction.</li>",
        academy_school2: "School of Filmmaking", academy_list2: "<li>Pre-production & script.</li><li>Stabilization & movement.</li><li>Adobe workflow.</li>",
        academy_school3: "School of Marketing", academy_list3: "<li>Consumer psychology.</li><li>Social media campaigns.</li>",
        academy_sim_title: "Support Tool: Optical Simulator", academy_sim_desc: "Practice exposure and the exposure triangle in real time.",
        academy_sim_btn: "Open Full Simulator",
        portfolio_title: "Dynamic Portfolio", portfolio_desc: "Explore our best works.",
        filter_all: "All", filter_com: "Commercials", filter_hot: "Hotels", filter_wed: "Weddings", filter_web: "Webs",
        blog_title: "Blog & News", blog_desc: "Updates, tips, and articles from the audiovisual sector.", blog_read: "Read more →",
        contact_title: "Smart Contact", contact_desc: "Tell us about your project or interest.",
        contact_type: "What type of client are you?", opt_empresa: "Company / Brand", opt_evento: "Social Event", opt_alumno: "Student / Academy",
        contact_name: "Full Name", contact_rubro: "Company Industry", contact_obj: "Campaign Objective",
        contact_date: "Event Date", contact_loc: "Main Location", contact_mod: "Module of Interest", contact_btn: "Send Message",
        admin_title: "Admin CMS Panel", admin_desc: "Here you can manage galleries, add new projects, and write blog articles dynamically."
    }
};

let currentLang = 'es';
const langBtn = document.getElementById('lang-switch');

if(langBtn) {
    langBtn.addEventListener('click', () => {
        currentLang = currentLang === 'es' ? 'en' : 'es';
        langBtn.innerText = currentLang === 'es' ? 'EN' : 'ES';
        
        // Update all elements with data-lang attribute
        document.querySelectorAll('[data-lang]').forEach(el => {
            const key = el.getAttribute('data-lang');
            if(translations[currentLang][key]) {
                // Check if element is ul to set innerHTML, else innerText
                if(el.tagName === 'UL') {
                    el.innerHTML = translations[currentLang][key];
                } else {
                    el.innerText = translations[currentLang][key];
                }
            }
        });
    });
}

// --- CONTINUOUS BIDIRECTIONAL WATERFALL CASCADE ENGINE ---
let lastScrollY = window.pageYOffset || document.documentElement.scrollTop;
let scrollDirection = 'down';

function triggerSectionCascade(section, direction) {
    if (!section) return;
    const items = section.querySelectorAll('.cascade-item');
    if (!items.length) return;

    const hideClass = direction === 'down' ? 'cascade-hidden-bottom' : 'cascade-hidden-top';
    const removeClass = direction === 'down' ? 'cascade-hidden-top' : 'cascade-hidden-bottom';

    // 1. Immediately reset items to starting position without transition
    items.forEach((item) => {
        item.style.transition = 'none';
        item.classList.remove('cascade-visible', removeClass);
        item.classList.add(hideClass);
    });

    // 2. Force browser reflow
    void section.offsetHeight;

    // 3. Staggered waterfall cascade into place
    items.forEach((item, index) => {
        const delay = Math.min(index * 0.12, 0.6);
        item.style.transition = `transform 0.85s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`;
        item.classList.remove(hideClass);
        item.classList.add('cascade-visible');
    });
}

function initWaterfallCascade() {
    const targets = document.querySelectorAll(`
        .hero-content h1,
        .hero-content p,
        .video-reel-container,
        .router-buttons > *,
        .section-header,
        .grid-cards > *,
        .academy-text > *,
        .academy-simulator,
        .portfolio-filters,
        .portfolio-grid > *,
        .contact-container
    `);

    // Assign stagger indices based on sibling position in parent container
    targets.forEach(el => {
        el.classList.add('cascade-item');

        const parent = el.parentElement;
        let index = 0;
        if (parent) {
            const siblings = Array.from(parent.children).filter(c => c.classList.contains('cascade-item'));
            index = siblings.indexOf(el);
            if (index < 0) index = 0;
        }
        el.dataset.cascadeIndex = index;

        // Initial setup on page load
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            // Visible on initial screen (e.g. Hero section)
            el.classList.add('cascade-hidden-bottom');
            const delay = Math.min(index * 0.12, 0.48);
            setTimeout(() => {
                el.style.transitionDelay = `${delay}s`;
                el.classList.remove('cascade-hidden-bottom');
                el.classList.add('cascade-visible');
            }, 60);
        } else if (rect.top >= window.innerHeight) {
            // Below the initial screen: primed to cascade from bottom when scrolling down
            el.classList.add('cascade-hidden-bottom');
        } else {
            // Above the initial screen: primed to cascade from top when scrolling up
            el.classList.add('cascade-hidden-top');
        }
    });

    // Continuous scroll direction tracker
    window.addEventListener('scroll', () => {
        const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
        if (Math.abs(currentScrollY - lastScrollY) > 2) {
            scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up';
            lastScrollY = currentScrollY;
        }
    }, { passive: true });

    // Observer that fires for every card / block as you scroll up or down
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const el = entry.target;
            const index = parseInt(el.dataset.cascadeIndex || '0', 10);
            const delay = Math.min(index * 0.12, 0.48);

            if (entry.isIntersecting) {
                // Element is entering the screen: cascade smoothly into place!
                el.style.transitionDelay = `${delay}s`;
                el.classList.remove('cascade-hidden-bottom', 'cascade-hidden-top');
                el.classList.add('cascade-visible');
            } else {
                // Element exited the screen: re-prime so it animates AGAIN when scrolling back
                el.style.transitionDelay = '0s';
                el.classList.remove('cascade-visible');

                const rect = entry.boundingClientRect;
                if (rect.bottom < 0) {
                    // Exited above screen: primed to drop down from top when scrolling UP
                    el.classList.remove('cascade-hidden-bottom');
                    el.classList.add('cascade-hidden-top');
                } else if (rect.top > window.innerHeight) {
                    // Exited below screen: primed to rise up from bottom when scrolling DOWN
                    el.classList.remove('cascade-hidden-top');
                    el.classList.add('cascade-hidden-bottom');
                }
            }
        });
    }, {
        threshold: 0.08,
        rootMargin: '10px 0px 10px 0px'
    });

    targets.forEach(el => observer.observe(el));
}

window.addEventListener('DOMContentLoaded', initWaterfallCascade);
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initWaterfallCascade();
}
