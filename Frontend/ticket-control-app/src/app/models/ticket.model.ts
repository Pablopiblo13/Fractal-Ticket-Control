
export type TicketStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'RESOLVED';

export type TicketEventType =
  | 'CREATED'
  | 'STATUS_CHANGE'
  | 'DELETED';

// Ticket model
export interface Ticket {
  id: number;

  title: string;
  equipment: string;
  description: string;

  status: TicketStatus;

  createdAt: string | Date;
  updatedAt?: string | Date;

  createdBy?: string | null;
  assignedTo?: string | null;

  // Soft delete audit fields
  isDeleted?: boolean;
  deletedAt?: string | Date | null;
  deletedBy?: string | null;
  deleteReason?: string | null;
}

// Ticket creation
export interface CreateTicketDto {
  title: string;
  equipment: string;
  description?: string;
  assignedTo: string;
}

// Ticket status updates
export interface ChangeStatusDto {
  newStatus: TicketStatus;
  comment?: string;
  changedBy: string;
}

// Ticket soft deletion
export interface DeleteTicketDto {
  deletedBy: string;
  reason: string;
}

// Ticket history
export interface TicketHistory {
  id: number;
  ticketId: number;

  previousStatus: TicketStatus | null;
  newStatus: TicketStatus;

  comment?: string | null;

  changedAt: string | Date;

  changedBy?: string | null;

  previousAssignedTo?: string | null;
  newAssignedTo?: string | null;

  eventType?: TicketEventType;
}
