document.addEventListener('DOMContentLoaded', () => {
    const contentDiv = document.getElementById('content');
    const tocNav = document.getElementById('toc');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const resetBtn = document.getElementById('reset-progress');

    // State for completed sections
    let completedSections = JSON.parse(localStorage.getItem('systemDesignProgress')) || {};

    // Load Markdown content
    fetch('content.md')
        .then(response => response.text())
        .then(text => {
            // Configure Marked.js
            marked.setOptions({
                headerIds: false, // We will manually add IDs for custom layout
                gfm: true,
                breaks: true
            });

            const html = marked.parse(text);
            contentDiv.innerHTML = html;

            processContentAndBuildTOC();
            restoreProgress();
        })
        .catch(error => {
            contentDiv.innerHTML = `<p style="color: red;">Failed to load content. Error: ${error.message}</p>`;
        });

    function processContentAndBuildTOC() {
        const headings = contentDiv.querySelectorAll('h1, h2, h3');
        let tocHTML = '<ul>';
        let currentLevel = 1;

        headings.forEach((heading, index) => {
            const level = parseInt(heading.tagName.substring(1));

            // Generate a unique ID if one doesn't exist
            let id = heading.id;
            if (!id) {
                id = heading.textContent.toLowerCase().replace(/[^\w]+/g, '-').replace(/(^-|-$)/g, '');
                // Ensure uniqueness
                let counter = 1;
                let originalId = id;
                while(document.getElementById(id)) {
                    id = `${originalId}-${counter}`;
                    counter++;
                }
                heading.id = id;
            }

            // --- TOC Generation ---
            if (level > currentLevel) {
                tocHTML += '<ul>'.repeat(level - currentLevel);
            } else if (level < currentLevel) {
                tocHTML += '</ul>'.repeat(currentLevel - level);
            }
            currentLevel = level;

            tocHTML += `<li><a href="#${id}" data-id="${id}">${heading.textContent}</a></li>`;

            // --- Progress Tracking Injection ---
            // Only add tracking to h1 and h2 to avoid clutter, or adjust as needed.
            if (level === 1 || level === 2) {
                // Wrap heading and its subsequent content until next heading of same or higher level
                const wrapper = document.createElement('div');
                wrapper.className = 'section-wrapper';
                wrapper.dataset.sectionId = id;

                const headingContainer = document.createElement('div');
                headingContainer.className = 'heading-container';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'done-checkbox';
                checkbox.id = `check-${id}`;
                checkbox.dataset.targetId = id;

                const label = document.createElement('label');
                label.htmlFor = `check-${id}`;
                label.className = 'done-label';
                label.textContent = 'Mark as read';

                // We need to carefully wrap the heading
                heading.parentNode.insertBefore(wrapper, heading);
                headingContainer.appendChild(heading);
                headingContainer.appendChild(checkbox);
                headingContainer.appendChild(label);
                wrapper.appendChild(headingContainer);

                // Group content under this wrapper
                let nextSibling = wrapper.nextSibling;
                while (nextSibling && !['H1', 'H2'].includes(nextSibling.tagName)) {
                    const toMove = nextSibling;
                    nextSibling = nextSibling.nextSibling;
                    wrapper.appendChild(toMove);
                }

                // Add event listener to checkbox
                checkbox.addEventListener('change', (e) => {
                    const isChecked = e.target.checked;
                    completedSections[id] = isChecked;
                    saveProgress();
                    updateSectionVisuals(wrapper, isChecked);
                });
            }
        });

        if (currentLevel > 1) {
            tocHTML += '</ul>'.repeat(currentLevel - 1);
        }
        tocHTML += '</ul>';
        tocNav.innerHTML = tocHTML;

        // Smooth scroll for TOC links
        tocNav.querySelectorAll('a').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                    // Close sidebar on mobile after clicking
                    if (window.innerWidth <= 768) {
                        toggleSidebar();
                    }
                }
            });
        });
    }

    // --- Progress Tracking ---
    function saveProgress() {
        localStorage.setItem('systemDesignProgress', JSON.stringify(completedSections));
    }

    function restoreProgress() {
        Object.keys(completedSections).forEach(id => {
            if (completedSections[id]) {
                const checkbox = document.getElementById(`check-${id}`);
                const wrapper = document.querySelector(`.section-wrapper[data-section-id="${id}"]`);
                if (checkbox) checkbox.checked = true;
                if (wrapper) updateSectionVisuals(wrapper, true);
            }
        });
    }

    function updateSectionVisuals(wrapper, isCompleted) {
        if (isCompleted) {
            wrapper.classList.add('completed');
        } else {
            wrapper.classList.remove('completed');
        }
    }

    resetBtn.addEventListener('click', () => {
        if(confirm('Are you sure you want to reset all your reading progress?')) {
            completedSections = {};
            saveProgress();
            document.querySelectorAll('.done-checkbox').forEach(cb => cb.checked = false);
            document.querySelectorAll('.section-wrapper').forEach(w => w.classList.remove('completed'));
        }
    });


    // --- Smart Header Logic ---
    const header = document.querySelector('.header');
    let lastScrollTop = 0;

    window.addEventListener('scroll', () => {
        let currentScroll = window.pageYOffset || document.documentElement.scrollTop;

        // Prevent negative scrolling from firing on iOS bounce
        if (currentScroll < 0) return;

        if (currentScroll < lastScrollTop && currentScroll > 60) {
            // Scrolling up -> hide header (user requested UX)
            header.classList.add('hidden-scroll');
        } else {
            // Scrolling down -> show header (user requested UX)
            header.classList.remove('hidden-scroll');
        }

        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    }, { passive: true });

    // --- Sidebar Toggle ---
    function toggleSidebar() {
        if (window.innerWidth <= 768) {
            sidebar.classList.toggle('visible');
            sidebarOverlay.classList.toggle('visible');
            sidebar.classList.remove('hidden');
        } else {
            sidebar.classList.toggle('hidden');
        }
    }

    sidebarToggle.addEventListener('click', toggleSidebar);
    sidebarOverlay.addEventListener('click', toggleSidebar);

    // Handle resize events to fix sidebar state
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('visible');
            sidebarOverlay.classList.remove('visible');
            // Keep hidden state if it was toggled hidden on desktop
        } else {
            sidebar.classList.remove('hidden');
        }
    });
});
