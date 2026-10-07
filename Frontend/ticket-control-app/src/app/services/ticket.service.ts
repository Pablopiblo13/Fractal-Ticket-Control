import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'; // <-- Importar el environment
import { Ticket, ChangeStatusDto, TicketHistory } from '../models/ticket.model';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  // Esto apuntará a 'http://localhost:5133/api/tickets'
  private apiUrl = `${environment.apiUrl}/tickets`;

  constructor(private http: HttpClient) {}

  getTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(this.apiUrl);
  }

  getTicketById(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/${id}`);
  }

  createTicket(ticketData: { title: string; equipment: string; description?: string }): Observable<Ticket> {
    const payload = {
      title: ticketData.title,
      equipment: ticketData.equipment, 
      description: ticketData.description || ''
    };
    return this.http.post<Ticket>(this.apiUrl, payload);
  }

  changeStatus(id: number, dto: ChangeStatusDto): Observable<Ticket> {
    return this.http.put<Ticket>(`${this.apiUrl}/${id}/status`, dto);
  }

  getHistory(id: number): Observable<TicketHistory[]> {
    return this.http.get<TicketHistory[]>(`${this.apiUrl}/${id}/history`);
  }
}