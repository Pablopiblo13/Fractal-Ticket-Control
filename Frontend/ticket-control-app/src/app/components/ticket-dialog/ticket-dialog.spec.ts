import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TicketDialog } from './ticket-dialog';

describe('TicketDialog', () => {
  let component: TicketDialog;
  let fixture: ComponentFixture<TicketDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(TicketDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
