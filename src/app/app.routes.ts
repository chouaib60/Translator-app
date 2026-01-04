import { Routes } from '@angular/router';
import { TabsPage } from './tabs/tabs.page';
import { HistoryPage } from './history/history.page';
import { SettingsPage } from './settings/settings.page';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => Promise.resolve(TabsPage),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then(m => m.HomePage),
      },
      {
        path: 'history',
        loadComponent: () => Promise.resolve(HistoryPage),
      },
      {
        path: 'settings',
        loadComponent: () => Promise.resolve(SettingsPage),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
];