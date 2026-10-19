
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;
using TicketControl.Api.Dtos;
using TicketControl.Api.Repositories;

namespace TicketControl.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TicketsController : ControllerBase
{
    private readonly ITicketRepository _repository;

    public TicketsController(ITicketRepository repository)
    {
        _repository = repository;
    }

    // Ticket queries
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var tickets = await _repository.GetAllAsync();
        return Ok(tickets);
    }

    // Deleted ticket queries
    [HttpGet("deleted")]
    public async Task<IActionResult> GetDeleted()
    {
        var tickets = await _repository.GetDeletedAsync();
        return Ok(tickets);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var ticket = await _repository.GetByIdAsync(id);

        if (ticket == null)
        {
            return NotFound(new
            {
                message = $"Ticket #{id} not found."
            });
        }

        return Ok(ticket);
    }

    // Ticket creation
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateTicketDto dto)
    {
        if (
            string.IsNullOrWhiteSpace(dto.Title) ||
            string.IsNullOrWhiteSpace(dto.Equipment)
        )
        {
            return BadRequest(new
            {
                message = "Title and Equipment are required fields."
            });
        }

        if (string.IsNullOrWhiteSpace(dto.AssignedTo))
        {
            return BadRequest(new
            {
                message = "AssignedTo is required."
            });
        }

        string? createdBy = null;

        var newId = await _repository.CreateAsync(
            dto.Title.Trim(),
            dto.Equipment.Trim(),
            dto.Description ?? string.Empty,
            createdBy,
            dto.AssignedTo.Trim()
        );

        var createdTicket = await _repository.GetByIdAsync(newId);

        return CreatedAtAction(
            nameof(GetById),
            new { id = newId },
            createdTicket
        );
    }

    // Ticket status updates
    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> ChangeStatus(
        int id,
        [FromBody] ChangeStatusDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.NewStatus))
        {
            return BadRequest(new
            {
                message = "NewStatus is required."
            });
        }

        if (string.IsNullOrWhiteSpace(dto.ChangedBy))
        {
            return BadRequest(new
            {
                message = "ChangedBy is required."
            });
        }

        try
        {
            await _repository.ChangeStatusAsync(
                id,
                dto.NewStatus.Trim(),
                dto.Comment ?? string.Empty,
                null,
                dto.ChangedBy.Trim()
            );

            var updatedTicket = await _repository.GetByIdAsync(id);

            return Ok(updatedTicket);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new
            {
                message = ex.Message
            });
        }
        catch (MySqlException ex)
            when (ex.SqlState == "45000")
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
        catch (Exception)
        {
            return StatusCode(500, new
            {
                message = "An error occurred while updating status."
            });
        }
    }

    // Ticket soft deletion
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> SoftDelete(
        int id,
        [FromBody] DeleteTicketDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.DeletedBy))
        {
            return BadRequest(new
            {
                message = "DeletedBy is required."
            });
        }

        if (string.IsNullOrWhiteSpace(dto.Reason))
        {
            return BadRequest(new
            {
                message = "A deletion reason is required."
            });
        }

        try
        {
            var deleted = await _repository.SoftDeleteAsync(
                id,
                dto.DeletedBy.Trim(),
                dto.Reason.Trim()
            );

            if (!deleted)
            {
                return NotFound(new
                {
                    message = $"Ticket #{id} not found or already deleted."
                });
            }

            return Ok(new
            {
                message = $"Ticket #{id} was successfully deleted.",
                ticketId = id
            });
        }
        catch (Exception)
        {
            return StatusCode(500, new
            {
                message = "An error occurred while deleting the ticket."
            });
        }
    }

    // Ticket history
    [HttpGet("{id:int}/history")]
    public async Task<IActionResult> GetHistory(int id)
    {
        var history = await _repository.GetHistoryByTicketIdAsync(id);
        return Ok(history);
    }
}
