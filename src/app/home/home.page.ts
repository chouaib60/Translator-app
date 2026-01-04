import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, 
  IonCardContent, IonTextarea, 
  IonButton, IonIcon, IonSpinner, IonSelect, IonSelectOption, 
  IonFabButton, IonAvatar, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  swapHorizontal, volumeHigh, copy, trash, 
  languageOutline, mic, micOutline 
} from 'ionicons/icons';
import { TranslationService } from '../services/translation.service';

// Interface pour la reconnaissance vocale
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle,
    IonContent, IonCard, IonCardContent,
    IonTextarea, IonButton, IonIcon, IonSpinner, IonSelect,
    IonSelectOption, IonFabButton, IonAvatar
  ]
})
export class HomePage implements OnInit {
  sourceText = '';
  translatedText = '';
  sourceLang = 'auto';
  targetLang = 'en';
  isTranslating = false;
  isListening = false;
  autoTranslateTimeout: any;
  recognition: any;

  constructor(
    private translationService: TranslationService,
    private toastController: ToastController
  ) {
    addIcons({ 
      swapHorizontal, volumeHigh, copy, trash, 
      languageOutline, mic, micOutline 
    });
    this.initSpeechRecognition();
  }

  async ngOnInit() {
    const settings = await this.translationService.getSettings();
    this.sourceLang = settings.defaultSourceLang;
    this.targetLang = settings.defaultTargetLang;
  }

  // Initialiser la reconnaissance vocale
  initSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = this.sourceLang === 'auto' ? 'fr-FR' : `${this.sourceLang}-${this.sourceLang.toUpperCase()}`;

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        this.sourceText = transcript;
        this.isListening = false;
        
        // Traduire automatiquement après la reconnaissance
        setTimeout(() => {
          this.translateText();
        }, 500);
      };

      this.recognition.onerror = (event: any) => {
        console.error('Erreur reconnaissance vocale:', event.error);
        this.isListening = false;
        this.showToast('Erreur: ' + event.error);
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };
    }
  }

  // Démarrer la reconnaissance vocale
  startVoiceRecognition() {
    if (!this.recognition) {
      this.showToast('Reconnaissance vocale non disponible');
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    } else {
      try {
        this.recognition.lang = this.sourceLang === 'auto' ? 'fr-FR' : `${this.sourceLang}-${this.sourceLang.toUpperCase()}`;
        this.recognition.start();
        this.isListening = true;
        this.showToast('Parlez maintenant...');
      } catch (error) {
        console.error('Erreur démarrage reconnaissance:', error);
        this.showToast('Impossible de démarrer le micro');
      }
    }
  }

  onSourceTextChange() {
    clearTimeout(this.autoTranslateTimeout);
    
    this.translationService.getSettings().then(settings => {
      if (settings.autoTranslate && this.sourceText.trim()) {
        this.autoTranslateTimeout = setTimeout(() => {
          this.translateText();
        }, 1000);
      }
    });
  }

  async translateText() {
    if (!this.sourceText.trim()) {
      this.showToast('Veuillez entrer du texte');
      return;
    }

    this.isTranslating = true;
    this.translatedText = '';
    
    try {
      this.translatedText = await this.translationService.translate(
        this.sourceText,
        this.sourceLang,
        this.targetLang
      );

      await this.translationService.saveTranslation({
        sourceText: this.sourceText,
        translatedText: this.translatedText,
        sourceLang: this.sourceLang,
        targetLang: this.targetLang
      });
    } catch (error: any) {
      console.error('Translation error:', error);
      this.translatedText = 'Erreur lors de la traduction';
      this.showToast(error?.message || 'Erreur de traduction');
    } finally {
      this.isTranslating = false;
    }
  }

  swapLanguages() {
    if (this.sourceLang === 'auto') return;
    
    const temp = this.sourceLang;
    this.sourceLang = this.targetLang;
    this.targetLang = temp;
    
    const tempText = this.sourceText;
    this.sourceText = this.translatedText;
    this.translatedText = tempText;
  }

  speakText(text: string, lang: string) {
    if (!text) return;
    
    if ('speechSynthesis' in window) {
      // Arrêter toute lecture en cours
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'auto' ? 'fr-FR' : lang;
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      window.speechSynthesis.speak(utterance);
      this.showToast('Lecture en cours...');
    } else {
      this.showToast('Synthèse vocale non disponible');
    }
  }

  async copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast('Copié!');
    } catch (error) {
      this.showToast('Erreur de copie');
    }
  }

  clearText() {
    this.sourceText = '';
    this.translatedText = '';
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: 'dark'
    });
    toast.present();
  }
}
