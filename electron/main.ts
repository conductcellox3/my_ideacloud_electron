import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

const isDev = !app.isPackaged;

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
        },
    });

    if (isDev) {
        win.loadURL('http://localhost:3000');
        win.webContents.openDevTools();
    } else {
        win.loadFile(path.join(__dirname, '../renderer/index.html'));
    }
}

ipcMain.handle('save-xml', async (_event, xml: string) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
        filters: [{ name: 'XML Files', extensions: ['xml'] }],
        properties: ['createDirectory']
    });
    if (canceled || !filePath) return { canceled: true };
    await fs.promises.writeFile(filePath, xml, 'utf-8');
    return { canceled: false, filePath };
});

ipcMain.handle('open-xml', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        filters: [{ name: 'XML Files', extensions: ['xml'] }],
        properties: ['openFile']
    });
    if (canceled || filePaths.length === 0) return { canceled: true, data: null };
    const data = await fs.promises.readFile(filePaths[0], 'utf-8');
    return { canceled: false, data };
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});