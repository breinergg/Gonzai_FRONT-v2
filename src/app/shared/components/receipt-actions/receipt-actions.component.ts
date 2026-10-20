import { AfterViewChecked, Component, ElementRef, Input, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReceiptService } from '../../../core/services/receipt.service';
import { NegocioService } from '../../../core/services/negocio.service';
import { ClientService } from '../../../core/services/client.service';
import { CompartirComprobante, FormatoComprobante } from '../../../core/models/negocio.model';
import { parseApiError } from '../../../core/utils/api-error';
import { reportErrorMessage, saveReport } from '../../../core/utils/file-download';
import { FechaCoPipe } from '../../pipes/fecha-co.pipe';

@Component({
  selector: 'app-receipt-actions',
  standalone: true,
  imports: [CommonModule, FormsModule, FechaCoPipe],
  templateUrl: './receipt-actions.component.html',
  styleUrls: ['../../styles/gz-ui.css', './receipt-actions.component.css'],
  host: {
    '[class.is-compact]': 'compact',
    '[class.is-pay-row]': 'payRow',
  },
})
export class ReceiptActionsComponent implements OnInit, AfterViewChecked {
  private readonly receipts = inject(ReceiptService);
  private readonly negocio = inject(NegocioService);
  private readonly clients = inject(ClientService);

  @Input({ required: true }) tipo!: 'venta' | 'abono';
  @Input({ required: true }) documentoId!: number;
  @Input() clienteId: number | null = null;
  @Input() correoSugerido: string | null = null;
  @Input() compact = false;
  /** Botón algo más grande en filas de pagos del detalle de venta. */
  @Input() payRow = false;
  @Input() label = 'Descargar comprobante';

  formato: FormatoComprobante = 'termico';
  correo = '';
  showMail = false;
  busy = false;
  error = '';
  notice = '';
  copied = false;
  share: CompartirComprobante | null = null;
  openModal = false;

  @ViewChild('sheet') sheet?: ElementRef<HTMLElement>;

  open(event: Event): void {
    event.stopPropagation();
    this.openModal = true;
    this.error = '';
    this.notice = '';
    if (!this.correo && this.clienteId) {
      this.clients.getById(this.clienteId).subscribe({
        next: (c) => { if (!this.correo) this.correo = c.email?.trim() ?? ''; },
        error: () => {},
      });
    }
  }

  ngAfterViewChecked(): void {
    if (!this.openModal) return;
    const el = this.sheet?.nativeElement;
    const host = document.querySelector('.dashboard-layout');
    if (el && host && el.parentElement !== host) host.appendChild(el);
  }

  close(): void {
    if (this.busy) return;
    this.openModal = false;
    this.showMail = false;
  }

  ngOnInit(): void {
    this.correo = this.correoSugerido?.trim() ?? '';
    this.negocio.get().subscribe({
      next: (n) => {
        if (n.formatoPredeterminado === 'media-carta' || n.formatoPredeterminado === 'termico') {
          this.formato = n.formatoPredeterminado;
        }
      },
      error: () => {},
    });
  }

  download(): void {
    if (this.busy) return;
    this.busy = true;
    this.error = '';
    const request$ = this.tipo === 'venta'
      ? this.receipts.downloadSale(this.documentoId, this.formato)
      : this.receipts.downloadPayment(this.documentoId, this.formato);
    request$.subscribe({
      next: (file) => {
        saveReport(file, 'comprobante.pdf');
        this.busy = false;
      },
      error: (err) => {
        void reportErrorMessage(err, 'No se pudo descargar el comprobante.').then((message) => {
          this.error = message;
          this.busy = false;
        });
      },
    });
  }

  whatsapp(regenerar = false): void {
    if (this.busy) return;
    this.busy = true;
    this.error = '';
    this.copied = false;
    const request$ = this.tipo === 'venta'
      ? this.receipts.shareSale(this.documentoId, this.formato, regenerar)
      : this.receipts.sharePayment(this.documentoId, this.formato, regenerar);
    request$.subscribe({
      next: (share) => {
        this.share = share;
        this.busy = false;
        if (share.whatsappUrl) window.open(share.whatsappUrl, '_blank', 'noopener');
      },
      error: (err) => {
        this.error = parseApiError(err, 'No se pudo preparar el enlace.').message;
        this.busy = false;
      },
    });
  }

  toggleMail(): void {
    this.showMail = !this.showMail;
    this.error = '';
    this.notice = '';
  }

  sendMail(): void {
    const correo = this.correo.trim();
    if (!correo) {
      this.error = 'Escribe el correo del cliente.';
      return;
    }
    if (this.busy) return;
    this.busy = true;
    this.error = '';
    this.notice = '';
    const request$ = this.tipo === 'venta'
      ? this.receipts.sendSale(this.documentoId, correo, this.formato)
      : this.receipts.sendPayment(this.documentoId, correo, this.formato);
    request$.subscribe({
      next: (res) => {
        this.notice = res.message;
        this.showMail = false;
        this.busy = false;
      },
      error: (err) => {
        this.error = parseApiError(err, 'No se pudo enviar el comprobante.').message;
        this.busy = false;
      },
    });
  }

  copyLink(): void {
    if (!this.share?.url) return;
    void navigator.clipboard.writeText(this.share.url).then(() => { this.copied = true; });
  }
}
