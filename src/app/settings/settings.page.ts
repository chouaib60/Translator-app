import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
  IonLabel, IonToggle, IonSelect, IonSelectOption, IonRange,
  IonListHeader, IonNote
} from '@ionic/angular/standalone';
import { TranslationService, Settings } from '../services/translation.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonToggle, IonSelect, IonSelectOption,
    IonRange, IonListHeader, IonNote
  ]
})
export class SettingsPage implements OnInit {
  settings: Settings = {
    autoTranslate: false,
    saveHistory: true,
    maxHistoryItems: 100,
    defaultSourceLang: 'auto',
    defaultTargetLang: 'en'
  };  

  languages = [
    { code: 'auto', name: 'Détecter' },
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'Anglais' },
    { code: 'es', name: 'Espagnol' },
    { code: 'de', name: 'Allemand' },
    { code: 'it', name: 'Italien' },
    { code: 'pt', name: 'Portugais' },
    { code: 'ar', name: 'Arabe' },
    { code: 'zh', name: 'Chinois' },
    { code: 'ja', name: 'Japonais' },
    { code: 'ko', name: 'Coréen' },
    { code: 'ru', name: 'Russe' },
  ];

  get targetLanguages() {
    return this.languages.filter(l => l.code !== 'auto');
  }

  constructor(private translationService: TranslationService) {}

  async ngOnInit() {
    this.settings = await this.translationService.getSettings();
  }

  async saveSettings() {
    await this.translationService.saveSettings(this.settings);
  }
}
