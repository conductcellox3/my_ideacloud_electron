export {};

declare global {
  interface Window {
    api: {
      saveXML: (xml: string) => Promise<{ canceled: boolean; filePath?: string }>;
      openXML: () => Promise<{ canceled: boolean; data: string | null }>;
      ping: () => Promise<any>;
    };
  }
}
