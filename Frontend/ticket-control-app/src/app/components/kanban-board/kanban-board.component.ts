import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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

  constructor(
    private ticketService: TicketService,
    private cdr: ChangeDetectorRef // Inyectamos ChangeDetectorRef para forzar la actualización de la vista
  ) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.ticketService.getTickets().subscribe({
      next: (data) => {
        console.log('--- DATOS RECIBIDOS DE LA API ---', data);

        this.pendingTickets = data.filter(t => {
          const rawStatus = t.status !== undefined && t.status !== null ? t.status : (t as any).Status;
          const statusStr = rawStatus.toString().toUpperCase();
          return statusStr === 'PENDING' || statusStr === 'PENDIENTE' || rawStatus === 0;
        });

        this.inProgressTickets = data.filter(t => {
          const rawStatus = t.status !== undefined && t.status !== null ? t.status : (t as any).Status;
          const statusStr = rawStatus.toString().toUpperCase();
          return statusStr === 'IN_PROGRESS' || statusStr === 'INPROGRESS' || statusStr === 'EN PROCESO' || rawStatus === 1;
        });

        this.resolvedTickets = data.filter(t => {
          const rawStatus = t.status !== undefined && t.status !== null ? t.status : (t as any).Status;
          const statusStr = rawStatus.toString().toUpperCase();
          return statusStr === 'RESOLVED' || statusStr === 'RESUELTO' || rawStatus === 2;
        });

        console.log('Filtros -> Pendientes:', this.pendingTickets.length, 'En Proceso:', this.inProgressTickets.length, 'Resueltos:', this.resolvedTickets.length);

        // Notifica explícitamente a Angular que refresque la plantilla
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al obtener los tickets:', err)
    });
  }

  onDrop(event: CdkDragDrop<Ticket[]>, targetStatus: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const ticket = event.previousContainer.data[event.previousIndex];
      
      const commentPrompt = prompt(`Ingresa un comentario para mover el ticket a ${targetStatus}:`);
      
      if (commentPrompt === null) {
        return;
      }

      const dto: ChangeStatusDto = {
        newStatus: targetStatus,
        comment: commentPrompt.trim() || 'Cambio realizado desde el tablero Kanban'
      };

      this.ticketService.changeStatus(ticket.id, dto).subscribe({
        next: () => {
          transferArrayItem(
            event.previousContainer.data,
            event.container.data,
            event.previousIndex,
            event.currentIndex
          );
          ticket.status = targetStatus;
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