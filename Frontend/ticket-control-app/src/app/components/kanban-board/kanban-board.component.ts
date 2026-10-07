import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TicketService } from '../../services/ticket.service';
import { Ticket, ChangeStatusDto } from '../../models/ticket.model';
import { TicketCardComponent } from '../ticket-card/ticket-card.component';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule, DragDropModule, TicketCardComponent],
  templateUrl: './kanban-board.component.html',
  styleUrl: './kanban-board.component.scss'
})
export class KanbanBoardComponent implements OnInit {
  pendingTickets: Ticket[] = [];
  inProgressTickets: Ticket[] = [];
  resolvedTickets: Ticket[] = [];

  constructor(private ticketService: TicketService) {}

  ngOnInit(): void {
    this.loadTickets();
  }

loadTickets(): void {
  this.ticketService.getTickets().subscribe({
    next: (data) => {
      console.log('--- DATOS RECIBIDOS DE LA API ---', data);

      this.pendingTickets = data.filter(t => {
        const status = (t.status || (t as any).Status || '').toString().toUpperCase();
        return status === 'PENDING' || status === 'PENDIENTE';
      });

      this.inProgressTickets = data.filter(t => {
        const status = (t.status || (t as any).Status || '').toString().toUpperCase();
        return status === 'IN_PROGRESS' || status === 'INPROGRESS' || status === 'EN PROCESO';
      });

      this.resolvedTickets = data.filter(t => {
        const status = (t.status || (t as any).Status || '').toString().toUpperCase();
        return status === 'RESOLVED' || status === 'RESUELTO';
      });

      console.log('Filtros -> Pendientes:', this.pendingTickets.length, 'En Proceso:', this.inProgressTickets.length, 'Resueltos:', this.resolvedTickets.length);
    },
    error: (err) => console.error('Error al obtener los tickets:', err)
  });
}
  onDrop(event: CdkDragDrop<Ticket[]>, targetStatus: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const ticket = event.previousContainer.data[event.previousIndex];
      
      // Pedir comentario obligatorio / opcional al usuario
      const commentPrompt = prompt(`Ingresa un comentario para mover el ticket a ${targetStatus}:`);
      
      // Cancelar si el usuario presiona Cancelar en el prompt
      if (commentPrompt === null) {
        return;
      }

      const dto: ChangeStatusDto = {
        newStatus: targetStatus,
        comment: commentPrompt.trim() || 'Cambio realizado desde el tablero Kanban'
      };

      this.ticketService.changeStatus(ticket.id, dto).subscribe({
        next: () => {
          // Transferir el elemento en el cliente tras confirmación 200 OK
          transferArrayItem(
            event.previousContainer.data,
            event.container.data,
            event.previousIndex,
            event.currentIndex
          );
          // Actualizar propiedad status local del ticket movido
          ticket.status = targetStatus;
          // Recargar datos para asegurar sincronización con la BD
          this.loadTickets();
        },
        error: (err) => {
          alert('Error al cambiar el estado. Transición no permitida por el backend.');
          console.error('Error de transición:', err);
        }
      });
    }
  }

  onTicketClick(ticket: Ticket): void {
    console.log('Ticket seleccionado:', ticket);
  }
}