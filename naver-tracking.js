(() => {
    const NAVER_ACCOUNT_ID = 's_2e3fdafe7aa';
    const WCS_SCRIPT_SRC = 'https://wcs.naver.net/wcslog.js';

    let wcsScriptPromise;

    const loadWcsScript = () => {
        if (window.wcs) {
            return Promise.resolve();
        }

        if (wcsScriptPromise) {
            return wcsScriptPromise;
        }

        wcsScriptPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.async = true;
            script.dataset.edNaverTrackingLoader = 'true';
            script.src = WCS_SCRIPT_SRC;
            script.addEventListener('load', () => resolve(), { once: true });
            script.addEventListener('error', reject, { once: true });
            document.head.appendChild(script);
        });

        return wcsScriptPromise;
    };

    const configureNaverTracking = () => {
        if (!window.wcs) return false;

        window.wcs_add = window.wcs_add || {};
        window.wcs_add["wa"] = NAVER_ACCOUNT_ID;
        window._nasa = window._nasa || {};
        window.wcs.inflow('engdream.com');
        return true;
    };

    const withNaverTracking = (callback) => {
        loadWcsScript()
            .then(() => {
                if (!configureNaverTracking()) return;
                callback();
            })
            .catch(() => {});
    };

    const trackPageView = () => {
        withNaverTracking(() => {
            if (typeof window.wcs_do === 'function') {
                window.wcs_do();
            }
        });
    };

    window.EnglishDreamNaverTracking = {
        trackLead() {
            withNaverTracking(() => {
                if (typeof window.wcs.trans !== 'function') return;

                window.wcs.trans({
                    type: 'lead'
                });
            });
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', trackPageView, { once: true });
    } else {
        trackPageView();
    }
})();
