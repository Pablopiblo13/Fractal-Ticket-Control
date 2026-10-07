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

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var tickets = await _repository.GetAllAsync();
        return Ok(tickets);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var ticket = await _repository.GetByIdAsync(id);
        if (ticket == null) return NotFound(new { message = $"Ticket #{id} not found." });
        return Ok(ticket);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTicketDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Equipment))
        {
            return BadRequest(new { message = "Title and Equipment are required fields." });
        }

        var newId = await _repository.CreateAsync(dto.Title, dto.Equipment, dto.Description);
        var createdTicket = await _repository.GetByIdAsync(newId);

        return CreatedAtAction(nameof(GetById), new { id = newId }, createdTicket);
    }

    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> ChangeStatus(int id, [FromBody] ChangeStatusDto dto)
    {
        try
        {
            await _repository.ChangeStatusAsync(id, dto.NewStatus, dto.Comment);
            var updatedTicket = await _repository.GetByIdAsync(id);
            return Ok(updatedTicket);
        }
        catch (MySqlException ex) when (ex.SqlState == "45000")
        {
            // Captura los errores lanzados por la máquina de estados dentro del SP
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while updating status.", detail = ex.Message });
        }
    }

    [HttpGet("{id:int}/history")]
    public async Task<IActionResult> GetHistory(int id)
    {
        var history = await _repository.GetHistoryByTicketIdAsync(id);
        return Ok(history);
    }
}