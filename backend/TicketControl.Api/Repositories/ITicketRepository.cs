using TicketControl.Api.Models;

namespace TicketControl.Api.Repositories;

public interface ITicketRepository
{
    Task<IEnumerable<Ticket>> GetAllAsync();
    Task<Ticket?> GetByIdAsync(int id);
    Task<int> CreateAsync(string title, string equipment, string description);
    Task ChangeStatusAsync(int id, string newStatus, string comment);
    Task<IEnumerable<TicketHistory>> GetHistoryByTicketIdAsync(int ticketId);
}