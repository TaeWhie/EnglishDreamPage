const fs = require('node:fs');
const path = require('node:path');
const { app, BrowserWindow, ipcMain, safeStorage, shell } = require('electron');

let mainWindow;

function secretsPath() {
    return path.join(app.getPath('userData'), 'secure-secrets.json');
}

function readSecrets() {
    try {
        return JSON.parse(fs.readFileSync(secretsPath(), 'utf8'));
    } catch {
        return {};
    }
}

function writeSecrets(secrets) {
    fs.mkdirSync(path.dirname(secretsPath()), { recursive: true });
    fs.writeFileSync(secretsPath(), JSON.stringify(secrets, null, 2));
}

function registerSecureStore() {
    ipcMain.handle('secure-store:get', (_event, key) => {
        const secrets = readSecrets();
        const encrypted = secrets[key];
        if (!encrypted) return '';

        try {
            if (!safeStorage.isEncryptionAvailable()) {
                return Buffer.from(encrypted, 'base64').toString('utf8');
            }
            return safeStorage.decryptString(Buffer.from(encrypted, 'base64'));
        } catch {
            return '';
        }
    });

    ipcMain.handle('secure-store:set', (_event, key, value) => {
        const secrets = readSecrets();
        if (!value) {
            delete secrets[key];
        } else if (safeStorage.isEncryptionAvailable()) {
            secrets[key] = safeStorage.encryptString(value).toString('base64');
        } else {
            secrets[key] = Buffer.from(value, 'utf8').toString('base64');
        }
        writeSecrets(secrets);
        return true;
    });

    ipcMain.handle('secure-store:delete', (_event, key) => {
        const secrets = readSecrets();
        delete secrets[key];
        writeSecrets(secrets);
        return true;
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 860,
        minWidth: 1100,
        minHeight: 720,
        title: 'English Dream Dashboard',
        backgroundColor: '#eef3f7',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    });

    mainWindow.removeMenu();
    mainWindow.loadFile(path.join(__dirname, 'lock.html'));

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
        const allowed = url.startsWith('file://');
        if (!allowed) {
            event.preventDefault();
            shell.openExternal(url);
        }
    });
}

app.whenReady().then(() => {
    registerSecureStore();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
