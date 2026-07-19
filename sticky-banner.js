(() => {
    const pageFile = (window.location.pathname.split('/').pop() || 'index').toLowerCase();
    const pageKey = pageFile.replace(/\.html$/, '') || 'index';
    const banners = {
        index: {
            eyebrow: '10분 무료 레벨 진단',
            title: '지금 내 영어 레벨을 확인해 보세요',
            detail: '상담 후 결제 의무 없이 원하는 시간에 연락드립니다.',
            button: '무료 진단 신청',
            href: '#reservation',
            hideSelector: '#reservation'
        },
        b2b: {
            showImmediately: true,
            eyebrow: '기업 맞춤 영어교육',
            title: '우리 조직에 맞는 영어교육 설계를 받아보세요',
            detail: '교육 인원과 목표를 확인한 뒤 맞춤 운영안을 안내합니다.',
            button: '기업교육 문의',
            href: '#b2b-inquiry'
        },
        curriculum: {
            showImmediately: true,
            eyebrow: '과정 선택이 고민이라면',
            title: '내 목표에 맞는 커리큘럼을 안내받아 보세요',
            detail: '현재 실력과 학습 목적에 맞춰 과정과 레벨을 추천합니다.',
            button: '과정 상담',
            href: 'index.html#reservation'
        },
        'adult-online-english': {
            showImmediately: true,
            eyebrow: '바쁜 성인도 10분 무료 진단',
            title: '내 일정과 목표에 맞는 1:1 수업을 찾아보세요',
            detail: '업무·여행·일상 중 필요한 상황부터 상담해 드립니다.',
            button: '무료 진단 예약',
            href: 'index.html#reservation'
        },
        'beginner-english-conversation': {
            showImmediately: true,
            eyebrow: '왕초보도 부담 없이',
            title: '지금 말할 수 있는 한마디부터 확인해 보세요',
            detail: '결제 의무 없이 현재 수준과 첫 학습 단계를 안내합니다.',
            button: '왕초보 무료 상담',
            href: 'index.html#reservation'
        },
        'managed-english-conversation': {
            showImmediately: true,
            eyebrow: '수업 밖 학습까지 관리',
            title: '혼자 멈추지 않는 학습 흐름을 설계해 보세요',
            detail: '목표와 생활 일정에 맞춘 수업·복습 계획을 안내합니다.',
            button: '관리형 학습 상담',
            href: 'index.html#reservation'
        },
        faq: {
            showImmediately: true,
            eyebrow: '궁금한 점이 남았다면',
            title: '내 상황에 맞춰 정확하게 상담받아 보세요',
            detail: '수업 방식과 일정, 수강료를 상담에서 자세히 안내합니다.',
            button: '무료 상담',
            href: 'index.html#reservation'
        },
        policy: {
            showImmediately: true,
            eyebrow: '수강규정을 확인하셨나요?',
            title: '내 일정에 맞는 수강 방법을 상담받아 보세요',
            detail: '수업 시간과 횟수, 변경 가능 범위를 함께 안내합니다.',
            button: '수강 상담',
            href: 'index.html#reservation'
        },
        privacy: {
            showImmediately: true,
            eyebrow: '안심하고 상담하세요',
            title: '상담에 필요한 정보만 간단히 받고 있습니다',
            detail: '무료 레벨 진단과 학습 상담부터 부담 없이 시작할 수 있습니다.',
            button: '상담 예약',
            href: 'index.html#reservation'
        },
        terms: {
            showImmediately: true,
            eyebrow: '영어 학습을 시작하고 싶다면',
            title: '10분 무료 진단으로 현재 실력부터 확인해 보세요',
            detail: '상담 후 결제 의무 없이 필요한 과정만 안내받을 수 있습니다.',
            button: '무료 진단',
            href: 'index.html#reservation'
        }
    };
    const config = banners[pageKey];
    if (!config || document.getElementById('stickyConversionBar')) return;

    const bar = document.createElement('aside');
    bar.className = 'sticky-conversion-bar';
    bar.id = 'stickyConversionBar';
    bar.setAttribute('aria-label', `${config.button} 안내`);
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = `
        <div class="sticky-conversion-inner">
            <div class="sticky-conversion-copy">
                <span>${config.eyebrow}</span>
                <strong>${config.title}</strong>
                <small>${config.detail}</small>
            </div>
            <a href="${config.href}" class="sticky-conversion-cta" data-cta-location="sticky_${pageKey}">${config.button}</a>
            <button type="button" class="sticky-conversion-close" aria-label="하단 안내 배너 닫기">×</button>
        </div>
    `;
    document.body.appendChild(bar);

    const closeButton = bar.querySelector('.sticky-conversion-close');
    const ctaButton = bar.querySelector('.sticky-conversion-cta');
    const hideTarget = config.hideSelector ? document.querySelector(config.hideSelector) : null;
    let dismissed = false;
    let hideTargetVisible = false;

    const setVisible = (shouldShow) => {
        const isVisible = Boolean(shouldShow && !dismissed && !hideTargetVisible);
        bar.classList.toggle('is-visible', isVisible);
        bar.setAttribute('aria-hidden', String(!isVisible));
        document.body.classList.toggle('sticky-cta-visible', isVisible);
    };

    const syncVisibility = () => {
        const revealPoint = Math.min(window.innerHeight * 0.65, 560);
        setVisible(config.showImmediately || window.scrollY > revealPoint);
    };

    closeButton.addEventListener('click', () => {
        dismissed = true;
        window.gtag?.('event', 'ed_sticky_cta_dismiss', { page_context: pageKey });
        setVisible(false);
    });

    ctaButton.addEventListener('click', () => {
        window.gtag?.('event', 'ed_sticky_cta_click', {
            page_context: pageKey,
            destination: config.href
        });
    });

    if (hideTarget && 'IntersectionObserver' in window) {
        const targetObserver = new IntersectionObserver((entries) => {
            hideTargetVisible = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio > 0.04);
            syncVisibility();
        }, { threshold: [0, 0.04, 0.2] });
        targetObserver.observe(hideTarget);
    }

    window.addEventListener('scroll', syncVisibility, { passive: true });
    window.addEventListener('resize', syncVisibility);
    syncVisibility();
})();
