const APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL
    || 'https://script.google.com/macros/s/AKfycbzAlBfUK7n8QvbhdIEFUwD-VTDteuJ0ZQCG-ux7wR8QYMLVJsKoVhmMf2UUx_V36a4U/exec';

function send(response, status, payload) {
    response.status(status);
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    response.send(JSON.stringify(payload));
}

function allowedOrigin(origin) {
    if (!origin) return true;
    try {
        const url = new URL(origin);
        return url.protocol === 'https:' && (
            url.hostname === 'engdream.com'
            || url.hostname === 'www.engdream.com'
            || url.hostname === 'english-dream-page.vercel.app'
            || url.hostname.endsWith('-xognl427-1598s-projects.vercel.app')
        );
    } catch {
        return false;
    }
}

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST');
        return send(response, 405, { ok: false, error: 'POST 요청만 지원합니다.' });
    }
    if (!allowedOrigin(request.headers.origin)) {
        return send(response, 403, { ok: false, error: '허용되지 않은 요청입니다.' });
    }

    const payload = typeof request.body === 'string' ? JSON.parse(request.body || '{}') : (request.body || {});
    const type = String(payload.type || '');
    const name = String(payload.nameOrCompany || '').trim();
    const leadEventId = String(payload.lead_event_id || '').trim();
    if (!['개인 상담', '기업교육 문의'].includes(type) || !name || !leadEventId) {
        return send(response, 400, { ok: false, error: '필수 상담 정보가 누락되었습니다.' });
    }
    if (JSON.stringify(payload).length > 50000) {
        return send(response, 413, { ok: false, error: '상담 요청 데이터가 너무 큽니다.' });
    }

    try {
        const upstream = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(12000)
        });
        const text = await upstream.text();
        let result;
        try {
            result = JSON.parse(text);
        } catch {
            result = null;
        }
        if (!upstream.ok || !result?.ok) {
            throw new Error(result?.error || `상담 저장 서버 오류 (${upstream.status})`);
        }
        return send(response, 200, {
            ok: true,
            leadEventId,
            duplicate: Boolean(result.duplicate)
        });
    } catch (error) {
        return send(response, 502, {
            ok: false,
            error: error?.name === 'TimeoutError'
                ? '상담 저장 시간이 초과되었습니다. 다시 시도해 주세요.'
                : (error?.message || '상담 내용을 저장하지 못했습니다.')
        });
    }
}
