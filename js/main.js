// Initialize Mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose'
});

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('markdown-container');
    const navLinks = document.querySelectorAll('.nav-links a');
    const themeToggle = document.getElementById('theme-toggle');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');

    // Theme handling
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        if (theme === 'dark') {
            icon.classList.replace('fa-moon', 'fa-sun');
        } else {
            icon.classList.replace('fa-sun', 'fa-moon');
        }
    }

    // Mobile menu handling
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 &&
            !sidebar.contains(e.target) &&
            !mobileMenuBtn.contains(e.target) &&
            sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    });

    // Custom renderer for Marked.js to handle Mermaid code blocks
    const renderer = new marked.Renderer();
    const originalCodeRenderer = renderer.code.bind(renderer);

    renderer.code = function(code, language, isEscaped) {
        if (language === 'mermaid') {
            return `<div class="mermaid">${code}</div>`;
        }
        return originalCodeRenderer(code, language, isEscaped);
    };

    marked.setOptions({
        renderer: renderer,
        highlight: function(code, lang) {
            if (lang && lang !== 'mermaid' && hljs.getLanguage(lang)) {
                return hljs.highlight(code, { language: lang }).value;
            }
            return hljs.highlightAuto(code).value;
        },
        breaks: true,
        gfm: true
    });

    // Load Markdown file
    async function loadModule(moduleId) {
        try {
            container.innerHTML = '<div class="loading">Loading content...</div>';

            const response = await fetch(`content/${moduleId}.md`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const markdown = await response.text();
            container.innerHTML = marked.parse(markdown);

            // Re-initialize mermaid for new diagrams
            try {
                await mermaid.run();
            } catch (err) {
                console.error("Mermaid parsing error:", err);
            }

            // Close mobile sidebar if open
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
            }

        } catch (error) {
            console.error('Error loading module:', error);
            container.innerHTML = `
                <div style="color: #dc3545; padding: 20px; background: rgba(220, 53, 69, 0.1); border-radius: 8px;">
                    <h3>Error Loading Content</h3>
                    <p>Could not load the module content. If running locally via file://, CORS policies might block fetch requests.
                    Try running a simple local server (e.g., python -m http.server).</p>
                    <p>Error details: ${error.message}</p>
                </div>
            `;
        }
    }

    // Navigation handling
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.currentTarget.getAttribute('data-target');

            // Update active state
            navLinks.forEach(l => l.classList.remove('active'));
            e.currentTarget.classList.add('active');

            // Load content
            loadModule(target);
        });
    });

    // Initial load
    loadModule('module1');
});