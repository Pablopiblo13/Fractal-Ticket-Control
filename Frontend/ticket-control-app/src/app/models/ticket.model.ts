export type TicketStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';

export interface Ticket {
  id: number;
  title: string;
  equipment: string;
  description: string;
  status: TicketStatus;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface CreateTicketDto {
  title: string;
  equipment: string;
  description?: string;
}

export interface ChangeStatusDto {
  newStatus: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  comment?: string;
  assignedTo?: string; 
}

export interface TicketHistory {
  id: number;
  ticketId: number;
  previousStatus: TicketStatus;
  newStatus: TicketStatus;
  comment?: string;
  changedAt: string | Date;
}