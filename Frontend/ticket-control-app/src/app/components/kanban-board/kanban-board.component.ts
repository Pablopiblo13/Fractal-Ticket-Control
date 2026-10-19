
import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray
} from '@angular/cdk/drag-drop';

import { TicketService } from '../../services/ticket.service';

import {
  Ticket,
  CreateTicketDto,
  ChangeStatusDto,
  DeleteTicketDto,
  TicketStatus
} from '../../models/ticket.model';

import { TicketCardComponent } from '../ticket-card/ticket-card.component';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    TicketCardComponent
  ],
  templateUrl: './kanban-board.component.html',
  styleUrl: './kanban-board.component.scss'
})
export class KanbanBoardComponent implements OnInit {

  // Kanban columns
  pendingTickets: Ticket[] = [];
  inProgressTickets: Ticket[] = [];
  resolvedTickets: Ticket[] = [];

  people: string[] = [
    'Juan Pérez',
    'María Gómez',
    'Carlos López'
  ];

  // Ticket creation
  newTicket = {
    title: '',
    asset: '',
    description: '',
    assignedTo: ''
  };

  // Ticket filters
  filters = {
    searchText: '',
    startDate: '',
    endDate: ''
  };

  // Ticket status updates
  isModalOpen = false;
  selectedTicketForStatus: Ticket | null = null;
  targetStatus: TicketStatus = 'PENDING';
  selectedFile: File | null = null;
  pendingDropEvent: CdkDragDrop<Ticket[]> | null = null;

  statusForm = {
    changedBy: '',
    comment: ''
  };

  // Ticket soft deletion
  isDeleteModalOpen = false;
  selectedTicketForDelete: Ticket | null = null;
  isDeleting = false;

  deleteForm = {
    deletedBy: '',
    reason: ''
  };

  // Deleted tickets view
  isTrashOpen = false;
  isLoadingDeletedTickets = false;
  deletedTickets: Ticket[] = [];

  // Validation alerts
  showValidationAlert = false;
  validationAlertMessage = '';

  constructor(
    private ticketService: TicketService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  // Ticket queries
  loadTickets(): void {
    this.ticketService.getTickets().subscribe({
      next: (data) => {
        const normalizedTickets: Ticket[] = data.map(t => {
          const raw = t as any;

          const rawStatus =
            t.status ?? raw.Status ?? 'PENDING';

          const statusText = String(rawStatus)
            .toUpperCase()
            .trim();

          let status: TicketStatus = 'PENDING';

          if (
            statusText === 'IN_PROGRESS' ||
            statusText === 'INPROGRESS' ||
            statusText === 'EN PROCESO' ||
            statusText === '1'
          ) {
            status = 'IN_PROGRESS';
          } else if (
            statusText === 'RESOLVED' ||
            statusText === 'RESUELTO' ||
            statusText === '2'
          ) {
            status = 'RESOLVED';
          }

          return {
            ...t,
            status,
            createdAt:
              t.createdAt ||
              raw.created_at ||
              raw.CreatedAt ||
              new Date(),
            createdBy:
              t.createdBy ??
              raw.CreatedBy ??
              null,
            assignedTo:
              t.assignedTo ??
              raw.AssignedTo ??
              null
          };
        });

        const activeTickets = normalizedTickets.filter(
          t => !t.isDeleted
        );

        this.pendingTickets = activeTickets.filter(
          t => t.status === 'PENDING'
        );

        this.inProgressTickets = activeTickets.filter(
          t => t.status === 'IN_PROGRESS'
        );

        this.resolvedTickets = activeTickets.filter(
          t => t.status === 'RESOLVED'
        );

        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error('Error loading tickets:', err);

        this.showAlert(
          'No se pudieron cargar los tickets.'
        );
      }
    });
  }

  // Deleted ticket queries
  openTrash(): void {
    this.isTrashOpen = true;
    this.isLoadingDeletedTickets = true;
    this.deletedTickets = [];

    this.cdr.detectChanges();

    this.ticketService.getDeletedTickets().subscribe({
      next: (tickets) => {
        if (!this.isTrashOpen) {
          return;
        }

        this.deletedTickets = tickets;
        this.isLoadingDeletedTickets = false;
        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error('Error loading deleted tickets:', err);

        this.isLoadingDeletedTickets = false;

        if (this.isTrashOpen) {
          this.showAlert(
            'No se pudieron cargar los tickets eliminados.'
          );
        }
      }
    });
  }

  closeTrash(): void {
    this.isTrashOpen = false;
    this.isLoadingDeletedTickets = false;
    this.deletedTickets = [];
    this.cdr.detectChanges();
  }

  // Ticket filters
  private applyFilter(tickets: Ticket[]): Ticket[] {
    const searchLower = this.filters.searchText
      .toLowerCase()
      .trim();

    return tickets.filter(ticket => {
      const matchesTitle = (ticket.title ?? '')
        .toLowerCase()
        .includes(searchLower);

      const matchesEquipment = (ticket.equipment ?? '')
        .toLowerCase()
        .includes(searchLower);

      const matchesCreator = (ticket.createdBy ?? '')
        .toLowerCase()
        .includes(searchLower);

      const matchesAssignee = (ticket.assignedTo ?? '')
        .toLowerCase()
        .includes(searchLower);

      const matchesId = String(ticket.id)
        .includes(searchLower);

      const matchesSearch =
        !searchLower ||
        matchesTitle ||
        matchesEquipment ||
        matchesCreator ||
        matchesAssignee ||
        matchesId;

      let matchesDate = true;

      if (ticket.createdAt) {
        const ticketDate = new Date(
          ticket.createdAt
        ).getTime();

        if (this.filters.startDate) {
          const start = new Date(
            this.filters.startDate
          ).setHours(0, 0, 0, 0);

          if (ticketDate < start) {
            matchesDate = false;
          }
        }

        if (this.filters.endDate) {
          const end = new Date(
            this.filters.endDate
          ).setHours(23, 59, 59, 999);

          if (ticketDate > end) {
            matchesDate = false;
          }
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

  // Ticket creation
  onCreateTicket(): void {
    if (
      !this.newTicket.title.trim() ||
      !this.newTicket.asset.trim()
    ) {
      this.showAlert(
        'Debes completar el título y el equipo.'
      );
      return;
    }

    if (!this.newTicket.assignedTo.trim()) {
      this.showAlert(
        'Debes seleccionar la persona encargada.'
      );
      return;
    }

    const ticketPayload: CreateTicketDto = {
      title: this.newTicket.title.trim(),
      equipment: this.newTicket.asset.trim(),
      description: this.newTicket.description.trim(),
      assignedTo: this.newTicket.assignedTo
    };

    this.ticketService.createTicket(
      ticketPayload
    ).subscribe({
      next: () => {
        this.newTicket = {
          title: '',
          asset: '',
          description: '',
          assignedTo: ''
        };

        this.loadTickets();
      },

      error: (err) => {
        console.error('Error creating ticket:', err);

        this.showAlert(
          'No se pudo crear el ticket. Revisa la conexión con el backend.'
        );
      }
    });
  }

  // Validation alerts
  closeValidationAlert(): void {
    this.showValidationAlert = false;
    this.validationAlertMessage = '';
    this.cdr.detectChanges();
  }

  private showAlert(message: string): void {
    this.validationAlertMessage = message;
    this.showValidationAlert = true;
    this.cdr.detectChanges();
  }

  // Ticket drag and drop
  onDrop(event: CdkDragDrop<Ticket[]>): void {
    if (
      event.previousContainer === event.container
    ) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      return;
    }

    const target = this.getColumnStatus(
      event.container.id
    );

    const ticket =
      event.previousContainer.data[
        event.previousIndex
      ];

    if (!ticket) {
      return;
    }

    const validTransition =
      (
        ticket.status === 'PENDING' &&
        target === 'IN_PROGRESS'
      ) ||
      (
        ticket.status === 'IN_PROGRESS' &&
        target === 'RESOLVED'
      );

    if (!validTransition) {
      this.showAlert(
        'Transición no permitida. Debes avanzar de Pendiente a En proceso y luego a Resuelto.'
      );

      return;
    }

    this.openStatusModal(
      ticket,
      target,
      event
    );
  }

  // Status update modal
  private openStatusModal(
    ticket: Ticket,
    target: TicketStatus,
    dropEvent: CdkDragDrop<Ticket[]> | null = null
  ): void {
    this.pendingDropEvent = dropEvent;
    this.selectedTicketForStatus = ticket;
    this.targetStatus = target;

    this.statusForm = {
      changedBy: '',
      comment: ''
    };

    this.selectedFile = null;
    this.isModalOpen = true;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.selectedFile =
      input.files && input.files.length > 0
        ? input.files[0]
        : null;
  }

  isResolvedStatus(): boolean {
    return this.targetStatus === 'RESOLVED';
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.pendingDropEvent = null;
    this.selectedTicketForStatus = null;
    this.selectedFile = null;

    this.statusForm = {
      changedBy: '',
      comment: ''
    };
  }

  confirmStatusChange(): void {
    if (!this.selectedTicketForStatus) {
      return;
    }

    if (!this.statusForm.changedBy.trim()) {
      this.showAlert(
        'Selecciona quién realiza el cambio de estado.'
      );

      return;
    }

    if (this.isResolvedStatus()) {
      if (!this.statusForm.comment.trim()) {
        this.showAlert(
          'Debes explicar cómo se resolvió el ticket.'
        );

        return;
      }

      if (!this.selectedFile) {
        this.showAlert(
          'Debes seleccionar una evidencia para resolver el ticket.'
        );

        return;
      }
    }

    const dto: ChangeStatusDto = {
      newStatus: this.targetStatus,
      comment:
        this.statusForm.comment.trim() ||
        'Cambio realizado desde el tablero Kanban',
      changedBy: this.statusForm.changedBy.trim()
    };

    const ticketId =
      this.selectedTicketForStatus.id;

    this.ticketService.changeStatus(
      ticketId,
      dto
    ).subscribe({
      next: () => {
        this.closeModal();
        this.loadTickets();
      },

      error: (err) => {
        console.error('Error updating ticket status:', err);

        this.showAlert(
          'No se pudo cambiar el estado. Revisa el backend y los procedimientos de MySQL.'
        );
      }
    });
  }

  // Ticket soft deletion
  openDeleteModal(ticket: Ticket): void {
    if (this.isDeleting) {
      return;
    }

    this.selectedTicketForDelete = ticket;

    this.deleteForm = {
      deletedBy: '',
      reason: ''
    };

    this.isDeleteModalOpen = true;
    this.cdr.detectChanges();
  }

  closeDeleteModal(): void {
    if (this.isDeleting) {
      return;
    }

    this.isDeleteModalOpen = false;
    this.selectedTicketForDelete = null;

    this.deleteForm = {
      deletedBy: '',
      reason: ''
    };

    this.cdr.detectChanges();
  }

  confirmDelete(): void {
    if (
      !this.selectedTicketForDelete ||
      this.isDeleting
    ) {
      return;
    }

    const deletedBy = this.deleteForm.deletedBy.trim();
    const reason = this.deleteForm.reason.trim();

    if (!deletedBy) {
      this.showAlert(
        'Debes seleccionar quién elimina el ticket.'
      );

      return;
    }

    if (!reason) {
      this.showAlert(
        'Debes ingresar el motivo de eliminación.'
      );

      return;
    }

    const dto: DeleteTicketDto = {
      deletedBy,
      reason
    };

    const ticketId = this.selectedTicketForDelete.id;

    this.isDeleting = true;

    this.ticketService.deleteTicket(
      ticketId,
      dto
    ).subscribe({
      next: () => {
        this.isDeleting = false;
        this.closeDeleteModal();
        this.loadTickets();
      },

      error: (err) => {
        this.isDeleting = false;

        console.error('Error deleting ticket:', err);

        this.showAlert(
          err.error?.message ||
          'No se pudo eliminar el ticket. Revisa la conexión con el backend.'
        );
      }
    });
  }

  // Kanban column identification
  private getColumnStatus(
    containerId: string
  ): TicketStatus {
    const id = containerId.toLowerCase();

    if (
      id.includes('progress') ||
      id.includes('proceso')
    ) {
      return 'IN_PROGRESS';
    }

    if (
      id.includes('resolved') ||
      id.includes('resuelto')
    ) {
      return 'RESOLVED';
    }

    return 'PENDING';
  }

  // Ticket selection
  onTicketClick(ticket: Ticket): void {
    this.openDeleteModal(ticket);
  }
}
