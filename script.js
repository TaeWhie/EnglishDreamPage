document.addEventListener('DOMContentLoaded', () => {
    const metaPixelId = window.EnglishDreamConfig?.metaPixelId?.trim();
    const kakaoChatUrl = window.EnglishDreamConfig?.kakaoChatUrl?.trim();

    const initMetaPixel = () => {
        if (!metaPixelId) return;
        if (window.fbq) return;

        window.fbq = function () {
            window.fbq.callMethod
                ? window.fbq.callMethod.apply(window.fbq, arguments)
                : window.fbq.queue.push(arguments);
        };

        if (!window._fbq) window._fbq = window.fbq;
        window.fbq.push = window.fbq;
        window.fbq.loaded = true;
        window.fbq.version = '2.0';
        window.fbq.queue = [];

        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://connect.facebook.net/en_US/fbevents.js';
        document.head.appendChild(script);

        window.fbq('init', metaPixelId);
        window.fbq('track', 'PageView');
    };

    const trackMetaEvent = (eventName, params = {}) => {
        if (window.fbq) {
            window.fbq('track', eventName, params);
        }
    };

    initMetaPixel();

    const setupKakaoChatButton = () => {
        const kakaoButton = document.querySelector('.kakao-chat-button');
        if (!kakaoButton) return;

        if (kakaoChatUrl) {
            kakaoButton.href = kakaoChatUrl;
            kakaoButton.target = '_blank';
            kakaoButton.rel = 'noopener noreferrer';
        }

        kakaoButton.addEventListener('click', () => {
            trackMetaEvent('Contact', {
                content_name: 'KakaoTalk 1:1 chat'
            });
        });
    };

    const sendYouTubeCommand = (iframe, func) => {
        iframe.contentWindow?.postMessage(JSON.stringify({
            event: 'command',
            func,
            args: []
        }), 'https://www.youtube.com');
    };

    const setupVideoSoundToggles = () => {
        document.querySelectorAll('.testimonial-video-wrap').forEach((wrap) => {
            const iframe = wrap.querySelector('iframe.auto-play-video');
            const button = wrap.querySelector('.video-sound-toggle');
            if (!iframe || !button) return;

            button.addEventListener('click', () => {
                sendYouTubeCommand(iframe, 'unMute');
                sendYouTubeCommand(iframe, 'playVideo');
                button.remove();
            });
        });
    };

    const setupViewportVideoPlayback = () => {
        const videos = [...document.querySelectorAll('video.auto-play-video, iframe.auto-play-video')];
        if (!videos.length || !('IntersectionObserver' in window)) return;

        videos.forEach((video) => {
            if (video.tagName === 'VIDEO') {
                video.muted = true;
                video.playsInline = true;
            } else {
                video.addEventListener('load', () => {
                    if (video.dataset.videoVisible === 'true') {
                        sendYouTubeCommand(video, 'playVideo');
                    }
                });
            }
        });

        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const media = entry.target;
                const shouldPlay = entry.isIntersecting && entry.intersectionRatio >= 0.45;
                media.dataset.videoVisible = String(shouldPlay);

                if (media.tagName === 'IFRAME') {
                    sendYouTubeCommand(media, shouldPlay ? 'playVideo' : 'pauseVideo');
                    return;
                }

                if (shouldPlay) {
                    media.play().catch(() => {});
                } else {
                    media.pause();
                }
            });
        }, {
            threshold: [0, 0.45, 0.75]
        });

        videos.forEach((video) => videoObserver.observe(video));

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) return;

            videos.forEach((media) => {
                if (media.tagName === 'IFRAME') {
                    sendYouTubeCommand(media, 'pauseVideo');
                    return;
                }

                media.pause();
            });
        });
    };

    setupKakaoChatButton();
    setupVideoSoundToggles();
    setupViewportVideoPlayback();

    // Header Scroll Effect
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    const setMenuState = (isOpen) => {
        navLinks.classList.toggle('active', isOpen);
        hamburger.classList.toggle('toggle', isOpen);
        hamburger.setAttribute('aria-expanded', String(isOpen));
        hamburger.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
    };

    hamburger.addEventListener('click', () => {
        const isOpen = !navLinks.classList.contains('active');
        setMenuState(isOpen);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            setMenuState(false);
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            setMenuState(false);
        }
    });

    document.addEventListener('click', (event) => {
        if (!navLinks.classList.contains('active')) return;
        if (!event.target.closest('.nav-container')) {
            setMenuState(false);
        }
    });

    // Smooth Scrolling for Anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Close mobile menu if open
                if (navLinks.classList.contains('active')) {
                    setMenuState(false);
                }
                
                const headerOffset = header.offsetHeight + 12;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.scrollY - headerOffset;
  
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // Intersection Observer for Fade-in Animations
    const fadeElements = document.querySelectorAll('.fade-in');
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    fadeElements.forEach(element => {
        observer.observe(element);
    });

    const courseSlider = document.querySelector('.course-slider');
    if (courseSlider) {
        const cards = [...courseSlider.querySelectorAll('.course-card')];
        const dots = [...courseSlider.querySelectorAll('.course-dots button')];
        const prevButton = courseSlider.querySelector('.course-prev');
        const nextButton = courseSlider.querySelector('.course-next');
        let activeIndex = 0;
        let autoplayId;

        const showCourse = (index) => {
            activeIndex = (index + cards.length) % cards.length;
            cards.forEach((card, cardIndex) => {
                card.classList.toggle('is-active', cardIndex === activeIndex);
            });
            dots.forEach((dot, dotIndex) => {
                dot.classList.toggle('is-active', dotIndex === activeIndex);
            });
        };

        const restartAutoplay = () => {
            window.clearInterval(autoplayId);
            autoplayId = window.setInterval(() => showCourse(activeIndex + 1), 3200);
        };

        prevButton.addEventListener('click', () => {
            showCourse(activeIndex - 1);
            restartAutoplay();
        });

        nextButton.addEventListener('click', () => {
            showCourse(activeIndex + 1);
            restartAutoplay();
        });

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                showCourse(index);
                restartAutoplay();
            });
        });

        courseSlider.addEventListener('mouseenter', () => window.clearInterval(autoplayId));
        courseSlider.addEventListener('mouseleave', restartAutoplay);

        showCourse(0);
        restartAutoplay();
    }

    const setupRequiredCheckboxGroups = (form) => {
        form.querySelectorAll('[data-required-group] input[type="checkbox"]').forEach((input) => {
            input.addEventListener('change', () => {
                const formGroup = input.closest('.form-group');
                if (formGroup.querySelector('input[type="checkbox"]:checked')) {
                    formGroup.classList.remove('is-invalid');
                    formGroup.querySelector('.field-error')?.remove();
                }
            });
        });
    };

    const validateRequiredCheckboxGroups = (form) => {
        const requiredGroups = form.querySelectorAll('[data-required-group]');
        let groupsAreValid = true;

        requiredGroups.forEach((group) => {
            const groupName = group.dataset.requiredGroup;
            const checkedInput = form.querySelector(`input[name="${groupName}"]:checked`);
            const formGroup = group.closest('.form-group');
            const existingError = formGroup.querySelector('.field-error');

            if (checkedInput) {
                formGroup.classList.remove('is-invalid');
                existingError?.remove();
                return;
            }

            groupsAreValid = false;
            formGroup.classList.add('is-invalid');

            if (!existingError) {
                const error = document.createElement('p');
                error.className = 'field-error';
                error.textContent = '하나 이상 선택해 주세요.';
                formGroup.appendChild(error);
            }
        });

        if (!groupsAreValid) {
            form.querySelector('.is-invalid input')?.focus();
        }

        return groupsAreValid;
    };

    // Form Submission (Demo)
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        setupRequiredCheckboxGroups(contactForm);
        contactForm.addEventListener('submit', (e) => {
            if (!validateRequiredCheckboxGroups(contactForm)) {
                e.preventDefault();
                return;
            }

            e.preventDefault();
            const name = document.getElementById('name').value;
            trackMetaEvent('Lead', {
                content_name: 'Consultation reservation',
                content_category: 'B2C'
            });
            alert(`감사합니다, ${name}님! 상담 예약이 접수되었습니다. 곧 연락드리겠습니다.`);
            contactForm.reset();
            contactForm.querySelectorAll('.form-group.is-invalid').forEach((group) => {
                group.classList.remove('is-invalid');
                group.querySelector('.field-error')?.remove();
            });
        });
    }

    const businessForm = document.getElementById('businessForm');
    if (businessForm) {
        setupRequiredCheckboxGroups(businessForm);
        businessForm.addEventListener('submit', (e) => {
            if (!validateRequiredCheckboxGroups(businessForm)) {
                e.preventDefault();
                return;
            }

            e.preventDefault();
            const companyName = document.getElementById('company-name').value;
            trackMetaEvent('Lead', {
                content_name: 'Business education inquiry',
                content_category: 'B2B'
            });
            alert(`${companyName} 기업교육 문의가 접수되었습니다. 담당자가 곧 연락드리겠습니다.`);
            businessForm.reset();
        });
    }
});
