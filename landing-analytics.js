(() => {
    'use strict';

    if (window.EnglishDreamLandingAnalytics) return;
    window.EnglishDreamLandingAnalytics = true;

    const initLandingAnalytics = () => {
        const featureItems = [...document.querySelectorAll('#features .feature-item')];
        const checkpointDefinitions = [
            { name: 'home', group: 'hero', element: document.getElementById('home') },
            { name: 'features_intro', group: 'features', element: document.querySelector('#features .section-header') },
            ...featureItems.map((element, index) => ({
                name: `feature_${String(index + 1).padStart(2, '0')}`,
                group: 'features',
                element
            })),
            { name: 'dual_teacher_system', group: 'learning_system', element: document.getElementById('dual-teacher-system') },
            { name: 'cost_efficiency', group: 'value', element: document.getElementById('cost-efficiency') },
            { name: 'testimonials', group: 'social_proof', element: document.getElementById('testimonial-video') },
            { name: 'reservation', group: 'conversion', element: document.getElementById('reservation') }
        ];
        const checkpoints = checkpointDefinitions.filter((checkpoint) => checkpoint.element);

        // This file is only for the one-scroll landing page. Exit early on subpages.
        if (!document.getElementById('home') || checkpoints.length < 2) return;

        const createPageViewId = () => {
            if (window.crypto?.randomUUID) return `pv_${window.crypto.randomUUID()}`;
            return `pv_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
        };

        const pageViewId = createPageViewId();
        const elementIndexes = new Map(checkpoints.map((checkpoint, index) => [checkpoint.element, index]));
        const viewedIndexes = new Set();
        const engagedIndexes = new Set();
        const visibleIndexes = new Set();
        const activeTimeByIndex = new Map();
        let maxViewedIndex = -1;
        let lastViewedIndex = -1;
        let activePageTimeMs = 0;
        let lastTickAt = performance.now();
        let exitEventSent = false;

        const sendEvent = (eventName, params = {}) => {
            if (typeof window.gtag !== 'function') return;
            window.gtag('event', eventName, {
                page_view_id: pageViewId,
                page_path: window.location.pathname,
                ...params
            });
        };

        const getCheckpointParams = (index) => {
            const checkpoint = checkpoints[index];
            return {
                section_name: checkpoint.name,
                section_group: checkpoint.group,
                section_index: index + 1,
                section_count: checkpoints.length,
                section_depth_percent: Math.round(((index + 1) / checkpoints.length) * 100)
            };
        };

        const recordSectionView = (index) => {
            if (viewedIndexes.has(index)) return;

            const previousSection = lastViewedIndex >= 0 ? checkpoints[lastViewedIndex].name : 'entry';
            viewedIndexes.add(index);
            maxViewedIndex = Math.max(maxViewedIndex, index);
            lastViewedIndex = index;

            sendEvent('section_view', {
                ...getCheckpointParams(index),
                previous_section: previousSection
            });
            sendEvent(`ed_view_${checkpoints[index].name}`);
        };

        const updateTimers = () => {
            const now = performance.now();
            const elapsedMs = Math.min(Math.max(now - lastTickAt, 0), 1000);
            lastTickAt = now;

            if (document.hidden) return;
            activePageTimeMs += elapsedMs;

            visibleIndexes.forEach((index) => {
                if (engagedIndexes.has(index)) return;

                const nextActiveTime = (activeTimeByIndex.get(index) || 0) + elapsedMs;
                activeTimeByIndex.set(index, nextActiveTime);

                if (nextActiveTime >= 3000) {
                    engagedIndexes.add(index);
                    sendEvent('section_engaged', {
                        ...getCheckpointParams(index),
                        engaged_time_seconds: 3
                    });
                    sendEvent(`ed_engaged_${checkpoints[index].name}`);
                }
            });
        };

        const timerId = window.setInterval(updateTimers, 250);

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    const index = elementIndexes.get(entry.target);
                    if (index === undefined) return;

                    if (entry.isIntersecting) {
                        visibleIndexes.add(index);
                        recordSectionView(index);
                    } else {
                        visibleIndexes.delete(index);
                    }
                });
            }, {
                // Count a section when it reaches the central reading area of the viewport.
                rootMargin: '-20% 0px -20% 0px',
                threshold: 0.01
            });

            checkpoints.forEach((checkpoint) => observer.observe(checkpoint.element));
        } else {
            recordSectionView(0);
        }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) updateTimers();
            lastTickAt = performance.now();
        });

        const findCurrentCheckpointIndex = () => {
            const viewportCenter = window.innerHeight / 2;
            let closestIndex = lastViewedIndex;
            let closestDistance = Number.POSITIVE_INFINITY;

            checkpoints.forEach((checkpoint, index) => {
                const rect = checkpoint.element.getBoundingClientRect();
                if (rect.bottom <= 0 || rect.top >= window.innerHeight) return;

                const elementCenter = (rect.top + rect.bottom) / 2;
                const distance = Math.abs(elementCenter - viewportCenter);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIndex = index;
                }
            });

            return closestIndex;
        };

        document.addEventListener('click', (event) => {
            const link = event.target.closest('a[href]');
            if (!link) return;

            const href = link.getAttribute('href') || '';
            const isKakaoChat = link.classList.contains('kakao-chat-button');
            const isReservationLink = href === '#reservation' || href.endsWith('#reservation');
            if (!isKakaoChat && !isReservationLink) return;

            const sourceIndex = checkpoints.findIndex((checkpoint) => checkpoint.element.contains(link));
            const sourceSection = sourceIndex >= 0 ? checkpoints[sourceIndex].name : 'navigation';
            const destination = isKakaoChat ? 'kakao_chat' : 'reservation';
            sendEvent('landing_cta_click', {
                cta_destination: destination,
                source_section: sourceSection,
                link_text: (link.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100)
            });
            sendEvent(`ed_cta__${sourceSection}__${destination}`);
            const heroVariant = String(document.body.dataset.heroVariant || 'default')
                .toLowerCase()
                .replace(/[^a-z0-9_]+/g, '_')
                .replace(/^_+|_+$/g, '')
                .slice(0, 20) || 'default';
            sendEvent(`ed_variant__cta__${heroVariant}`, { hero_variant: heroVariant });
        });

        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            let formStarted = false;
            let submitAttempt = 0;
            const recordFormStart = (event) => {
                if (formStarted || !event.target.matches('input:not([type="hidden"]), select, textarea:not([readonly])')) return;
                formStarted = true;
                sendEvent('lead_form_start', {
                    form_name: 'B2C consultation',
                    section_name: 'reservation'
                });
            };

            contactForm.addEventListener('focusin', recordFormStart);
            contactForm.addEventListener('input', recordFormStart);
            contactForm.addEventListener('submit', () => {
                submitAttempt += 1;
                if (submitAttempt === 1) sendEvent('ed_form_submit_started');
                sendEvent('lead_form_submit_attempt', {
                    form_name: 'B2C consultation',
                    section_name: 'reservation',
                    submit_attempt: submitAttempt
                });
            });
        }

        window.addEventListener('pagehide', (event) => {
            if (event.persisted || exitEventSent || viewedIndexes.size === 0) return;
            exitEventSent = true;
            updateTimers();
            window.clearInterval(timerId);

            const exitIndex = findCurrentCheckpointIndex();
            if (exitIndex >= 0) {
                sendEvent(`ed_exit_${checkpoints[exitIndex].name}`, { transport_type: 'beacon' });
            }
            sendEvent('landing_page_exit', {
                exit_section_name: exitIndex >= 0 ? checkpoints[exitIndex].name : 'unknown',
                max_section_name: maxViewedIndex >= 0 ? checkpoints[maxViewedIndex].name : 'unknown',
                max_section_index: maxViewedIndex + 1,
                sections_viewed: viewedIndexes.size,
                sections_engaged: engagedIndexes.size,
                active_time_seconds: Math.round(activePageTimeMs / 1000),
                transport_type: 'beacon'
            });
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLandingAnalytics);
    } else {
        initLandingAnalytics();
    }
})();
