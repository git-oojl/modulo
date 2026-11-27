import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, Subject } from 'rxjs';
import { PublicCatalogueApiService } from '../../data-access/public-catalogue-api.service';
import {
  PublicProperty,
  PublicPropertyOperation,
  PublicPropertyType,
} from '../../models/public-property.model';

type OperationFilter = 'todas' | PublicPropertyOperation;
type TypeFilter = 'todos' | PublicPropertyType;

@Component({
  selector: 'app-catalogue-page',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './catalogue-page.component.html',
  styleUrl: './catalogue-page.component.scss',
})
export class CataloguePageComponent {
  private readonly catalogueApi = inject(PublicCatalogueApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchChanges = new Subject<string>();
  private loadSequence = 0;

  readonly usesDemoData = false;
  readonly properties = signal<PublicProperty[]>([]);
  readonly isLoading = signal(true);
  readonly hasLoadError = signal(false);
  readonly searchTerm = signal('');
  readonly operation = signal<OperationFilter>('todas');
  readonly type = signal<TypeFilter>('todos');
  readonly filteredProperties = computed(() => {
    if (!this.usesDemoData) {
      return this.properties();
    }

    const search = this.normalize(this.searchTerm());
    return this.properties().filter((property) => {
      const matchesSearch =
        !search ||
        this.normalize(`${property.title} ${property.publicLocation} ${property.type}`).includes(
          search,
        );
      const matchesOperation =
        this.operation() === 'todas' || property.operation === this.operation();
      const matchesType = this.type() === 'todos' || property.type === this.type();
      return matchesSearch && matchesOperation && matchesType;
    });
  });

  constructor() {
    this.searchChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadProperties());
    this.loadProperties();
  }

  setSearchTerm(value: string): void {
    this.searchTerm.set(value);
    if (!this.usesDemoData) {
      this.searchChanges.next(value);
    }
  }

  setOperation(value: OperationFilter): void {
    this.operation.set(value);
    if (!this.usesDemoData) {
      this.loadProperties();
    }
  }

  setType(value: TypeFilter): void {
    this.type.set(value);
    if (!this.usesDemoData) {
      this.loadProperties();
    }
  }

  loadProperties(): void {
    const sequence = ++this.loadSequence;
    this.isLoading.set(true);
    this.hasLoadError.set(false);
    this.catalogueApi
      .listPublishedProperties({
        search: this.searchTerm(),
        operation: this.operation(),
        type: this.type(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (properties) => {
          if (sequence === this.loadSequence) {
            this.properties.set(properties);
            this.isLoading.set(false);
          }
        },
        error: () => {
          if (sequence === this.loadSequence) {
            this.hasLoadError.set(true);
            this.isLoading.set(false);
          }
        },
      });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(price);
  }

  typeLabel(type: PublicPropertyType): string {
    const labels: Record<PublicPropertyType, string> = {
      casa: 'Casa',
      departamento: 'Departamento',
      terreno: 'Terreno',
    };
    return labels[type];
  }

  operationLabel(operation: PublicPropertyOperation): string {
    return operation === 'venta' ? 'En venta' : 'En renta';
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.operation.set('todas');
    this.type.set('todos');
    if (!this.usesDemoData) {
      this.loadProperties();
    }
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('es-MX')
      .trim();
  }
}
