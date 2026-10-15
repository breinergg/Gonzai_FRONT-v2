import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { SaleService } from '../../core/services/sale.service';
import { ClientService } from '../../core/services/client.service';
import { ProductService } from '../../core/services/product.service';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { VentaMensualResumen } from '../../core/models/sale.model';
import { ClienteMayorDeuda } from '../../core/models/client.model';
import { isAnulado } from '../../core/models/common.model';
import { BUSINESS_TZ, formatCOP } from '../../core/utils/format';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  @ViewChild('chatBody') chatBody!: ElementRef;

  resumenMensual: VentaMensualResumen | null = null;
  loadingResumen = true;
  mayorDeuda: ClienteMayorDeuda | null = null;
  loadingMayorDeuda = true;
  clientesConDeuda: number = 0;
  clientesActivos: number = 0;
  productosActivos: number = 0;
  totalDeuda: number = 0;
  ventasPorCobrar: number | null = null;
  saldoPorCobrar: number = 0;
  constructor(
    private saleService: SaleService,
    private clientService: ClientService,
    private productService: ProductService,
    private chatService: ChatService,
    private auth: AuthService,
  ) {}

  chatInput = '';
  chatLoading = false;
  /** Tras limpiar, no se carga historial previo de BD; se usa solo la sesión actual */
  useDbHistory = true;

  private readonly welcomeTexts = [
    '¡Hola! Soy Goncho 👋 Tu asistente de Gonzai. ¿En qué te puedo ayudar hoy?',
    'Puedo ayudarte con ventas, deudas de clientes, lotes, inventario y más.',
  ];

  chatMessages: { from: 'bot' | 'user'; text: string; time: string }[] = [];

  ngOnInit(): void {
    this.chatMessages = this.getWelcomeMessages();

    this.saleService.getResumenMensual().subscribe({
      next: (data) => { this.resumenMensual = data; this.loadingResumen = false; },
      error: () => { this.loadingResumen = false; }
    });
    this.clientService.getMayorDeuda().subscribe({
      next: (data) => { this.mayorDeuda = data; this.loadingMayorDeuda = false; },
      // 404 = ningún cliente debe
      error: () => { this.mayorDeuda = null; this.loadingMayorDeuda = false; }
    });
    this.clientService.getTotalDeuda().subscribe({
      next: (data) => { this.totalDeuda = data.totalDeuda; },
      error: () => { this.totalDeuda = 0; }
    });
    this.clientService.getCountConDeuda().subscribe({
      next: (data) => { this.clientesConDeuda = data.clientesConDeuda; },
      error: () => { this.clientesConDeuda = 0; }
    });
    this.clientService.getCountActivos().subscribe({
      next: (data) => { this.clientesActivos = data.clientesActivos; },
      error: () => { this.clientesActivos = 0; }
    });
    this.productService.getCountActivos().subscribe({
      next: (data) => { this.productosActivos = data.productosActivos; },
      error: () => { this.productosActivos = 0; }
    });
    this.saleService.getAll({ soloPendientes: true }).subscribe({
      next: (data) => {
        const activas = data.filter(v => !isAnulado(v.estado));
        this.ventasPorCobrar = activas.length;
        this.saldoPorCobrar = activas.reduce((acc, v) => acc + v.saldoPendiente, 0);
      },
      error: () => { this.ventasPorCobrar = 0; }
    });
  }

  formatCurrency(value: number): string {
    return formatCOP(value);
  }

  private formatTime(date: Date = new Date()): string {
    return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: BUSINESS_TZ });
  }

  sendMessage(): void {
    const text = this.chatInput.trim();
    if (!text || this.chatLoading) return;
    if (text.length > 2000) return;

    const time = this.formatTime();
    const historial = this.useDbHistory ? null : this.buildLocalHistorial();

    this.chatMessages.push({ from: 'user', text, time });
    this.chatInput = '';
    this.scrollChat();

    this.chatLoading = true;
    this.chatMessages.push({ from: 'bot', text: 'Escribiendo...', time });
    const typingIndex = this.chatMessages.length - 1;
    this.scrollChat();

    this.chatService.send({
      pregunta: text,
      usarHistorialDeBd: this.useDbHistory,
      historial,
    }).subscribe({
      next: (res) => {
        const localTime = this.formatTime(new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(res.fecha) ? res.fecha : res.fecha + 'Z'));
        this.chatMessages[typingIndex] = { from: 'bot', text: res.respuesta, time: localTime };
        this.chatLoading = false;
        this.scrollChat();
      },
      error: (err: HttpErrorResponse) => {
        this.chatLoading = false;
        if (err.status === 401) {
          this.auth.logout();
          return;
        }
        const errorText = err.status === 400
          ? 'Mensaje inválido (vacío o demasiado largo). Intenta de nuevo.'
          : 'No se pudo obtener respuesta. Intenta de nuevo.';
        this.chatMessages[typingIndex] = { from: 'bot', text: errorText, time };
        this.scrollChat();
      },
    });
  }

  private scrollChat(): void {
    setTimeout(() => {
      const el: HTMLElement = this.chatBody?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }

  onChatKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearChat(): void {
    if (this.chatLoading) return;
    this.chatMessages = this.getWelcomeMessages();
    this.useDbHistory = false;
    this.scrollChat();
  }

  get canClearChat(): boolean {
    return !this.chatLoading && this.chatMessages.some(m => m.from === 'user');
  }

  private getWelcomeMessages(): { from: 'bot'; text: string; time: string }[] {
    const welcomeTime = this.formatTime();
    return this.welcomeTexts.map(text => ({ from: 'bot' as const, text, time: welcomeTime }));
  }

  private buildLocalHistorial(): { role: string; text: string }[] {
    return this.chatMessages
      .filter(m => m.from === 'user' || (m.from === 'bot' && !this.isWelcomeMessage(m) && m.text !== 'Escribiendo...'))
      .map(m => ({
        role: m.from === 'user' ? 'user' : 'model',
        text: m.text,
      }));
  }

  private isWelcomeMessage(msg: { from: string; text: string }): boolean {
    return msg.from === 'bot' && this.welcomeTexts.includes(msg.text);
  }
}
