import { Component, EventEmitter, Input, Output, inject, computed, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserProfileService } from '../../core/user-profile.service';
import { AuthService } from '../../core/auth.service';
import { Router } from '@angular/router';
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
  private auth = inject(AuthService);
  private router = inject(Router);

  confirmOpen = false;
  logginOut = false;

  @ViewChild('confirmBtn', { static: false }) confirmBtn?: ElementRef<HTMLButtonElement>;

  /** Perfil do Firestore em tempo real */
  profileSig = toSignal(this.profileSvc.profile$(), { initialValue: null });

  /** Nome exibido: pego Firestore.displayName → Auth.displayName → email prefix */
  displayName = computed(() => {
    const p = this.profileSig();
    const fallback = 'Usuário';
    const name =  p?.displayName || p?.email?.split('@')[0] || fallback;
    return this.firstName(name);
  });

  email = computed(() => this.profileSig()?.email ?? '');

  /** Exemplo de conquistas: você pode trocar pelo campo certo quando existir */
  achievements = computed(() => (this.profileSig() as any)?.achievements ?? 27);
  achievementsGoal = 200;

  firstName(full: string) {
    return (full ?? '').trim().split(/\s+/)[0] || 'Usuário';
  }

  onClose() {
    this.close.emit();
  }

/* ====== Confirmação customizada ====== */
  openConfirm() {
    if (this.logginOut) return;
    this.confirmOpen = true;
    // dá tempo do HTML renderizar para focar
    setTimeout(() => this.confirmBtn?.nativeElement.focus(), 0);
  }
  closeConfirm() {
    if (this.logginOut) return;
    this.confirmOpen = false;
  }

  /** Fecha o modal ao apertar ESC */
  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.confirmOpen) this.closeConfirm();
  }

  /** Aciona o logout ao confirmar */
  async confirmLogout() {
    if (this.logginOut) return;
    this.logginOut = true;
    try {
      await this.auth.logout();
      this.closeConfirm();
      this.onClose();
      await this.router.navigateByUrl('/login');
    } catch (e) {
      console.error('Erro ao sair:', e);
      alert('Não foi possível sair. Tente novamente.');
    } finally {
      this.logginOut = false;
    }
  }
}