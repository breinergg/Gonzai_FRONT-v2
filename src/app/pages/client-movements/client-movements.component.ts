import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientService } from '../../core/services/client.service';
import { MovimientoClienteResponse } from '../../core/models/client.model';

@Component({
  selector: 'app-client-movements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-movements.component.html',
  styleUrl: './client-movements.component.css'
})
export class ClientMovementsComponent implements OnInit {
  movements: MovimientoClienteResponse[] = [];
  filteredMovements: MovimientoClienteResponse[] = [];

  searchTerm = '';
  typeFilter = '';
  loading = true;
  error = '';

  constructor(private clientService: ClientService) {}

  ngOnInit(): void {
    this.loadMovements();
  }

  loadMovements(): void {
    this.loading = true;
    this.error = '';
    this.clientService.getAllMovements().subscribe({
      next: (data) => {
        this.movements = data.sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar los movimientos';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let result = [...this.movements];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(m =>
        m.clienteNombre.toLowerCase().includes(term) ||
        (m.descripcion ?? '').toLowerCase().includes(term)
      );
    }

    if (this.typeFilter) {
      result = result.filter(m => m.tipoMovimiento === this.typeFilter);
    }

    this.filteredMovements = result;
  }

  onSearchChange(): void { this.applyFilters(); }
  onTypeChange(): void   { this.applyFilters(); }

  get totalMovements(): number  { return this.movements.length; }
  get totalDeudas(): number     { return this.movements.filter(m => m.tipoMovimiento === 'deuda').length; }
  get totalAbonos(): number     { return this.movements.filter(m => m.tipoMovimiento === 'abono').length; }

  getTypeClass(type: string): string {
    switch (type.toLowerCase()) {
      case 'deuda':  return 'type-deuda';
      case 'abono':  return 'type-abono';
      default:       return '';
    }
  }

  getClientInitial(nombre: string): string {
    return nombre.charAt(0).toUpperCase();
  }
}
