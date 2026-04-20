import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  @ViewChild('chatBody') chatBody!: ElementRef;

  chatInput = '';

  chatMessages: { from: 'bot' | 'user'; text: string; time: string }[] = [
    { from: 'bot', text: '¡Hola! Soy Goncho 👋 Tu asistente de Gonzai. ¿En qué te puedo ayudar hoy?', time: '10:00' },
    { from: 'bot', text: 'Puedo ayudarte con información de pedidos, inventario, productos y más.', time: '10:00' },
  ];

  recentOrders = [
    { id: '#ORD-7841', customer: 'Carlos M&eacute;ndez', date: '15 Abr 2026, 10:43', status: 'Completado', amount: '$245.00' },
    { id: '#ORD-7840', customer: 'Ana Rodr&iacute;guez', date: '15 Abr 2026, 09:22', status: 'Enviado', amount: '$120.50' },
    { id: '#ORD-7839', customer: 'Miguel Torres', date: '14 Abr 2026, 18:05', status: 'Pendiente', amount: '$89.00' },
    { id: '#ORD-7838', customer: 'Laura Jim&eacute;nez', date: '14 Abr 2026, 15:30', status: 'Completado', amount: '$310.00' },
    { id: '#ORD-7837', customer: 'Pedro Garc&iacute;a', date: '14 Abr 2026, 12:15', status: 'Completado', amount: '$67.80' },
    { id: '#ORD-7836', customer: 'Sof&iacute;a L&oacute;pez', date: '13 Abr 2026, 20:48', status: 'Enviado', amount: '$198.00' },
  ];

  topProducts = [
    { name: 'Camiseta Premium', sales: 142, avatar: 'C' },
    { name: 'Zapatillas Urban', sales: 98, avatar: 'Z' },
    { name: 'Gorra Metallic', sales: 87, avatar: 'G' },
    { name: 'Hoodie Classic', sales: 76, avatar: 'H' },
    { name: 'Pantalón Cargo', sales: 65, avatar: 'P' },
  ];

  topDebtors = [
    { name: 'Miguel Torres', amount: '$2,400.00', avatar: 'MT', pct: 52 },
    { name: 'Carlos Méndez', amount: '$1,200.00', avatar: 'CM', pct: 26 },
    { name: 'Ana Rodríguez', amount: '$980.00', avatar: 'AR', pct: 22 },
  ];

  registryStats = {
    clients: 148,
    products: 312,
    activeOrders: 27,
    categories: 14,
  };

  summaryStats = {
    clientesActivos: 45,
    productosActivos: 120,
    topDeudor: { nombre: 'Juan Pérez', deuda: 3500.00 },
  };

  sendMessage(): void {
    const text = this.chatInput.trim();
    if (!text) return;
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    this.chatMessages.push({ from: 'user', text, time });
    this.chatInput = '';
    setTimeout(() => {
      this.chatMessages.push({ from: 'bot', text: 'Entendido, estoy procesando tu consulta... 🤔', time });
      setTimeout(() => {
        const el: HTMLElement = this.chatBody?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
      }, 50);
    }, 800);
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
