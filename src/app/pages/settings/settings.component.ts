import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NegocioService } from '../../core/services/negocio.service';
import { FormatoComprobante, NegocioResponse } from '../../core/models/negocio.model';
import { parseApiError } from '../../core/utils/api-error';

const LOGO_MAX_BYTES = 500 * 1024;
const LOGO_MAX_PX = 2000;

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['../../shared/styles/gz-ui.css', './settings.component.css'],
})
export class SettingsComponent implements OnInit, OnDestroy {
  private readonly negocioService = inject(NegocioService);

  loading = true;
  saving = false;
  uploading = false;
  error = '';
  formError = '';
  logoError = '';
  saved = '';

  nombreComercial = '';
  telefono = '';
  ciudad = '';
  correoRespuesta = '';
  mensaje = '';
  formato: FormatoComprobante = 'termico';
  tieneLogo = false;
  logoUrl: string | null = null;

  ngOnInit(): void {
    this.negocioService.get(true).subscribe({
      next: (negocio) => {
        this.apply(negocio);
        this.loading = false;
      },
      error: (err) => {
        this.error = parseApiError(err, 'No se pudo cargar la configuración.').message;
        this.loading = false;
      },
    });
  }

  ngOnDestroy(): void {
    this.revokeLogo();
  }

  save(): void {
    if (this.saving) return;
    this.formError = '';
    this.saved = '';
    if (!this.nombreComercial.trim()) {
      this.formError = 'El nombre comercial es obligatorio.';
      return;
    }
    this.saving = true;
    this.negocioService.update({
      nombreComercial: this.nombreComercial.trim(),
      telefono: this.telefono.trim() || null,
      ciudad: this.ciudad.trim() || null,
      correoRespuesta: this.correoRespuesta.trim() || null,
      mensaje: this.mensaje.trim() || null,
      formatoPredeterminado: this.formato,
    }).subscribe({
      next: (negocio) => {
        this.apply(negocio);
        this.saved = 'Configuración guardada.';
        this.saving = false;
      },
      error: (err) => {
        this.formError = parseApiError(err, 'No se pudo guardar la configuración.').message;
        this.saving = false;
      },
    });
  }

  async onLogo(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.logoError = '';
    this.saved = '';
    const invalid = await this.validateLogo(file);
    if (invalid) {
      this.logoError = invalid;
      return;
    }
    this.uploading = true;
    this.negocioService.uploadLogo(file).subscribe({
      next: (negocio) => {
        this.apply(negocio, true);
        this.uploading = false;
      },
      error: (err) => {
        this.logoError = parseApiError(err, 'No se pudo subir el logo.').message;
        this.uploading = false;
      },
    });
  }

  removeLogo(): void {
    if (this.uploading || !this.tieneLogo) return;
    this.uploading = true;
    this.logoError = '';
    this.negocioService.deleteLogo().subscribe({
      next: (negocio) => {
        this.apply(negocio);
        this.uploading = false;
      },
      error: (err) => {
        this.logoError = parseApiError(err, 'No se pudo quitar el logo.').message;
        this.uploading = false;
      },
    });
  }

  private apply(negocio: NegocioResponse, reloadLogo = false): void {
    this.nombreComercial = negocio.nombreComercial ?? '';
    this.telefono = negocio.telefono ?? '';
    this.ciudad = negocio.ciudad ?? '';
    this.correoRespuesta = negocio.correoRespuesta ?? '';
    this.mensaje = negocio.mensaje ?? '';
    this.formato = negocio.formatoPredeterminado === 'media-carta' ? 'media-carta' : 'termico';
    this.tieneLogo = negocio.tieneLogo;
    if (!negocio.tieneLogo) {
      this.revokeLogo();
      return;
    }
    if (reloadLogo || !this.logoUrl) this.loadLogo();
  }

  private loadLogo(): void {
    this.negocioService.getLogo().subscribe({
      next: (blob) => {
        this.revokeLogo();
        this.logoUrl = URL.createObjectURL(blob);
      },
      error: () => {
        this.tieneLogo = false;
        this.revokeLogo();
      },
    });
  }

  private revokeLogo(): void {
    if (this.logoUrl) URL.revokeObjectURL(this.logoUrl);
    this.logoUrl = null;
  }

  private validateLogo(file: File): Promise<string | null> {
    const png = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
    if (!png) return Promise.resolve('El logo debe ser un archivo PNG.');
    if (file.size > LOGO_MAX_BYTES) return Promise.resolve('El logo no puede pasar de 500 KB.');
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image.width > LOGO_MAX_PX || image.height > LOGO_MAX_PX
          ? 'Ningún lado del logo puede pasar de 2000 px.'
          : null);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        resolve('No se pudo leer la imagen.');
      };
      image.src = url;
    });
  }
}
