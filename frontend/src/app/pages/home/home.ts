import { Component, OnDestroy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { UserProfileService } from '../../core/user-profile.service';
import { Subscription } from 'rxjs';
import { ProfilePanelComponent } from '../../shared/profile-panel/profile-panel';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, ProfilePanelComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnDestroy {
  private auth = inject(Auth);
  private profileSvc = inject(UserProfileService);
  private sub = new Subscription();
  showProfile = signal(false);

  openProfile()  { this.showProfile.set(true); }
  closeProfile() { this.showProfile.set(false); }
  toggleProfile(){ this.showProfile.update(v => !v); }


  /** Nome que será exibido no “Fala Aí, …!” */
  firstName = signal<string>('Usuário');

  constructor() {
    // 1) Observa o documento do usuário no Firestore
    this.sub.add(
      this.profileSvc.profile$().subscribe(profile => {
        if (profile?.displayName) {
          this.firstName.set(this.getFirstName(profile.displayName));
        }
      })
    );

    // 2) Fallback: observa o Auth (caso o profile ainda não exista)
    const unsub = onAuthStateChanged(this.auth, (u) => {
      if (!u) {
        this.firstName.set('Usuário');
        return;
      }
      // Só atualiza se ainda não veio do profile
      if (!this.firstName() || this.firstName() === 'Usuário') {
        const n = u.displayName ?? (u.email?.split('@')[0] ?? 'Usuário');
        this.firstName.set(this.getFirstName(n));
      }
    });
    this.sub.add({ unsubscribe: () => unsub() });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  /** Extrai o primeiro nome de “Nome Sobrenome” → “Nome” */
  private getFirstName(fullName: string): string {
    return (fullName ?? '').trim().split(/\s+/)[0] || 'Usuário';
  }
}
