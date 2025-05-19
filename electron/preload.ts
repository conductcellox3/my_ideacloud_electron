import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld('api', {
    ping: () => ipcRenderer.invoke('ping'),
    saveXML: (xml: string) => ipcRenderer.invoke('save-xml', xml),
    openXML: () => ipcRenderer.invoke('open-xml')
});