import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { AuthService } from './core/services/auth.service';
import { NegocioService } from './core/services/negocio.service';

const TITULO_BASE = 'Gonzai';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private readonly titleService = inject(Title);
  private readonly auth = inject(AuthService);
  private readonly negocioService = inject(NegocioService);

  title = 'gonzai-frontend';

  constructor() {
    // Pestaña del navegador: "Gonzai" sin sesión, "Gonzai - <nombre de la empresa>" logueado.
    // Reacciona tanto al login/logout como a editar el nombre comercial en Configuración.
    effect(() => {
      if (!this.auth.currentUser()) {
        this.titleService.setTitle(TITULO_BASE);
        return;
      }

      const negocio = this.negocioService.actual();
      this.titleService.setTitle(negocio ? `${TITULO_BASE} - ${negocio.nombreComercial}` : TITULO_BASE);
    });

    // Dispara la carga del negocio al iniciar sesión (o si ya había sesión al recargar la página).
    effect(() => {
      if (this.auth.currentUser()) {
        this.negocioService.get().subscribe({ error: () => {} });
      }
    });
  }
}
