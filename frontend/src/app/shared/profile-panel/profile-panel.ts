import { Component, EventEmitter, Input, Output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserProfileService } from '../../core/user-profile.service';
import { Auth } from '@angular/fire/auth';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-profile-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-panel.html',
  styleUrl: './profile-panel.scss'
})
export class ProfilePanelComponent {
  @Input({ required: true }) open = false;
  @Output() close = new EventEmitter<void>();

  private profileSvc = inject(UserProfileService);
  private auth = inject(Auth);

  /** Perfil do Firestore em tempo real */
  profileSig = toSignal(this.profileSvc.profile$(), { initialValue: null });

  /** Nome exibido: pego Firestore.displayName → Auth.displayName → email prefix */
  displayName = computed(() => {
    const p = this.profileSig();
    const authUser = this.auth.currentUser;
    const name =
      p?.displayName ||
      authUser?.displayName ||
      (authUser?.email ? authUser.email.split('@')[0] : 'Usuário');
    return this.firstName(name);
  });

  email = computed(() => this.auth.currentUser?.email ?? '');

  /** Exemplo de conquistas: você pode trocar pelo campo certo quando existir */
  achievements = computed(() => (this.profileSig() as any)?.achievements ?? 27);
  achievementsGoal = 200;

  firstName(full: string) {
    return (full ?? '').trim().split(/\s+/)[0] || 'Usuário';
  }

  onClose() {
    this.close.emit();
  }
}
