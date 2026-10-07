namespace TicketControl.Api.Dtos;

public class CreateTicketDto
{
    public string Title { get; set; } = string.Empty;
    public string Equipment { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}