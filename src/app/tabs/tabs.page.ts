import { Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { language, time, settings } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home">
          <ion-icon name="language"></ion-icon>
          <ion-label>Traduire</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="history">
          <ion-icon name="time"></ion-icon>
          <ion-label>Historique</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="settings">
          <ion-icon name="settings"></ion-icon>
          <ion-label>Paramètres</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
  styles: [`
    ion-tab-bar {
      --background: white;
      border-top: 1px solid #e0e0e0;
    }
    ion-tab-button {
      --color: #999;
      --color-selected: #667eea;
    }
  `],
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel]
})
export class TabsPage {
  constructor() {
    addIcons({ language, time, settings });
  }
}