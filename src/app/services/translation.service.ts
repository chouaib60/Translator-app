import { Injectable } from '@angular/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Share } from '@capacitor/share';

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

  // Traduction avec API
  async translate(text: string, sourceLang: string, targetLang: string): Promise<string> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ 
            role: 'user', 
            content: `Translate this text from ${sourceLang} to ${targetLang}. Only provide the translation without any explanation:\n\n${text}` 
          }]
        })
      });
      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error('Translation failed');
    }
  }

  // Text-to-Speech natif (pour mobile)
  async speak(text: string, lang: string): Promise<void> {
    try {
      await TextToSpeech.speak({
        text: text,
        lang: lang === 'auto' ? 'fr-FR' : lang,
        rate: 0.9,
        pitch: 1.0,
        volume: 1.0
      });
    } catch (error) {
      // Fallback vers Web Speech API
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        window.speechSynthesis.speak(utterance);
      }
    }
  }

  // Partager la traduction
  async shareTranslation(text: string): Promise<void> {
    try {
      await Share.share({
        title: 'Traduction',
        text: text,
        dialogTitle: 'Partager la traduction'
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  }

  // Sauvegarder une traduction
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