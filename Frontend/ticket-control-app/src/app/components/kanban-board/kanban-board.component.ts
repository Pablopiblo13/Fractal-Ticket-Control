import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TicketService } from '../../services/ticket.service';
import { Ticket, ChangeStatusDto } from '../../models/ticket.model';
import { TicketCardComponent } from '../ticket-card/ticket-card.component';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, TicketCardComponent],
  templateUrl: './kanban-board.component.html',
  styleUrl: './kanban-board.component.scss'
})
export class KanbanBoardComponent implements OnInit {
  pendingTickets: Ticket[] = [];
  inProgressTickets: Ticket[] = [];
  resolvedTickets: Ticket[] = [];

  newTicket = {
    title: '',
    asset: '',
    description: ''
  };

  
  filters = {
    searchText: '', 
    startDate: '',  
    endDate: ''     
  };


  isModalOpen = false;
  selectedTicketForStatus: Ticket | null = null;
  targetStatus: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' = 'PENDING';
  selectedFile: File | null = null;
  pendingDropEvent: CdkDragDrop<Ticket[]> | null = null;

  statusForm = {
    assignedTo: '',
    comment: ''
  };

 
  showValidationAlert = false;
  validationAlertMessage = '';

  constructor(
    private ticketService: TicketService,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.ticketService.getTickets().subscribe({
      next: (data) => {
        const normalizedTickets = data.map(t => ({
          ...t,
          createdAt: t.createdAt || (t as any).created_at || (t as any).CreatedAt || new Date()
        }));

        this.pendingTickets = normalizedTickets.filter(t => {
          const rawStatus = t.status !== undefined && t.status !== null ? t.status : (t as any).Status;
          const statusStr = rawStatus.toString().toUpperCase();
          return statusStr === 'PENDING' || statusStr === 'PENDIENTE' || rawStatus === 0;
        });

        this.inProgressTickets = normalizedTickets.filter(t => {
          const rawStatus = t.status !== undefined && t.status !== null ? t.status : (t as any).Status;
          const statusStr = rawStatus.toString().toUpperCase();
          return statusStr === 'IN_PROGRESS' || statusStr === 'INPROGRESS' || statusStr === 'EN PROCESO' || rawStatus === 1;
        });

        this.resolvedTickets = normalizedTickets.filter(t => {
          const rawStatus = t.status !== undefined && t.status !== null ? t.status : (t as any).Status;
          const statusStr = rawStatus.toString().toUpperCase();
          return statusStr === 'RESOLVED' || statusStr === 'RESUELTO' || rawStatus === 2;
        });

        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al obtener los tickets:', err)
    });
  }

 
  private applyFilter(tickets: Ticket[]): Ticket[] {
    return tickets.filter(ticket => {
      
      const searchLower = this.filters.searchText.toLowerCase().trim();
      const matchesTitle = ticket.title ? ticket.title.toLowerCase().includes(searchLower) : false;
      const matchesEquipment = ticket.equipment ? ticket.equipment.toLowerCase().includes(searchLower) : false;
      const matchesSearch = !searchLower || matchesTitle || matchesEquipment;

  
      let matchesDate = true;
      if (ticket.createdAt) {
        const ticketDate = new Date(ticket.createdAt).getTime();
        
        if (this.filters.startDate) {
          const start = new Date(this.filters.startDate).setHours(0, 0, 0, 0);
          if (ticketDate < start) matchesDate = false;
        }

        if (this.filters.endDate) {
          const end = new Date(this.filters.endDate).setHours(23, 59, 59, 999);
          if (ticketDate > end) matchesDate = false;
        }
      }

      return matchesSearch && matchesDate;
    });
  }

  get filteredPendingTickets(): Ticket[] {
    return this.applyFilter(this.pendingTickets);
  }

  get filteredInProgressTickets(): Ticket[] {
    return this.applyFilter(this.inProgressTickets);
  }

  get filteredResolvedTickets(): Ticket[] {
    return this.applyFilter(this.resolvedTickets);
  }

  clearFilters(): void {
    this.filters = {
      searchText: '',
      startDate: '',
      endDate: ''
    };
  }

  // --- CREACIÓN DE TICKET ---
  onCreateTicket(): void {
    if (!this.newTicket.title.trim() || !this.newTicket.asset.trim()) {
      this.validationAlertMessage = '❌ Tiene que completar el formulario';
      this.showValidationAlert = true;
      return;
    }

    const ticketPayload = {
      title: this.newTicket.title,
      equipment: this.newTicket.asset, 
      description: this.newTicket.description
    };

    this.ticketService.createTicket(ticketPayload).subscribe({
      next: () => {
        this.newTicket = { title: '', asset: '', description: '' };
        this.loadTickets(); 
      },
      error: (err) => {
        console.error('Error al crear ticket:', err);
        this.validationAlertMessage = '❌ Ocurrió un error al intentar crear el ticket';
        this.showValidationAlert = true;
      }
    });
  }

  closeValidationAlert(): void {
    this.showValidationAlert = false;
  }

  onDrop(event: CdkDragDrop<Ticket[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    const target = this.getColumnStatus(event.container.id);
    const ticket = event.previousContainer.data[event.previousIndex];

    this.pendingDropEvent = event;
    this.selectedTicketForStatus = ticket;
    this.targetStatus = target;
    this.statusForm = { assignedTo: '', comment: '' };
    this.selectedFile = null;
    this.isModalOpen = true;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  isResolvedStatus(): boolean {
    if (!this.targetStatus) return false;
    const status = this.targetStatus.toString().toUpperCase();
    return status === 'RESOLVED' || status === 'RESUELTO';
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.pendingDropEvent = null;
    this.selectedTicketForStatus = null;
    this.selectedFile = null;
  }

  confirmStatusChange(): void {
    if (!this.selectedTicketForStatus || !this.pendingDropEvent) return;

    if (!this.statusForm.assignedTo.trim()) {
      alert('Por favor selecciona la persona encargada del ticket.');
      return;
    }

    if (this.isResolvedStatus()) {
      if (!this.statusForm.comment.trim()) {
        alert('Es obligatorio ingresar una descripción detallada de cómo se resolvió el ticket.');
        return;
      }
      if (!this.selectedFile) {
        alert('Es obligatorio adjuntar una foto o documento como evidencia para resolver el ticket.');
        return;
      }
    }

    const dto: ChangeStatusDto = {
      newStatus: this.targetStatus,
      comment: this.statusForm.comment.trim() || 'Cambio realizado desde el tablero Kanban',
      assignedTo: this.statusForm.assignedTo
    };

    this.ticketService.changeStatus(this.selectedTicketForStatus.id, dto).subscribe({
      next: () => {
        transferArrayItem(
          this.pendingDropEvent!.previousContainer.data,
          this.pendingDropEvent!.container.data,
          this.pendingDropEvent!.previousIndex,
          this.pendingDropEvent!.currentIndex
        );
        this.selectedTicketForStatus!.status = this.targetStatus;
        this.closeModal();
        this.loadTickets();
      },
      error: (err) => {
        alert('Error al cambiar el estado. Transición no permitida por el backend.');
        console.error('Error de transición:', err);
      }
    });
  }

  private getColumnStatus(containerId: string): 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' {
    const id = containerId.toLowerCase();
    if (id.includes('1') || id.includes('progress') || id.includes('proceso')) return 'IN_PROGRESS';
    if (id.includes('2') || id.includes('resolved') || id.includes('resuelto')) return 'RESOLVED';
    return 'PENDING';
  }

  onTicketClick(ticket: Ticket): void {
    console.log('Ticket seleccionado:', ticket);
  }
}