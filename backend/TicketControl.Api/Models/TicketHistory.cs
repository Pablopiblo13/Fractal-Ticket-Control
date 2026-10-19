
namespace TicketControl.Api.Models;

public class TicketHistory
{
    public int Id { get; set; }

    public int TicketId { get; set; }

    public string? PreviousStatus { get; set; }

    public string NewStatus { get; set; } = string.Empty;

    public string? Comment { get; set; }

    public DateTime CreatedAt { get; set; }

    public string? ChangedBy { get; set; }

    public string? PreviousAssignedTo { get; set; }

    public string? NewAssignedTo { get; set; }

    public string EventType { get; set; } = string.Empty;
}
