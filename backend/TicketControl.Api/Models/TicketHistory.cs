namespace TicketControl.Api.Models;

public class TicketHistory
{
    public int Id { get; set; }
    public int TicketId { get; set; }
    public string? PreviousStatus { get; set; }
    public string NewStatus { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}