const SETTINGS = {
  ga4PropertyId: '539275278',
  searchConsoleProperty: 'https://www.engdream.com/',
  notificationEmails: [
    'cheerenglish@naver.com'
  ]
};

const ROUTES = {
  B2B: {
    spreadsheetId: '1fmMPHDrZgxwEYcMQTcyHApdwiZqb2vC8ymhBsIceVxE',
    headers: [
      '접수일시',
      '구분',
      '회사명',
      '담당자명',
      '이메일',
      '교육 대상 인원',
      '필요 교육',
      '문의 내용',
      '페이지 URL',
      '유입 경로',
      '사용자 에이전트',
      '상태'
    ]
  },
  B2C: {
    spreadsheetId: '1dhhNQRXKlWE_fk6qPooAdtrjJMMy9I5bF7g1KUvSoV0',
    headers: [
      '접수일시',
      '구분',
      '이름',
      '연락처',
      '성별',
      '영어회화 실력',
      '경험',
      '목적',
      '연락 가능 시간',
      '개인정보 동의',
      '페이지 URL',
      '유입 경로',
      '사용자 에이전트',
      '상태'
    ]
  }
};

function getRoute(data) {
  return data.type === '기업교육 문의' ? ROUTES.B2B : ROUTES.B2C;
}

function isNotificationEmailConfigured(email) {
  return email && !email.includes('YOUR_EMAIL');
}

function formatLeadValue(value) {
  if (Array.isArray(value)) return value.join(', ');
  return String(value || '').trim();
}

function leadEmailRows(data, route) {
  if (route === ROUTES.B2B) {
    return [
      ['구분', data.type],
      ['회사명', data.nameOrCompany],
      ['담당자명', data.managerName],
      ['이메일', data.email],
      ['교육 대상 인원', data.employeeCount],
      ['필요 교육', data.goal],
      ['문의 내용', data.message],
      ['페이지 URL', data.pageUrl],
      ['유입 경로', data.referrer],
      ['사용자 에이전트', data.userAgent]
    ];
  }

  return [
    ['구분', data.type],
    ['이름', data.nameOrCompany],
    ['연락처', data.phone],
    ['성별', data.gender],
    ['영어회화 실력', data.level],
    ['경험', data.experience],
    ['목적', data.goal],
    ['연락 가능 시간', data.contactTime],
    ['개인정보 동의', data.privacyAgree],
    ['페이지 URL', data.pageUrl],
    ['유입 경로', data.referrer],
    ['사용자 에이전트', data.userAgent]
  ];
}

function sendLeadNotification(data, route) {
  const recipients = SETTINGS.notificationEmails.filter(isNotificationEmailConfigured);
  if (!recipients.length) return;

  const submittedAt = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
  const leadName = data.nameOrCompany || '이름 없음';
  const subject = `[영어드림 상담 접수] ${data.type || '상담'} - ${leadName}`;
  const rows = leadEmailRows(data, route);
  const textBody = [
    '새 상담 접수가 들어왔습니다.',
    '',
    `접수일시: ${submittedAt}`,
    ...rows.map(([label, value]) => `${label}: ${formatLeadValue(value) || '-'}`),
    '',
    'English Dream Dashboard에서 상태를 확인해 주세요.'
  ].join('\n');
  const htmlRows = rows.map(([label, value]) => `
    <tr>
      <th style="width:150px;text-align:left;padding:8px 10px;background:#f4f7fb;border:1px solid #dfe7ef;">${label}</th>
      <td style="padding:8px 10px;border:1px solid #dfe7ef;white-space:pre-wrap;">${formatLeadValue(value) || '-'}</td>
    </tr>
  `).join('');
  const htmlBody = `
    <div style="font-family:Arial,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#172331;line-height:1.5;">
      <h2 style="margin:0 0 12px;">새 상담 접수</h2>
      <p style="margin:0 0 16px;">영어드림 사이트에서 상담 신청이 접수되었습니다.</p>
      <table style="border-collapse:collapse;width:100%;max-width:760px;font-size:14px;">
        <tr>
          <th style="width:150px;text-align:left;padding:8px 10px;background:#f4f7fb;border:1px solid #dfe7ef;">접수일시</th>
          <td style="padding:8px 10px;border:1px solid #dfe7ef;">${submittedAt}</td>
        </tr>
        ${htmlRows}
      </table>
      <p style="margin-top:16px;color:#607080;">English Dream Dashboard에서 상태를 확인해 주세요.</p>
    </div>
  `;

  MailApp.sendEmail({
    to: recipients.join(','),
    subject,
    body: textBody,
    htmlBody
  });
}

function authorizeMailPermission() {
  return MailApp.getRemainingDailyQuota();
}

function jsonOutput(payload, callback) {
  const text = callback
    ? `${callback}(${JSON.stringify(payload)});`
    : JSON.stringify(payload);
  return ContentService
    .createTextOutput(text)
    .setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

function dateString(date) {
  return Utilities.formatDate(date, 'Asia/Seoul', 'yyyy-MM-dd');
}

function dateRange(period, forSearchConsole) {
  const days = period === 'last_90d' ? 90 : period === 'last_30d' ? 30 : 7;
  const end = new Date();
  if (forSearchConsole) {
    end.setDate(end.getDate() - 1);
  }
  const start = new Date(end);
  start.setDate(start.getDate() - days + 1);
  return {
    startDate: dateString(start),
    endDate: dateString(end)
  };
}

function metricValue(row, index) {
  return Number(row && row.metricValues && row.metricValues[index] ? row.metricValues[index].value : 0);
}

function dimensionValue(row, index) {
  return row && row.dimensionValues && row.dimensionValues[index] ? row.dimensionValues[index].value : '';
}

function runGaReport(request) {
  return AnalyticsData.Properties.runReport(request, `properties/${SETTINGS.ga4PropertyId}`);
}

function getGaTotals(period) {
  const range = dateRange(period, false);
  const report = runGaReport({
    dateRanges: [range],
    metrics: [
      { name: 'activeUsers' },
      { name: 'screenPageViews' }
    ]
  });
  const row = report.rows && report.rows[0];
  return {
    visitors: metricValue(row, 0),
    pageViews: metricValue(row, 1)
  };
}

function getGaLeadCount(period) {
  const range = dateRange(period, false);
  const report = runGaReport({
    dateRanges: [range],
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        stringFilter: {
          matchType: 'EXACT',
          value: 'generate_lead'
        }
      }
    }
  });
  const row = report.rows && report.rows[0];
  return metricValue(row, 0);
}

function getGaDaily(period) {
  const range = dateRange(period, false);
  const report = runGaReport({
    dateRanges: [range],
    dimensions: [{ name: 'date' }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'screenPageViews' }
    ],
    orderBys: [{ dimension: { dimensionName: 'date' } }]
  });
  return (report.rows || []).map((row) => {
    const rawDate = dimensionValue(row, 0);
    return {
      date: rawDate,
      label: `${rawDate.slice(4, 6)}/${rawDate.slice(6, 8)}`,
      visitors: metricValue(row, 0),
      pageViews: metricValue(row, 1)
    };
  });
}

function getGaSources(period) {
  const range = dateRange(period, false);
  const report = runGaReport({
    dateRanges: [range],
    dimensions: [{ name: 'sessionSourceMedium' }],
    metrics: [{ name: 'sessions' }],
    limit: 5,
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }]
  });
  return (report.rows || []).map((row) => ({
    name: dimensionValue(row, 0),
    sessions: metricValue(row, 0)
  }));
}

function getSearchQueries(period) {
  const range = dateRange(period, true);
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SETTINGS.searchConsoleProperty)}/searchAnalytics/query`;
  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: `Bearer ${ScriptApp.getOAuthToken()}`
    },
    payload: JSON.stringify({
      startDate: range.startDate,
      endDate: range.endDate,
      dimensions: ['query'],
      rowLimit: 5
    }),
    muteHttpExceptions: true
  });
  const data = JSON.parse(response.getContentText() || '{}');
  if (response.getResponseCode() >= 400) {
    throw new Error(data.error && data.error.message ? data.error.message : 'Search Console API error');
  }
  return (data.rows || []).map((row) => ({
    query: row.keys && row.keys[0] ? row.keys[0] : '',
    clicks: Number(row.clicks || 0),
    impressions: Number(row.impressions || 0),
    ctr: Number(row.ctr || 0),
    position: Number(row.position || 0)
  }));
}

function getReport(period) {
  const totals = getGaTotals(period);
  totals.leads = getGaLeadCount(period);
  let searchQueries = [];
  let searchConsoleError = '';

  try {
    searchQueries = getSearchQueries(period);
  } catch (error) {
    searchConsoleError = error.message || String(error);
  }

  return {
    ok: true,
    period,
    generatedAt: new Date().toISOString(),
    ga: {
      totals,
      daily: getGaDaily(period),
      sources: getGaSources(period)
    },
    searchConsole: {
      property: SETTINGS.searchConsoleProperty,
      queries: searchQueries,
      error: searchConsoleError
    }
  };
}

function doGet(e) {
  const callback = e && e.parameter ? e.parameter.callback : '';
  try {
    const action = e && e.parameter ? e.parameter.action : '';
    if (action !== 'report') {
      return jsonOutput({ ok: true, message: 'English Dream API is running.' }, callback);
    }
    return jsonOutput(getReport(e.parameter.period || 'last_7d'), callback);
  } catch (error) {
    return jsonOutput({ ok: false, error: error.message }, callback);
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const data = JSON.parse(e.postData.contents || '{}');
    const route = getRoute(data);
    const sheet = SpreadsheetApp.openById(route.spreadsheetId).getSheets()[0];

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(route.headers);
    }

    if (route === ROUTES.B2B) {
      sheet.appendRow([
        new Date(),
        data.type || '',
        data.nameOrCompany || '',
        data.managerName || '',
        data.email || '',
        data.employeeCount || '',
        data.goal || '',
        data.message || '',
        data.pageUrl || '',
        data.referrer || '',
        data.userAgent || '',
        '신규'
      ]);
    } else {
      sheet.appendRow([
        new Date(),
        data.type || '',
        data.nameOrCompany || '',
        data.phone || '',
        data.gender || '',
        data.level || '',
        data.experience || '',
        data.goal || '',
        data.contactTime || '',
        data.privacyAgree || '',
        data.pageUrl || '',
        data.referrer || '',
        data.userAgent || '',
        '신규'
      ]);
    }

    sendLeadNotification(data, route);

    return jsonOutput({ ok: true }, '');
  } catch (error) {
    return jsonOutput({ ok: false, error: error.message }, '');
  } finally {
    lock.releaseLock();
  }
}
