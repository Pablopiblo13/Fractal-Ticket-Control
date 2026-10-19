
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

import {
  Ticket,
  CreateTicketDto,
  ChangeStatusDto,
  DeleteTicketDto,
  TicketHistory
} from '../models/ticket.model';

@Injectable({
  providedIn: 'root'
})
export class TicketService {

  private apiUrl = `${environment.apiUrl}/tickets`;

  constructor(
    private http: HttpClient
  ) {}

  // Ticket queries
  getTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(
      this.apiUrl
    );
  }

  getTicketById(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(
      `${this.apiUrl}/${id}`
    );
  }

  // Deleted ticket queries
  getDeletedTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(
      `${this.apiUrl}/deleted`
    );
  }

  // Ticket creation
  createTicket(
    ticketData: CreateTicketDto
  ): Observable<Ticket> {
    return this.http.post<Ticket>(
      this.apiUrl,
      ticketData
    );
  }

  // Ticket status updates
  changeStatus(
    id: number,
    dto: ChangeStatusDto
  ): Observable<Ticket> {
    return this.http.put<Ticket>(
      `${this.apiUrl}/${id}/status`,
      dto
    );
  }

  // Ticket soft deletion
  deleteTicket(
    id: number,
    dto: DeleteTicketDto
  ): Observable<{ message: string; ticketId: number }> {
    return this.http.delete<{
      message: string;
      ticketId: number;
    }>(
      `${this.apiUrl}/${id}`,
      {
        body: dto
      }
    );
  }

  // Ticket history
  getHistory(
    id: number
  ): Observable<TicketHistory[]> {
    return this.http.get<TicketHistory[]>(
      `${this.apiUrl}/${id}/history`
    );
  }
}
