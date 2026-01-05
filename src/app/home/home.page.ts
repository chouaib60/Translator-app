import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Capacitor } from '@capacitor/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, 
  IonCardContent, IonTextarea, IonButton, IonIcon, 
  IonSpinner, IonSelect, IonSelectOption, IonFabButton, 
  IonAvatar, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  swapHorizontal, volumeHigh, copy, trash, 
  languageOutline, mic, micOutline, shareOutline
} from 'ionicons/icons';
import { TranslationService } from '../services/translation.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle,
    IonContent, IonCard, IonCardContent, IonTextarea, IonButton, 
    IonIcon, IonSpinner, IonSelect, IonSelectOption, IonFabButton, 
    IonAvatar
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
  isNative = false;
  nativeSpeechPlugin: any;

  constructor(
    private translationService: TranslationService,
    private toastController: ToastController
  ) {
    addIcons({ 
      swapHorizontal, volumeHigh, copy, trash, 
      languageOutline, mic, micOutline, shareOutline
    });
    
    // Détecter si on est sur mobile natif
    this.isNative = Capacitor.isNativePlatform();
    
    if (this.isNative) {
      // Préparer le fallback natif (plugin Cordova/Capacitor)
      this.initNativeSpeechRecognition();
    } else {
      this.initSpeechRecognition();
    }
  }

  async ngOnInit() {
    const settings = await this.translationService.getSettings();
    this.sourceLang = settings.defaultSourceLang;
    this.targetLang = settings.defaultTargetLang;
  }

  // Reconnaissance vocale (Web)
  initSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = this.sourceLang === 'auto' ? 'fr-FR' : `${this.sourceLang}-${this.sourceLang.toUpperCase()}`;

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.sourceText = transcript;
        this.isListening = false;
        setTimeout(() => this.translateText(), 500);
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        this.showToast('Erreur: ' + event.error);
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };
    }
  }

  // Reconnaissance vocale (Native fallback - Cordova/Capacitor plugin expected)
  async initNativeSpeechRecognition() {
    const win = window as any;
    const sr = win.plugins?.speechRecognition || win.SpeechRecognition;
    if (!sr) {
      console.warn('Plugin de reconnaissance vocale natif non trouvé');
      this.showToast('Plugin vocal non trouvé. Executez `npx cap sync android` puis rebuild.');
      return;
    }

    this.nativeSpeechPlugin = sr;

    // Vérifier et demander la permission micro si nécessaire
    try {
      if (sr.hasPermission) {
        sr.hasPermission((granted: boolean) => {
          if (!granted && sr.requestPermission) {
            sr.requestPermission(() => {}, (err: any) => this.showToast('Permission micro refusée'));
          }
        }, (err: any) => console.warn('hasPermission error', err));
      }
    } catch (error) {
      console.warn('Erreur init speech plugin', error);
    }
  }

  startVoiceRecognition() {
    // Native path (Cordova plugin like cordova-plugin-speechrecognition)
    if (this.isNative) {
      const win = window as any;
      const sr = this.nativeSpeechPlugin || win.plugins?.speechRecognition || win.SpeechRecognition;
      if (!sr) {
        this.showToast('Reconnaissance vocale non disponible sur cet appareil');
        return;
      }

      // Request permission if necessary
      try {
        if (sr.hasPermission) {
          sr.hasPermission((granted: boolean) => {
            if (!granted && sr.requestPermission) {
              sr.requestPermission(() => {}, (err: any) => this.showToast('Permission micro refusée'));
            }
          }, (err: any) => {
            console.warn('hasPermission error', err);
          });
        }

        if (this.isListening) {
          // Try to stop native listening
          if (sr.stopListening) sr.stopListening();
          this.isListening = false;
        } else {
          const options: any = {
            language: this.sourceLang === 'auto' ? 'fr-FR' : this.sourceLang,
            matches: 1,
            prompt: 'Parlez maintenant',
            showPopup: false
          };

          if (sr.startListening) {
            sr.startListening((matches: string[]) => {
              this.sourceText = matches && matches[0] ? matches[0] : '';
              this.isListening = false;
              setTimeout(() => this.translateText(), 500);
            }, (err: any) => {
              this.isListening = false;
              this.showToast('Erreur micro: ' + (err && err.message ? err.message : err));
            }, options);

            this.isListening = true;
            this.showToast('Parlez maintenant...');
          } else {
            this.showToast('Plugin de reconnaissance non compatible');
          }
        }
      } catch (error) {
        console.error('Native speech error', error);
        this.showToast('Impossible de démarrer le micro');
      }

      return;
    }

    // Web path
    if (!this.recognition) {
      this.showToast('Reconnaissance vocale non disponible');
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
    } else {
      try {
        this.recognition.lang = this.sourceLang === 'auto' ? 'fr-FR' : `${this.sourceLang}`;
        this.recognition.start();
        this.isListening = true;
        this.showToast('Parlez maintenant...');
      } catch (error) {
        this.showToast('Impossible de démarrer le micro');
      }
    }
  }

  onSourceTextChange() {
    clearTimeout(this.autoTranslateTimeout);
    this.translationService.getSettings().then(settings => {
      if (settings.autoTranslate && this.sourceText.trim()) {
        this.autoTranslateTimeout = setTimeout(() => this.translateText(), 1000);
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
      const msg = error?.message || 'Erreur de traduction';
      this.showToast(msg);
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

  async speakText(text: string, lang: string) {
    if (!text) return;
    
    if (this.isNative) {
      // Utiliser le TTS natif
      await this.translationService.speak(text, lang);
    } else {
      // Utiliser Web Speech API
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === 'auto' ? 'fr-FR' : lang;
        window.speechSynthesis.speak(utterance);
      }
    }
    this.showToast('Lecture en cours...');
  }

  async shareTranslation() {
    if (!this.translatedText) return;
    await this.translationService.shareTranslation(
      `${this.sourceText}\n\n→\n\n${this.translatedText}`
    );
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
