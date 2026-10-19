
namespace TicketControl.Api.Dtos;

public class DeleteTicketDto
{
    public string DeletedBy { get; set; } = string.Empty;

    public string Reason { get; set; } = string.Empty;
}
