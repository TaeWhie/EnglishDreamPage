# English Dream Dashboard App

Private Electron wrapper for `marketing-dashboard.html`.

## Development

```powershell
cd dashboard-app
npm install
npm start
```

On first launch, set a local dashboard password. The password hash and Meta token are stored only in this app's local storage on the current PC.

## Build Windows Executable Folder

```powershell
cd dashboard-app
npm run build
```

The generated app will be created in `dashboard-app/dist/win-unpacked`.
Run `English Dream Dashboard.exe` inside that folder.

`npm run build:portable` is also available, but it can require Windows symbolic-link permissions while electron-builder unpacks its signing tools. The folder build avoids that permission issue.

## Notes

- The app still needs internet access for Google Apps Script, GA4 report data, and Meta Insights.
- Do not publish this dashboard publicly. It can display consultation records and ad account data.
- Run `npm run sync` after changing `marketing-dashboard.html` or `site-config.js`.
