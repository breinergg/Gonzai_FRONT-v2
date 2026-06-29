import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { DailySaleService } from '../../core/services/daily-sale.service';
import { ClientService } from '../../core/services/client.service';
import { ProductService } from '../../core/services/product.service';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { VentaMensualResumen } from '../../core/models/daily-sale.model';
import { ClienteMayorDeuda } from '../../core/models/client.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  constructor(
    private dailySaleService: DailySaleService,
    private clientService: ClientService,
    private productService: ProductService,
    private chatService: ChatService,
    private auth: AuthService,
  ) {}

  chatInput = '';
  chatLoading = false;

  chatMessages: { from: 'bot' | 'user'; text: string; time: string }[] = [];

  ngOnInit(): void {
    const welcomeTime = this.formatTime();
    this.chatMessages = [
      { from: 'bot', text: '¡Hola! Soy Goncho 👋 Tu asistente de Gonzai. ¿En qué te puedo ayudar hoy?', time: welcomeTime },
      { from: 'bot', text: 'Puedo ayudarte con información de pedidos, inventario, productos y más.', time: welcomeTime },
    ];

    this.dailySaleService.getResumenMensual().subscribe({
      next: (data) => { this.resumenMensual = data; this.loadingResumen = false; },
      error: () => { this.loadingResumen = false; }
    });
    this.clientService.getMayorDeuda().subscribe({
      next: (data) => { this.mayorDeuda = data; this.loadingMayorDeuda = false; },
      error: () => { this.loadingMayorDeuda = false; }
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
  }

  formatCurrency(value: number): string {
    return '$' + value.toLocaleString('es-CL', { maximumFractionDigits: 0 });
  }

  private formatTime(date: Date = new Date()): string {
    return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  }

  sendMessage(): void {
    const text = this.chatInput.trim();
    if (!text || this.chatLoading) return;
    if (text.length > 2000) return;

    const time = this.formatTime();

    this.chatMessages.push({ from: 'user', text, time });
    this.chatInput = '';
    this.scrollChat();

    this.chatLoading = true;
    this.chatMessages.push({ from: 'bot', text: 'Escribiendo...', time });
    const typingIndex = this.chatMessages.length - 1;
    this.scrollChat();

    const usuarioId = this.auth.currentUser()?.id ?? null;

    this.chatService.send({
      usuarioId,
      pregunta: text,
      usarHistorialDeBd: true,
      historial: null,
    }).subscribe({
      next: (res) => {
        const localTime = this.formatTime(new Date(res.fecha));
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
}
