import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LotService } from '../../core/services/lot.service';
import { LotDetail, LotLine, INGRESOS_TOOLTIP } from '../../core/models/lot.model';
import { isAnulado } from '../../core/models/common.model';
import { parseApiError } from '../../core/utils/api-error';
import { CopPipe } from '../../shared/pipes/cop.pipe';
import { FechaCoPipe } from '../../shared/pipes/fecha-co.pipe';

@Component({
  selector: 'app-lot-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, CopPipe, FechaCoPipe],
  templateUrl: './lot-detail.component.html',
  styleUrls: ['../../shared/styles/gz-ui.css', './lot-detail.component.css'],
})
export class LotDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly lotService = inject(LotService);

  readonly ingresosTooltip = INGRESOS_TOOLTIP;
  readonly isAnulado = isAnulado;

  lotId = 0;
  lot: LotDetail | null = null;
  loading = true;
  error = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.lotId = Number(params.get('id'));
      this.load();
    });
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.lotService.getById(this.lotId).subscribe({
      next: (lot) => {
        this.lot = lot;
        this.loading = false;
      },
      error: (err) => {
        this.error = parseApiError(err, 'No se pudo cargar el lote.').message;
        this.loading = false;
      },
    });
  }

  back(): void {
    this.router.navigate(['/lots']);
  }

  pct(value: number): number {
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  lineSoldPct(l: LotLine): number {
    return l.comprado > 0 ? this.pct((l.vendido / l.comprado) * 100) : 0;
  }

  lineBarClass(l: LotLine): string {
    if (l.disponible === 0) return 'bar-ok';
    return this.lineSoldPct(l) >= 50 ? 'bar-gold' : 'bar-low';
  }

  get totals() {
    const lines = this.lot?.lineas ?? [];
    return lines.reduce(
      (acc, l) => ({
        comprado: acc.comprado + l.comprado,
        vendido: acc.vendido + l.vendido,
        disponible: acc.disponible + l.disponible,
        ajustado: acc.ajustado + l.ajustado,
        ingresos: acc.ingresos + l.ingresos,
        costoVendido: acc.costoVendido + l.costoVendido,
        gananciaBruta: acc.gananciaBruta + l.gananciaBruta,
      }),
      { comprado: 0, vendido: 0, disponible: 0, ajustado: 0, ingresos: 0, costoVendido: 0, gananciaBruta: 0 },
    );
  }
}
