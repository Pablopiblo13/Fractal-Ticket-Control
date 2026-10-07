using System.Data;
using Dapper;
using MySqlConnector;
using TicketControl.Api.Models;

namespace TicketControl.Api.Repositories;

public class TicketRepository : ITicketRepository
{
    private readonly string _connectionString;

    public TicketRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection") 
            ?? throw new InvalidOperationException("Connection string not found.");
    }

    private IDbConnection CreateConnection() => new MySqlConnection(_connectionString);

    public async Task<IEnumerable<Ticket>> GetAllAsync()
    {
        using var connection = CreateConnection();
        string sql = "SELECT * FROM Tickets ORDER BY Id DESC;";
        return await connection.QueryAsync<Ticket>(sql);
    }

    public async Task<Ticket?> GetByIdAsync(int id)
    {
        using var connection = CreateConnection();
        string sql = "SELECT * FROM Tickets WHERE Id = @Id;";
        return await connection.QuerySingleOrDefaultAsync<Ticket>(sql, new { Id = id });
    }

    public async Task<int> CreateAsync(string title, string equipment, string description)
    {
        using var connection = CreateConnection();
        var parameters = new DynamicParameters();
        parameters.Add("p_Title", title);
        parameters.Add("p_Equipment", equipment);
        parameters.Add("p_Description", description);
        parameters.Add("p_InsertedId", dbType: DbType.Int32, direction: ParameterDirection.Output);

        await connection.ExecuteAsync("sp_CreateTicket", parameters, commandType: CommandType.StoredProcedure);

        return parameters.Get<int>("p_InsertedId");
    }

    public async Task ChangeStatusAsync(int id, string newStatus, string comment)
    {
        using var connection = CreateConnection();
        var parameters = new DynamicParameters();
        parameters.Add("p_TicketId", id);
        parameters.Add("p_NewStatus", newStatus);
        parameters.Add("p_Comment", comment);

        await connection.ExecuteAsync("sp_ChangeTicketStatus", parameters, commandType: CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<TicketHistory>> GetHistoryByTicketIdAsync(int ticketId)
    {
        using var connection = CreateConnection();
        string sql = "SELECT * FROM TicketHistories WHERE TicketId = @TicketId ORDER BY CreatedAt DESC;";
        return await connection.QueryAsync<TicketHistory>(sql, new { TicketId = ticketId });
    }
}