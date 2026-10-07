import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TicketCardComponent } from './ticket-card.component';

describe('TicketCardComponent', () => {
  let component: TicketCardComponent;
  let fixture: ComponentFixture<TicketCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TicketCardComponent);
    component = fixture.componentInstance;

    // Asignar una propiedad de prueba inicial para evitar errores de undefined
    component.ticket = {
      id: 1,
      title: 'Ticket de Prueba',
      equipment: 'Equipo 01',
      description: 'Descripción de prueba',
      status: 'PENDING',
      createdAt: new Date()
    };

    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});