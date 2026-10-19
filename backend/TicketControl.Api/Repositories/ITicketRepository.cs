
using TicketControl.Api.Models;

namespace TicketControl.Api.Repositories;

public interface ITicketRepository
{
    // Ticket queries
    Task<IEnumerable<Ticket>> GetAllAsync();

    Task<Ticket?> GetByIdAsync(int id);

    // Deleted ticket queries
    Task<IEnumerable<Ticket>> GetDeletedAsync();

    // Ticket creation
    Task<int> CreateAsync(
        string title,
        string equipment,
        string description,
        string? createdBy,
        string assignedTo
    );

    // Ticket status updates
    Task ChangeStatusAsync(
        int id,
        string newStatus,
        string comment,
        string? assignedTo,
        string changedBy
    );

    // Soft delete with audit information
    Task<bool> SoftDeleteAsync(
        int id,
        string deletedBy,
        string reason
    );

    // Ticket history
    Task<IEnumerable<TicketHistory>> GetHistoryByTicketIdAsync(
        int ticketId
    );
}
