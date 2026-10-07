export interface Ticket {
  id: number;
  title: string;
  equipment: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketDto {
  title: string;
  equipment: string;
  description: string;
}

export interface ChangeStatusDto {
  newStatus: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  comment: string;
}

export interface TicketHistory {
  id: number;
  ticketId: number;
  previousStatus: string | null;
  newStatus: string;
  comment: string;
  createdAt: string;
}