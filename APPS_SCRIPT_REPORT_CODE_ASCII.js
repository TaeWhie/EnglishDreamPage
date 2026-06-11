const SETTINGS = {
  ga4PropertyId: '539275278'
};

const ROUTES = {
  B2B: {
    spreadsheetId: '1fmMPHDrZgxwEYcMQTcyHApdwiZqb2vC8ymhBsIceVxE',
    headers: [
      'createdAt',
      'type',
      'company',
      'manager',
      'email',
      'employeeCount',
      'goal',
      'message',
      'pageUrl',
      'referrer',
      'userAgent',
      'status'
    ]
  },
  B2C: {
    spreadsheetId: '1dhhNQRXKlWE_fk6qPooAdtrjJMMy9I5bF7g1KUvSoV0',
    headers: [
      'createdAt',
      'type',
      'name',
      'phone',
      'gender',
      'level',
      'experience',
      'goal',
      'contactTime',
      'privacyAgree',
      'pageUrl',
      'referrer',
      'userAgent',
      'status'
    ]
  }
};

function getRoute(data) {
  if (data.employeeCount || data.managerName || data.email) {
    return ROUTES.B2B;
  }
  return ROUTES.B2C;
}

function jsonOutput(payload, callback) {
  const text = callback
    ? callback + '(' + JSON.stringify(payload) + ');'
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
  return AnalyticsData.Properties.runReport(request, 'properties/' + SETTINGS.ga4PropertyId);
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
  return (report.rows || []).map(function(row) {
    const rawDate = dimensionValue(row, 0);
    return {
      date: rawDate,
      label: rawDate.slice(4, 6) + '/' + rawDate.slice(6, 8),
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
  return (report.rows || []).map(function(row) {
    return {
      name: dimensionValue(row, 0),
      sessions: metricValue(row, 0)
    };
  });
}

function getReport(period) {
  const totals = getGaTotals(period);
  totals.leads = getGaLeadCount(period);
  return {
    ok: true,
    period: period || 'last_7d',
    generatedAt: new Date().toISOString(),
    ga: {
      totals: totals,
      daily: getGaDaily(period),
      sources: getGaSources(period)
    },
    searchConsole: {
      enabled: false,
      queries: []
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
        'new'
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
        'new'
      ]);
    }

    return jsonOutput({ ok: true }, '');
  } catch (error) {
    return jsonOutput({ ok: false, error: error.message }, '');
  } finally {
    lock.releaseLock();
  }
}
