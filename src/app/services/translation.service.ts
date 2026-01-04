import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface Translation {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: Date;
  isFavorite?: boolean;
}

export interface Settings {
  autoTranslate: boolean;
  saveHistory: boolean;
  maxHistoryItems: number;
  defaultSourceLang: string;
  defaultTargetLang: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly HISTORY_KEY = 'translation_history';
  private readonly SETTINGS_KEY = 'app_settings';

  private defaultSettings: Settings = {
    autoTranslate: false,
    saveHistory: true,
    maxHistoryItems: 100,
    defaultSourceLang: 'auto',
    defaultTargetLang: 'en'
  };

  async translate(text: string, sourceLang: string, targetLang: string): Promise<string> {
    try {
      // If a LibreTranslate API key is configured, prefer that API (may require API key depending on instance).
      if ((environment as any).libreTranslateKey) {
        const res = await fetch('https://libretranslate.com/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: text,
            source: sourceLang === 'auto' ? 'auto' : sourceLang,
            target: targetLang,
            format: 'text',
            api_key: (environment as any).libreTranslateKey
          })
        });

        if (!res.ok) {
          const body = await res.text();
          throw new Error(`LibreTranslate error: ${res.status} ${body}`);
        }

        const data = await res.json();
        return (data.translatedText || data.translated_text || data.translation || String(data));
      }

      // Default fallback: MyMemory public API (no API key required for small usage)
      const src = sourceLang === 'auto' ? 'en' : sourceLang; // MyMemory doesn't support 'auto' detect; default to 'en'
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(src + '|' + targetLang)}`;
      const res = await fetch(url);

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`MyMemory error: ${res.status} ${body}`);
      }

      const data = await res.json();
      return data.responseData?.translatedText || '';
    } catch (error: any) {
      console.error('Translation failed:', error);
      throw new Error(error?.message || 'Translation failed');
    }
  }

  async saveTranslation(translation: Omit<Translation, 'id' | 'timestamp'>): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.saveHistory) return;
    const history = await this.getHistory();
    const newTranslation: Translation = {
      ...translation,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    history.unshift(newTranslation);
    if (history.length > settings.maxHistoryItems) {
      history.splice(settings.maxHistoryItems);
    }
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
  }

  async getHistory(): Promise<Translation[]> {
    const data = localStorage.getItem(this.HISTORY_KEY);
    if (!data) return [];
    const history = JSON.parse(data);
    return history.map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp)
    }));
  }

  async deleteTranslation(id: string): Promise<void> {
    const history = await this.getHistory();
    const filtered = history.filter(t => t.id !== id);
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(filtered));
  }

  async toggleFavorite(id: string): Promise<void> {
    const history = await this.getHistory();
    const translation = history.find(t => t.id === id);
    if (translation) {
      translation.isFavorite = !translation.isFavorite;
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    }
  }

  async clearHistory(): Promise<void> {
    localStorage.removeItem(this.HISTORY_KEY);
  }

  async getSettings(): Promise<Settings> {
    const data = localStorage.getItem(this.SETTINGS_KEY);
    if (!data) return this.defaultSettings;
    return { ...this.defaultSettings, ...JSON.parse(data) };
  }

  async saveSettings(settings: Settings): Promise<void> {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
  }
}