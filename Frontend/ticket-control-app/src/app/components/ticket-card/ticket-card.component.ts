import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { Ticket } from '../../models/ticket.model';

@Component({
  selector: 'app-ticket-card',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './ticket-card.component.html',
  styleUrls: ['./ticket-card.component.scss']
})
export class TicketCardComponent {
  @Input() ticket!: Ticket;
  @Output() cardClick = new EventEmitter<Ticket>();

  onClick(): void {
    this.cardClick.emit(this.ticket);
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'badge-pending';
      case 'IN_PROGRESS': return 'badge-in-progress';
      case 'RESOLVED': return 'badge-resolved';
      default: return 'badge-secondary';
    }
  }
}