import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList,
  IonLabel, IonIcon, IonButton, IonButtons, IonSearchbar, IonSegment,
  IonSegmentButton, IonCard, IonCardContent,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trash, star, starOutline, copy, time } from 'ionicons/icons';
import { TranslationService, Translation } from '../services/translation.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonLabel, IonIcon, IonButton, IonButtons,
    IonSearchbar, IonSegment, IonSegmentButton, IonCard, IonCardContent
  ]
})
export class HistoryPage implements OnInit {
  history: Translation[] = [];
  filteredHistory: Translation[] = [];
  searchQuery = '';
  filterType = 'all';

  languages = [
    { code: 'auto', name: 'Auto' },
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

  constructor(
    private translationService: TranslationService,
    private alertController: AlertController
  ) {
    addIcons({ trash, star, starOutline, copy, time });
  }

  async ngOnInit() {
    await this.loadHistory();
  }

  async ionViewWillEnter() {
    await this.loadHistory();
  }

  async loadHistory() {
    this.history = await this.translationService.getHistory();
    this.filterHistory();
  }

  filterHistory() {
    let filtered = this.history;

    if (this.filterType === 'favorites') {
      filtered = filtered.filter(item => item.isFavorite);
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.sourceText.toLowerCase().includes(query) ||
        item.translatedText.toLowerCase().includes(query)
      );
    }

    this.filteredHistory = filtered;
  }

  async toggleFavorite(item: Translation) {
    await this.translationService.toggleFavorite(item.id);
    await this.loadHistory();
  }

  async deleteItem(id: string) {
    const alert = await this.alertController.create({
      header: 'Confirmer',
      message: 'Supprimer cette traduction ?',
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Supprimer',
          role: 'destructive',
          handler: async () => {
            await this.translationService.deleteTranslation(id);
            await this.loadHistory();
          }
        }
      ]
    });
    await alert.present();
  }

  async clearHistory() {
    const alert = await this.alertController.create({
      header: 'Confirmer',
      message: 'Effacer tout l\'historique ?',
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Effacer',
          role: 'destructive',
          handler: async () => {
            await this.translationService.clearHistory();
            await this.loadHistory();
          }
        }
      ]
    });
    await alert.present();
  }

  copyTranslation(text: string) {
    navigator.clipboard.writeText(text);
  }

  getLanguageName(code: string): string {
    return this.languages.find(l => l.code === code)?.name || code;
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Aujourd\'hui';
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} jours`;
    return date.toLocaleDateString('fr-FR');
  }
}
