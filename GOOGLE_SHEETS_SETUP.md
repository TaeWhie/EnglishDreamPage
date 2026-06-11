# Google Sheets Consultation Setup

The target spreadsheets are:

- B2B: https://docs.google.com/spreadsheets/d/1fmMPHDrZgxwEYcMQTcyHApdwiZqb2vC8ymhBsIceVxE/edit
- B2C: https://docs.google.com/spreadsheets/d/1dhhNQRXKlWE_fk6qPooAdtrjJMMy9I5bF7g1KUvSoV0/edit

## 1. Create The Apps Script

Open the spreadsheet, then go to Extensions > Apps Script. Paste this code:

```js
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

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
```

## 2. Deploy

Click Deploy > New deployment.

- Type: Web app
- Execute as: Me
- Who has access: Anyone

Copy the Web app URL.

## 3. Connect The Site

Open `site-config.js` and paste the Web app URL:

```js
window.EnglishDreamConfig = {
    metaPixelId: '',
    kakaoChatUrl: '',
    googleAppsScriptUrl: 'https://script.google.com/macros/s/DEPLOYMENT_ID/exec'
};
```

## 4. Add Dashboard Reporting

To show real GA4 and Search Console numbers in `marketing-dashboard.html`, replace the Apps Script code with the contents of:

```text
APPS_SCRIPT_REPORT_CODE.js
```

Then open Apps Script project settings and enable `Show "appsscript.json" manifest file in editor`. Update the manifest with the scopes and advanced service shown in:

```text
APPS_SCRIPT_MANIFEST_SCOPES.json
```

In Apps Script, also enable the advanced service:

- Service: Google Analytics Data API
- Identifier: `AnalyticsData`
- Version: `v1`

After saving, run any function once from the Apps Script editor to approve permissions, then deploy a new web app version.
