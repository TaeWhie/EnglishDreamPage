document.addEventListener('DOMContentLoaded', () => {
    const metaPixelId = window.EnglishDreamConfig?.metaPixelId?.trim();
    const googleAnalyticsId = window.EnglishDreamConfig?.googleAnalyticsId?.trim();
    const kakaoChatUrl = window.EnglishDreamConfig?.kakaoChatUrl?.trim();
    const googleAppsScriptUrl = window.EnglishDreamConfig?.googleAppsScriptUrl?.trim();

    const setupHeroMotion = () => {
        const hero = document.querySelector('#home.hero');
        const visual = hero?.querySelector('.hero-visual');
        if (!hero || !visual || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        hero.classList.add('hero-motion-enabled');
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => hero.classList.add('hero-motion-ready'));
        });
    };

    setupHeroMotion();

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

    const trackMetaEvent = (eventName, params = {}, options = {}) => {
        if (!window.fbq || !metaPixelId) return false;
        const eventId = String(options.eventID || '').trim();
        const dedupKey = eventId ? `ed_meta_sent_${eventName}_${eventId}` : '';
        if (dedupKey) {
            try {
                if (sessionStorage.getItem(dedupKey)) return false;
                sessionStorage.setItem(dedupKey, '1');
            } catch {}
        }
        window.fbq('trackSingle', metaPixelId, eventName, params, options);
        return true;
    };

    const initGoogleAnalytics = (attribution = {}) => {
        if (!googleAnalyticsId || window.gtag) return;

        window.dataLayer = window.dataLayer || [];
        window.gtag = function () {
            window.dataLayer.push(arguments);
        };

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleAnalyticsId)}`;
        document.head.appendChild(script);

        window.gtag('js', new Date());
        const campaignConfig = {};
        if (attribution.utm_source) campaignConfig.campaign_source = attribution.utm_source;
        if (attribution.utm_medium) campaignConfig.campaign_medium = attribution.utm_medium;
        if (attribution.utm_campaign) campaignConfig.campaign_name = attribution.utm_campaign;
        if (attribution.utm_content) campaignConfig.campaign_content = attribution.utm_content;
        if (attribution.utm_term) campaignConfig.campaign_term = attribution.utm_term;
        window.gtag('config', googleAnalyticsId, campaignConfig);
    };

    const trackGoogleEvent = (eventName, params = {}) => {
        if (window.gtag) {
            window.gtag('event', eventName, params);
        }
    };

    const eventNamePart = (value, fallback = 'unknown') => String(value || fallback)
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 20) || fallback;

    const trackHeroVariantStage = (stage, variant) => {
        const safeStage = eventNamePart(stage);
        const safeVariant = eventNamePart(variant, 'default');
        trackGoogleEvent(`ed_variant__${safeStage}__${safeVariant}`, {
            hero_variant: safeVariant
        });
    };

    const trackNaverLead = () => {
        window.EnglishDreamNaverTracking?.trackLead?.();
    };

    const getQueryParam = (name) => new URLSearchParams(window.location.search).get(name) || '';

    const createTrackingId = (prefix) => {
        if (window.crypto?.randomUUID) return `${prefix}_${window.crypto.randomUUID()}`;
        return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    };

    const getOrCreateStoredId = (storage, key, prefix) => {
        try {
            const saved = storage.getItem(key);
            if (saved) return saved;
            const created = createTrackingId(prefix);
            storage.setItem(key, created);
            return created;
        } catch {
            return createTrackingId(prefix);
        }
    };

    const getQueryValues = (names) => {
        const params = new URLSearchParams(window.location.search);
        return names.reduce((values, name) => {
            const value = params.get(name);
            if (value) values[name] = value;
            return values;
        }, {});
    };

    const getReferrerHost = () => {
        try {
            return new URL(document.referrer).hostname.toLowerCase();
        } catch {
            return '';
        }
    };

    const decodeSearchText = () => {
        const search = window.location.search || '';
        try {
            return `${search} ${decodeURIComponent(search.replace(/\+/g, ' '))}`.toLowerCase();
        } catch {
            return search.toLowerCase();
        }
    };

    const getAttribution = () => {
        const legacySessionKey = 'ed_initial_attribution';
        const sessionStorageKey = 'ed_session_attribution_v2';
        const persistentStorageKey = 'ed_attribution_v2';
        const visitorId = getOrCreateStoredId(localStorage, 'ed_visitor_id', 'visitor');
        const trackingSessionId = getOrCreateStoredId(sessionStorage, 'ed_tracking_session_id', 'session');
        const clickParamNames = ['fbclid', 'gclid', 'gbraid', 'wbraid', 'msclkid', 'ttclid'];
        const naverParamNames = [
            'NaPm',
            'Ncisy',
            'n_campaign_type',
            'n_media',
            'n_query',
            'n_rank',
            'n_rank_type',
            'n_campaign_id',
            'n_ad_group',
            'n_ad_group_id',
            'n_ad',
            'n_ad_id',
            'n_keyword_id',
            'n_keyword',
            'n_match',
            'n_network'
        ];
        const clickParams = getQueryValues(clickParamNames);
        const naverParams = getQueryValues(naverParamNames);
        const naverCampaignType = getQueryParam('n_campaign_type');
        const naverAdGroup = getQueryParam('n_ad_group');
        const naverAd = getQueryParam('n_ad');
        const naverKeywordId = getQueryParam('n_keyword_id');
        const naverKeyword = getQueryParam('n_keyword');
        const naverQuery = getQueryParam('n_query');
        const decodedSearchText = decodeSearchText();
        const referrerHost = getReferrerHost();
        const isOwnReferrer = referrerHost === window.location.hostname.toLowerCase() || /(^|\.)engdream\.com$/.test(referrerHost);
        const hasNaverAutoTag = Boolean(naverParams.NaPm || naverParams.Ncisy);
        const hasNaverSearchAdTrace = /tr=(sa|sa2|pwrcnt|pla|plap|plab|plac|plan|atf|news|cd)\b/.test(decodedSearchText);
        const hasNaverDisplayTrace = /tr=(gfa|pmax)\b/.test(decodedSearchText);
        const hasNaverClickParams = Boolean(naverCampaignType || naverAdGroup || naverAd || naverKeywordId);
        const isNaverPowerlink = naverCampaignType === '1' || hasNaverSearchAdTrace || Boolean(naverAdGroup || naverAd || naverKeywordId);
        const isNaverPaid = isNaverPowerlink || hasNaverAutoTag || hasNaverClickParams || referrerHost === 'ad.search.naver.com' || hasNaverDisplayTrace;
        const isNaverPlace = !isNaverPaid && (
            /(^|\.)place\.naver\.com$/.test(referrerHost)
            || /(^|\.)map\.naver\.com$/.test(referrerHost)
        );
        const isNaverOrganic = !isNaverPaid && !isNaverPlace && referrerHost.includes('naver.com');
        const naverCampaign = isNaverPowerlink
            ? 'powerlink'
            : (hasNaverDisplayTrace ? 'naver_display' : (isNaverPaid ? 'naver_paid_auto' : (isNaverPlace ? 'naver_place' : (isNaverOrganic ? 'naver_organic' : ''))));
        const naverContent = [naverAdGroup, naverAd, naverParams.n_media, naverParams.n_rank].filter(Boolean).join(':');
        const paidClickAttribution = (() => {
            if (clickParams.gclid || clickParams.gbraid || clickParams.wbraid) return { source: 'google', medium: 'cpc', campaign: 'google_ads', hint: 'google_paid' };
            if (clickParams.msclkid) return { source: 'bing', medium: 'cpc', campaign: 'microsoft_ads', hint: 'bing_paid' };
            if (clickParams.ttclid) return { source: 'tiktok', medium: 'paid_social', campaign: 'tiktok_ads', hint: 'tiktok_paid' };
            if (clickParams.fbclid) {
                const socialSource = referrerHost.includes('instagram.com')
                    ? 'instagram'
                    : (referrerHost.includes('facebook.com') || referrerHost.includes('fb.com') ? 'facebook' : (referrerHost.includes('threads.net') ? 'threads' : 'instagram_facebook'));
                const socialHint = socialSource === 'instagram'
                    ? 'instagram_click'
                    : (socialSource === 'facebook' ? 'facebook_click' : (socialSource === 'threads' ? 'threads_click' : 'instagram_facebook_click'));
                return { source: socialSource, medium: 'click', campaign: 'meta_click', hint: socialHint };
            }
            return null;
        })();
        const referrerAttribution = (() => {
            if (!referrerHost || isOwnReferrer) return null;
            if (referrerHost.includes('google.')) return { source: 'google', medium: 'organic', campaign: 'google_search', hint: 'google_referrer' };
            if (referrerHost.includes('bing.com')) return { source: 'bing', medium: 'organic', campaign: 'bing_search', hint: 'bing_referrer' };
            if (referrerHost.includes('instagram.com')) return { source: 'instagram', medium: 'social', campaign: 'instagram_referrer', hint: 'instagram_referrer' };
            if (referrerHost.includes('facebook.com') || referrerHost.includes('fb.com')) return { source: 'facebook', medium: 'social', campaign: 'facebook_referrer', hint: 'facebook_referrer' };
            if (referrerHost.includes('threads.net')) return { source: 'threads', medium: 'social', campaign: 'threads_referrer', hint: 'threads_referrer' };
            if (referrerHost.includes('kakao.com') || referrerHost.includes('kakaotalk')) return { source: 'kakao', medium: 'referral', campaign: 'kakao_referrer', hint: 'kakao_referrer' };
            if (referrerHost.includes('daum.net')) return { source: 'daum', medium: 'organic', campaign: 'daum_referrer', hint: 'daum_referrer' };
            if (referrerHost.includes('youtube.com') || referrerHost.includes('youtu.be')) return { source: 'youtube', medium: 'referral', campaign: 'youtube_referrer', hint: 'youtube_referrer' };
            if (referrerHost.includes('tiktok.com')) return { source: 'tiktok', medium: 'social', campaign: 'tiktok_referrer', hint: 'tiktok_referrer' };
            return { source: referrerHost, medium: 'referral', campaign: 'external_referrer', hint: 'external_referrer' };
        })();
        const inferredAttribution = isNaverPaid || isNaverPlace || isNaverOrganic
            ? {
                source: 'naver',
                medium: isNaverPaid ? 'cpc' : (isNaverPlace ? 'referral' : 'organic'),
                campaign: naverCampaign,
                content: naverContent,
                term: naverKeyword || naverQuery,
                hint: isNaverPaid ? 'naver_paid' : (isNaverPlace ? 'naver_place' : 'naver_organic')
            }
            : (paidClickAttribution || referrerAttribution || {});
        const current = {
            initial_referrer: document.referrer || '',
            landing_page: window.location.href,
            attribution_hint: inferredAttribution.hint || '',
            naver_params: Object.entries(naverParams).map(([key, value]) => `${key}=${value}`).join('&'),
            ad_click_id: Object.entries(clickParams).map(([key, value]) => `${key}=${value}`).join('&'),
            utm_source: getQueryParam('utm_source') || inferredAttribution.source || '',
            utm_medium: getQueryParam('utm_medium') || inferredAttribution.medium || '',
            utm_campaign: getQueryParam('utm_campaign') || inferredAttribution.campaign || '',
            utm_content: getQueryParam('utm_content') || inferredAttribution.content || '',
            utm_term: getQueryParam('utm_term') || inferredAttribution.term || '',
            fbclid: clickParams.fbclid || '',
            gclid: clickParams.gclid || '',
            gbraid: clickParams.gbraid || '',
            wbraid: clickParams.wbraid || '',
            msclkid: clickParams.msclkid || '',
            ttclid: clickParams.ttclid || ''
        };

        try {
            const hasCampaignParams = current.utm_source || current.utm_medium || current.utm_campaign || current.attribution_hint || current.naver_params || current.ad_click_id;
            const hasExternalReferrer = Boolean(referrerHost && !isOwnReferrer);
            const isNonDirectTouch = Boolean(hasCampaignParams || hasExternalReferrer);
            const capturedAt = new Date().toISOString();
            const hasClickId = Boolean(current.ad_click_id || current.naver_params);
            const hasUtm = Boolean(current.utm_source || current.utm_medium || current.utm_campaign);
            const confidence = hasClickId || hasUtm ? 'high' : (hasExternalReferrer ? 'medium' : 'low');
            const evidence = hasClickId
                ? '광고 클릭/자동태그 파라미터'
                : (hasUtm ? 'UTM 캠페인 파라미터' : (hasExternalReferrer ? '외부 referrer' : '직접 유입 또는 referrer 없음'));
            const touch = {
                ...current,
                touch_id: createTrackingId('touch'),
                captured_at: capturedAt,
                attribution_confidence: confidence,
                attribution_evidence: evidence
            };
            const now = Date.now();
            const firstTouchMaxAge = 365 * 86400000;
            const lastTouchMaxAge = 90 * 86400000;
            const savedState = JSON.parse(localStorage.getItem(persistentStorageKey) || 'null') || {};
            const firstTouchTime = Date.parse(savedState.firstTouch?.captured_at || '');
            const lastTouchTime = Date.parse(savedState.lastNonDirectTouch?.captured_at || '');
            const firstTouch = Number.isFinite(firstTouchTime) && now - firstTouchTime <= firstTouchMaxAge
                ? savedState.firstTouch
                : touch;
            let lastNonDirectTouch = Number.isFinite(lastTouchTime) && now - lastTouchTime <= lastTouchMaxAge
                ? savedState.lastNonDirectTouch
                : null;

            if (isNonDirectTouch) lastNonDirectTouch = touch;
            const persistentState = { firstTouch, lastNonDirectTouch };
            localStorage.setItem(persistentStorageKey, JSON.stringify(persistentState));

            let sessionTouch = JSON.parse(sessionStorage.getItem(sessionStorageKey) || 'null');
            if (!sessionTouch || isNonDirectTouch) {
                sessionTouch = touch;
                sessionStorage.setItem(sessionStorageKey, JSON.stringify(sessionTouch));
            }
            sessionStorage.setItem(legacySessionKey, JSON.stringify(firstTouch));

            const creditedTouch = isNonDirectTouch
                ? touch
                : (lastNonDirectTouch || sessionTouch || firstTouch || touch);
            return {
                ...creditedTouch,
                initial_referrer: firstTouch.initial_referrer || '',
                landing_page: firstTouch.landing_page || '',
                first_touch_at: firstTouch.captured_at || '',
                first_touch_source: firstTouch.utm_source || '',
                first_touch_medium: firstTouch.utm_medium || '',
                first_touch_campaign: firstTouch.utm_campaign || '',
                first_touch_content: firstTouch.utm_content || '',
                first_touch_term: firstTouch.utm_term || '',
                first_touch_naver_params: firstTouch.naver_params || '',
                first_touch_ad_click_id: firstTouch.ad_click_id || '',
                last_touch_at: creditedTouch.captured_at || '',
                last_touch_referrer: creditedTouch.initial_referrer || '',
                last_touch_landing_page: creditedTouch.landing_page || '',
                last_touch_source: creditedTouch.utm_source || '',
                last_touch_medium: creditedTouch.utm_medium || '',
                last_touch_campaign: creditedTouch.utm_campaign || '',
                last_touch_content: creditedTouch.utm_content || '',
                last_touch_term: creditedTouch.utm_term || '',
                last_touch_naver_params: creditedTouch.naver_params || '',
                last_touch_ad_click_id: creditedTouch.ad_click_id || '',
                attribution_model: 'last_non_direct_90d',
                visitor_id: visitorId,
                tracking_session_id: trackingSessionId
            };
        } catch {
            return {
                ...current,
                attribution_model: 'current_session_fallback',
                attribution_confidence: current.ad_click_id || current.naver_params ? 'high' : 'low',
                attribution_evidence: '브라우저 저장소 사용 불가',
                visitor_id: visitorId,
                tracking_session_id: trackingSessionId
            };
        }
    };

    // Capture the first-touch source while the landing-page referrer is still available.
    const initialAttribution = getAttribution();

    const applyCampaignHeroMessage = () => {
        const title = document.querySelector('[data-hero-title]');
        const eyebrow = document.querySelector('[data-hero-eyebrow]');
        const description = document.querySelector('.hero-description');
        if (!title || !eyebrow || !description) return 'default';

        const queryText = decodeSearchText();
        const querySource = getQueryParam('utm_source').toLowerCase();
        const referrerHost = getReferrerHost();
        const hasNaverTrace = /(?:napm|ncisy|n_keyword|n_query|n_campaign)/i.test(window.location.search)
            || referrerHost.includes('naver.com');
        const hasMetaTrace = Boolean(getQueryParam('fbclid'))
            || /instagram|facebook|meta/.test(querySource)
            || /instagram|facebook|fb\.com/.test(referrerHost);

        const messages = [
            {
                variant: 'business',
                matches: /비즈니스|business|직장인|회사|면접|취업|meeting|interview/.test(queryText),
                eyebrow: '업무에서 바로 쓰는 원어민 1:1 비즈니스 영어',
                title: '영어 미팅과 면접이 막막하다면<br>내 업무에 맞춰 연습하는 1:1 회화',
                description: '원어민 실전 수업과 담당 선생님의 피드백으로 업무에 필요한 표현부터 자신감까지 함께 준비합니다.'
            },
            {
                variant: 'travel',
                matches: /여행|travel|워홀|워킹홀리데이|유학|해외생활/.test(queryText),
                eyebrow: '여행과 해외생활을 위한 원어민 1:1 영어회화',
                title: '번역기 없이 직접 말하고 싶다면<br>상황별로 연습하는 1:1 회화',
                description: '공항, 숙소, 직장 등 실제 상황을 원어민과 미리 연습하고 담당 선생님의 데일리 관리로 익숙하게 만듭니다.'
            },
            {
                variant: 'test',
                matches: /토익|토스|토익스피킹|오픽|opic|시험|speaking/.test(queryText),
                eyebrow: '목표 점수에 맞춘 원어민 1:1 스피킹 훈련',
                title: '외운 답변이 아니라 내 문장으로<br>말하게 만드는 1:1 시험 회화',
                description: '현재 실력을 먼저 진단하고 목표 시험과 점수에 맞춰 실전 답변과 약점을 집중적으로 보완합니다.'
            },
            {
                variant: 'beginner',
                matches: /왕초보|초보|기초|입문|beginner|영어회화/.test(queryText),
                eyebrow: '왕초보를 위한 원어민 1:1 온라인 영어회화',
                title: '<span class="hero-nowrap">왕초보도 10분</span><br>무료진단부터<br>매일 입이 트이는 1:1회화',
                description: '현재 실력에 맞춘 원어민 수업과 담당 선생님의 데일리 관리로 수업 밖에서도 영어를 계속 말하게 만듭니다.'
            },
            {
                variant: 'naver',
                matches: hasNaverTrace,
                eyebrow: '네이버에서 찾던 관리형 원어민 1:1 영어회화',
                title: '수업만 듣고 끝나지 않도록<br>매일 관리받는 원어민 1:1 회화',
                description: '10분 무료 진단으로 현재 실력을 확인하고 원어민 수업과 데일리 피드백을 함께 경험해 보세요.'
            },
            {
                variant: 'meta',
                matches: hasMetaTrace,
                eyebrow: '광고에서 본 관리형 원어민 1:1 영어회화',
                title: '원어민 수업만으로 끝나지 않는<br>매일 입이 트이는 관리형 1:1 회화',
                description: '원어민 실시간 수업과 담당 선생님의 데일리 피드백으로 영어를 매일 말하는 습관을 만듭니다.'
            }
        ];

        const selected = messages.find((message) => message.matches);
        if (!selected) {
            document.body.dataset.heroVariant = 'default';
            return 'default';
        }

        eyebrow.textContent = selected.eyebrow;
        title.innerHTML = selected.title;
        description.textContent = selected.description;
        document.body.dataset.heroVariant = selected.variant;
        return selected.variant;
    };

    const heroMessageVariant = applyCampaignHeroMessage();

    initMetaPixel();
    initGoogleAnalytics(initialAttribution);
    trackGoogleEvent('ed_landing_variant', {
        hero_variant: heroMessageVariant,
        traffic_source: initialAttribution.last_touch_source || initialAttribution.utm_source || 'direct'
    });
    trackHeroVariantStage('view', heroMessageVariant);

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
            trackGoogleEvent('contact', {
                method: 'kakao'
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

    document.querySelectorAll('[data-cta-location]').forEach((cta) => {
        cta.addEventListener('click', () => {
            const destination = cta.getAttribute('href') || '';
            trackGoogleEvent('ed_cta_click', {
                cta_location: cta.dataset.ctaLocation,
                cta_text: cta.textContent.replace(/\s+/g, ' ').trim(),
                hero_variant: heroMessageVariant,
                destination
            });
        });
    });

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

    // Mobile-first progressive disclosure for the long one-scroll landing page.
    const featureItems = [...document.querySelectorAll('#features .feature-item')];
    featureItems.forEach((item, index) => {
        const heading = item.querySelector('.feature-text h3');
        if (!heading || item.querySelector('.mobile-feature-summary')) return;

        item.classList.add('mobile-feature-card');
        item.classList.toggle('is-open', index === 0);

        const summaryButton = document.createElement('button');
        summaryButton.type = 'button';
        summaryButton.className = 'mobile-feature-summary';
        summaryButton.setAttribute('aria-expanded', String(index === 0));

        const label = document.createElement('span');
        label.className = 'mobile-feature-summary-label';
        const title = document.createElement('strong');
        title.textContent = heading.textContent.trim();
        const keyMessage = item.querySelector('.feature-key-message');
        label.append(title);
        if (keyMessage) {
            const summary = document.createElement('small');
            summary.textContent = keyMessage.textContent.trim();
            label.append(summary);
        }
        const icon = document.createElement('b');
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = '⌄';
        summaryButton.append(label, icon);
        item.prepend(summaryButton);

        summaryButton.addEventListener('click', () => {
            const shouldOpen = !item.classList.contains('is-open');
            featureItems.forEach((featureItem) => {
                featureItem.classList.remove('is-open');
                featureItem.querySelector('.mobile-feature-summary')?.setAttribute('aria-expanded', 'false');
            });

            if (shouldOpen) {
                item.classList.add('is-open');
                summaryButton.setAttribute('aria-expanded', 'true');
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

    const setupCardSlider = (slider, selectors) => {
        const cards = [...slider.querySelectorAll(selectors.card)];
        const dots = [...slider.querySelectorAll(selectors.dot)];
        const prevButton = slider.querySelector(selectors.prev);
        const nextButton = slider.querySelector(selectors.next);
        if (!cards.length) return;

        let activeIndex = 0;
        let autoplayId;

        const showCard = (index) => {
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
            autoplayId = window.setInterval(() => showCard(activeIndex + 1), 3200);
        };

        prevButton?.addEventListener('click', () => {
            showCard(activeIndex - 1);
            restartAutoplay();
        });

        nextButton?.addEventListener('click', () => {
            showCard(activeIndex + 1);
            restartAutoplay();
        });

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                showCard(index);
                restartAutoplay();
            });
        });

        slider.addEventListener('mouseenter', () => window.clearInterval(autoplayId));
        slider.addEventListener('mouseleave', restartAutoplay);

        showCard(0);
        restartAutoplay();
    };

    document.querySelectorAll('.management-slider').forEach((slider) => {
        setupCardSlider(slider, {
            card: '.management-slider-card',
            dot: '.management-slider-dots button',
            prev: '.management-slider-prev',
            next: '.management-slider-next'
        });
    });

    document.querySelectorAll('.booster-slider').forEach((slider) => {
        setupCardSlider(slider, {
            card: '.booster-slider-card',
            dot: '.booster-slider-dots button',
            prev: '.booster-slider-prev',
            next: '.booster-slider-next'
        });
    });

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

    const getInputLabelText = (input) => {
        const label = input.closest('label');
        if (!label) return input.value || '';

        const inlineInput = label.querySelector('.inline-input');
        const inlineText = inlineInput?.value.trim();
        const clone = label.cloneNode(true);
        clone.querySelectorAll('input').forEach((item) => item.remove());
        const labelText = clone.textContent.replace(/\s+/g, ' ').trim();

        return inlineText ? `${labelText} ${inlineText}`.trim() : labelText;
    };

    const getCheckedValues = (form, name) => {
        return [...form.querySelectorAll(`input[name="${name}"]:checked`)]
            .map(getInputLabelText)
            .join(', ');
    };

    const getRadioValue = (form, name) => {
        const input = form.querySelector(`input[name="${name}"]:checked`);
        return input ? getInputLabelText(input) : '';
    };

    const getGoogleSessionIdentity = async () => {
        if (!window.gtag || !googleAnalyticsId) return {};
        const readValue = (field) => new Promise((resolve) => {
            let settled = false;
            const timer = setTimeout(() => {
                if (!settled) resolve('');
            }, 800);
            window.gtag('get', googleAnalyticsId, field, (value) => {
                settled = true;
                clearTimeout(timer);
                resolve(String(value || ''));
            });
        });
        const [clientId, sessionId] = await Promise.all([readValue('client_id'), readValue('session_id')]);
        return { ga_client_id: clientId, ga_session_id: sessionId };
    };

    const submitLead = async (payload, leadEventId = createTrackingId('lead')) => {
        if (!googleAppsScriptUrl) {
            throw new Error('Google Sheets 연결 URL이 아직 설정되지 않았습니다.');
        }

        const attribution = initialAttribution;
        const googleSession = await getGoogleSessionIdentity();
        const referrerLabel = attribution.utm_source
            ? [attribution.utm_source, attribution.utm_medium, attribution.utm_campaign, attribution.utm_content, attribution.utm_term].filter(Boolean).join(' / ')
            : (attribution.initial_referrer || document.referrer || '직접 유입');

        const response = await fetch('/api/lead', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify({
                ...payload,
                lead_event_id: leadEventId,
                pageUrl: window.location.href,
                referrer: referrerLabel,
                ...attribution,
                ...googleSession,
                userAgent: navigator.userAgent
            })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) {
            throw new Error(result.error || '상담 내용을 저장하지 못했습니다.');
        }
        return { leadEventId, duplicate: Boolean(result.duplicate) };
    };

    const setSubmitting = (form, isSubmitting) => {
        form.dataset.submitting = isSubmitting ? 'true' : 'false';
        const button = form.querySelector('button[type="submit"]');
        if (!button) return;

        if (isSubmitting) {
            button.dataset.originalText = button.textContent;
            button.textContent = '접수 중...';
            button.disabled = true;
            return;
        }

        button.textContent = button.dataset.originalText || button.textContent;
        button.disabled = false;
    };

    const clearFormErrors = (form) => {
        form.querySelectorAll('.form-group.is-invalid').forEach((group) => {
            group.classList.remove('is-invalid');
            group.querySelector('.field-error')?.remove();
        });
    };

    // Form Submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        setupRequiredCheckboxGroups(contactForm);

        const contactFormSteps = [...contactForm.querySelectorAll('[data-form-step]')];
        const contactFormProgress = contactForm.querySelector('.form-progress');
        const contactFormNextButton = contactForm.querySelector('.form-next-btn');
        const contactFormBackButton = contactForm.querySelector('.form-back-btn');
        const contactFormRestartButton = contactForm.querySelector('.form-restart-btn');
        let contactFormStarted = false;
        let contactFormViewedSteps = new Set();
        let contactFormCompletedSteps = new Set();

        const showContactFormStep = (stepNumber, shouldFocus = false) => {
            contactForm.dataset.currentStep = String(stepNumber);
            contactFormSteps.forEach((step) => {
                const isActive = Number(step.dataset.formStep) === stepNumber;
                step.classList.toggle('is-active', isActive);
                step.hidden = !isActive;
            });
            contactForm.querySelectorAll('[data-progress-step]').forEach((step) => {
                step.classList.toggle('is-active', Number(step.dataset.progressStep) <= stepNumber);
            });
            if (contactFormProgress) {
                contactFormProgress.dataset.completeStep = stepNumber > 1 ? String(stepNumber - 1) : '';
            }
            if (shouldFocus) {
                contactFormSteps.find((step) => Number(step.dataset.formStep) === stepNumber)
                    ?.querySelector('.form-step-heading h3')?.focus?.();
            }
            trackGoogleEvent('ed_form_step_view', {
                form_name: 'B2C consultation',
                form_step: stepNumber,
                hero_variant: heroMessageVariant
            });
            if (!contactFormViewedSteps.has(stepNumber)) {
                contactFormViewedSteps.add(stepNumber);
                if (stepNumber === 2) {
                    trackGoogleEvent('ed_form_step2_view', {
                        form_name: 'B2C consultation',
                        hero_variant: heroMessageVariant
                    });
                    trackHeroVariantStage('step2', heroMessageVariant);
                }
            }
        };

        const markContactFormStarted = () => {
            if (contactFormStarted) return;
            contactFormStarted = true;
            trackGoogleEvent('form_start', {
                form_name: 'B2C consultation',
                hero_variant: heroMessageVariant
            });
            trackGoogleEvent('ed_form_start', {
                form_name: 'B2C consultation',
                hero_variant: heroMessageVariant
            });
            trackHeroVariantStage('start', heroMessageVariant);
        };

        contactForm.addEventListener('focusin', (event) => {
            if (event.target.matches('input, select, textarea')) markContactFormStarted();
        });
        contactForm.addEventListener('change', markContactFormStarted);

        contactFormNextButton?.addEventListener('click', () => {
            const firstStep = contactForm.querySelector('[data-form-step="1"]');
            const requiredControls = [...firstStep.querySelectorAll('input[required], select[required], textarea[required]')];
            const invalidControl = requiredControls.find((control) => !control.checkValidity());
            if (invalidControl) {
                trackGoogleEvent('ed_form_validation_error', {
                    form_name: 'B2C consultation',
                    form_step: 1,
                    field_name: invalidControl.name || invalidControl.id || 'unknown'
                });
                trackGoogleEvent(`ed_error__${eventNamePart(invalidControl.name || invalidControl.id)}`, {
                    form_name: 'B2C consultation',
                    form_step: 1
                });
                invalidControl.reportValidity();
                invalidControl.focus();
                return;
            }

            if (!contactFormCompletedSteps.has(1)) {
                contactFormCompletedSteps.add(1);
                trackGoogleEvent('ed_form_step_complete', {
                    form_name: 'B2C consultation',
                    form_step: 1,
                    hero_variant: heroMessageVariant
                });
                trackGoogleEvent('ed_form_step1_complete', {
                    form_name: 'B2C consultation',
                    hero_variant: heroMessageVariant
                });
                trackHeroVariantStage('step1', heroMessageVariant);
            }
            showContactFormStep(2, true);
        });

        contactFormBackButton?.addEventListener('click', () => showContactFormStep(1, true));
        contactFormRestartButton?.addEventListener('click', () => {
            contactForm.reset();
            clearFormErrors(contactForm);
            contactFormStarted = false;
            contactFormViewedSteps = new Set();
            contactFormCompletedSteps = new Set();
            delete contactForm.dataset.pendingLeadEventId;
            trackGoogleEvent('ed_form_restart', {
                form_name: 'B2C consultation',
                hero_variant: heroMessageVariant
            });
            showContactFormStep(1, true);
        });
        showContactFormStep(1);

        const isLocalSuccessPreview = getQueryParam('preview') === 'success'
            && ['', 'localhost', '127.0.0.1'].includes(window.location.hostname);
        if (isLocalSuccessPreview) {
            const successName = contactForm.querySelector('[data-success-name]');
            if (successName) successName.textContent = '홍길동님';
            showContactFormStep(3);
        }

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (contactForm.dataset.submitting === 'true') return;

            if (!validateRequiredCheckboxGroups(contactForm)) {
                return;
            }

            const name = document.getElementById('name').value;
            const phone = [
                document.getElementById('phone1').value,
                document.getElementById('phone2').value,
                document.getElementById('phone3').value
            ].join('-');

            setSubmitting(contactForm, true);
            trackGoogleEvent('ed_form_submit_attempt', {
                form_name: 'B2C consultation',
                form_step: 2,
                hero_variant: heroMessageVariant,
                optional_level_provided: Boolean(getRadioValue(contactForm, 'level')),
                optional_goal_provided: Boolean(getCheckedValues(contactForm, 'reason'))
            });
            trackHeroVariantStage('submit', heroMessageVariant);

            try {
                const leadEventId = contactForm.dataset.pendingLeadEventId || createTrackingId('lead');
                contactForm.dataset.pendingLeadEventId = leadEventId;
                const submission = await submitLead({
                    type: '개인 상담',
                    nameOrCompany: name,
                    phone,
                    email: '',
                    gender: getRadioValue(contactForm, 'gender'),
                    level: getRadioValue(contactForm, 'level'),
                    experience: getCheckedValues(contactForm, 'experience'),
                    goal: getCheckedValues(contactForm, 'reason'),
                    contactTime: getRadioValue(contactForm, 'contact_time'),
                    employeeCount: '',
                    managerName: '',
                    message: '',
                    privacyAgree: contactForm.querySelector('input[name="privacy_agree"]').checked ? '동의' : '미동의'
                }, leadEventId);

                if (!submission.duplicate) {
                    trackMetaEvent('CompleteRegistration', {
                        content_name: 'Consultation reservation',
                        content_category: 'B2C'
                    }, { eventID: submission.leadEventId });
                    trackGoogleEvent('generate_lead', {
                        form_name: 'B2C consultation',
                        lead_type: 'B2C',
                        lead_event_id: submission.leadEventId
                    });
                    trackGoogleEvent('ed_lead_complete');
                    trackHeroVariantStage('lead', heroMessageVariant);
                    trackNaverLead();
                }
                delete contactForm.dataset.pendingLeadEventId;
                const successName = contactForm.querySelector('[data-success-name]');
                if (successName) successName.textContent = `${name}님`;
                contactForm.reset();
                clearFormErrors(contactForm);
                contactFormStarted = false;
                showContactFormStep(3, true);
            } catch (error) {
                alert(`${error.message}\n잠시 후 다시 시도해 주세요.`);
            } finally {
                setSubmitting(contactForm, false);
            }
        });
    }

    const businessForm = document.getElementById('businessForm');
    if (businessForm) {
        setupRequiredCheckboxGroups(businessForm);
        businessForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (businessForm.dataset.submitting === 'true') return;

            if (!validateRequiredCheckboxGroups(businessForm)) {
                return;
            }

            const companyName = document.getElementById('company-name').value;

            setSubmitting(businessForm, true);

            try {
                const leadEventId = businessForm.dataset.pendingLeadEventId || createTrackingId('lead');
                businessForm.dataset.pendingLeadEventId = leadEventId;
                const submission = await submitLead({
                    type: '기업교육 문의',
                    nameOrCompany: companyName,
                    phone: '',
                    email: document.getElementById('business-email').value,
                    gender: '',
                    level: '',
                    experience: '',
                    goal: getCheckedValues(businessForm, 'business_goal'),
                    contactTime: '',
                    employeeCount: document.getElementById('employee-count').value,
                    managerName: document.getElementById('manager-name').value,
                    message: document.getElementById('business-message').value,
                    privacyAgree: businessForm.querySelector('input[name="privacy_agree"]')?.checked ? '동의' : '미동의'
                }, leadEventId);

                if (!submission.duplicate) {
                    trackMetaEvent('CompleteRegistration', {
                        content_name: 'Business education inquiry',
                        content_category: 'B2B'
                    }, { eventID: submission.leadEventId });
                    trackGoogleEvent('generate_lead', {
                        form_name: 'B2B inquiry',
                        lead_type: 'B2B',
                        lead_event_id: submission.leadEventId
                    });
                    trackNaverLead();
                }
                delete businessForm.dataset.pendingLeadEventId;
                alert(`${companyName} 기업교육 문의가 접수되었습니다. 담당자가 곧 연락드리겠습니다.`);
                businessForm.reset();
                clearFormErrors(businessForm);
            } catch (error) {
                alert(`${error.message}\n잠시 후 다시 시도해 주세요.`);
            } finally {
                setSubmitting(businessForm, false);
            }
        });
    }
});
