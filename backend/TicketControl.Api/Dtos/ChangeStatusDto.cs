namespace TicketControl.Api.Dtos;

public class ChangeStatusDto
{
    public string NewStatus { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
}