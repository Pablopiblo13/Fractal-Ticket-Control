
using System.Data;
using Dapper;
using MySqlConnector;
using TicketControl.Api.Models;

namespace TicketControl.Api.Repositories;

public class TicketRepository : ITicketRepository
{
    private readonly string _connectionString;

    private sealed class TicketDeletionInfo
    {
        public string Status { get; set; } = string.Empty;
        public string? AssignedTo { get; set; }
    }

    public TicketRepository(IConfiguration configuration)
    {
        _connectionString =
            configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "Connection string not found."
            );
    }

    private MySqlConnection CreateConnection()
    {
        return new MySqlConnection(_connectionString);
    }

    // Ticket queries
    public async Task<IEnumerable<Ticket>> GetAllAsync()
    {
        using var connection = CreateConnection();

        const string sql = @"
            SELECT
                id AS Id,
                title AS Title,
                equipment AS Equipment,
                description AS Description,
                status AS Status,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt,
                CreatedBy,
                AssignedTo
            FROM tickets
            WHERE IsDeleted = 0
            ORDER BY id DESC;
        ";

        return await connection.QueryAsync<Ticket>(sql);
    }

    public async Task<Ticket?> GetByIdAsync(int id)
    {
        using var connection = CreateConnection();

        const string sql = @"
            SELECT
                id AS Id,
                title AS Title,
                equipment AS Equipment,
                description AS Description,
                status AS Status,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt,
                CreatedBy,
                AssignedTo
            FROM tickets
            WHERE id = @Id
              AND IsDeleted = 0;
        ";

        return await connection.QuerySingleOrDefaultAsync<Ticket>(
            sql,
            new { Id = id }
        );
    }

    // Deleted ticket queries
    public async Task<IEnumerable<Ticket>> GetDeletedAsync()
    {
        using var connection = CreateConnection();

        const string sql = @"
            SELECT
                id AS Id,
                title AS Title,
                equipment AS Equipment,
                description AS Description,
                status AS Status,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt,
                CreatedBy,
                AssignedTo,
                IsDeleted,
                DeletedAt,
                DeletedBy,
                DeleteReason
            FROM tickets
            WHERE IsDeleted = 1
            ORDER BY DeletedAt DESC, id DESC;
        ";

        return await connection.QueryAsync<Ticket>(sql);
    }

    // Ticket creation
    public async Task<int> CreateAsync(
        string title,
        string equipment,
        string description,
        string? createdBy,
        string assignedTo
    )
    {
        using var connection = CreateConnection();

        var parameters = new DynamicParameters();

        parameters.Add(
            "p_title",
            title,
            DbType.String
        );

        parameters.Add(
            "p_equipment",
            equipment,
            DbType.String
        );

        parameters.Add(
            "p_description",
            description,
            DbType.String
        );

        parameters.Add(
            "p_created_by",
            createdBy,
            DbType.String
        );

        parameters.Add(
            "p_assigned_to",
            assignedTo,
            DbType.String
        );

        parameters.Add(
            "p_new_id",
            dbType: DbType.Int32,
            direction: ParameterDirection.Output
        );

        await connection.ExecuteAsync(
            "sp_CreateTicket",
            parameters,
            commandType: CommandType.StoredProcedure
        );

        return parameters.Get<int>("p_new_id");
    }

    // Ticket status updates
    public async Task ChangeStatusAsync(
        int id,
        string newStatus,
        string comment,
        string? assignedTo,
        string changedBy
    )
    {
        using var connection = CreateConnection();

        const string checkSql = @"
            SELECT COUNT(*)
            FROM tickets
            WHERE id = @Id
              AND IsDeleted = 0;
        ";

        var exists = await connection.ExecuteScalarAsync<int>(
            checkSql,
            new { Id = id }
        );

        if (exists == 0)
        {
            throw new InvalidOperationException(
                "Ticket not found or already deleted."
            );
        }

        var parameters = new DynamicParameters();

        parameters.Add(
            "p_ticket_id",
            id,
            DbType.Int32
        );

        parameters.Add(
            "p_new_status",
            newStatus,
            DbType.String
        );

        parameters.Add(
            "p_comment",
            comment,
            DbType.String
        );

        parameters.Add(
            "p_assigned_to",
            assignedTo,
            DbType.String
        );

        parameters.Add(
            "p_changed_by",
            changedBy,
            DbType.String
        );

        await connection.ExecuteAsync(
            "sp_ChangeTicketStatus",
            parameters,
            commandType: CommandType.StoredProcedure
        );
    }

    // Soft delete with audit history
    public async Task<bool> SoftDeleteAsync(
        int id,
        string deletedBy,
        string reason
    )
    {
        using var connection = CreateConnection();
        await connection.OpenAsync();

        using var transaction =
            await connection.BeginTransactionAsync();

        try
        {
            const string ticketSql = @"
                SELECT
                    status AS Status,
                    AssignedTo
                FROM tickets
                WHERE id = @Id
                  AND IsDeleted = 0
                FOR UPDATE;
            ";

            var ticket =
                await connection.QuerySingleOrDefaultAsync<TicketDeletionInfo>(
                    ticketSql,
                    new { Id = id },
                    transaction
                );

            if (ticket is null)
            {
                await transaction.RollbackAsync();
                return false;
            }

            const string updateSql = @"
                UPDATE tickets
                SET
                    IsDeleted = 1,
                    DeletedAt = NOW(),
                    DeletedBy = @DeletedBy,
                    DeleteReason = @Reason,
                    updated_at = NOW()
                WHERE id = @Id
                  AND IsDeleted = 0;
            ";

            var affectedRows = await connection.ExecuteAsync(
                updateSql,
                new
                {
                    Id = id,
                    DeletedBy = deletedBy,
                    Reason = reason
                },
                transaction
            );

            if (affectedRows != 1)
            {
                await transaction.RollbackAsync();
                return false;
            }

            const string historySql = @"
                INSERT INTO ticket_history (
                    ticket_id,
                    previous_status,
                    new_status,
                    comment,
                    ChangedBy,
                    PreviousAssignedTo,
                    NewAssignedTo,
                    EventType
                )
                VALUES (
                    @Id,
                    @Status,
                    @Status,
                    @Reason,
                    @DeletedBy,
                    @AssignedTo,
                    @AssignedTo,
                    'DELETED'
                );
            ";

            await connection.ExecuteAsync(
                historySql,
                new
                {
                    Id = id,
                    Status = ticket.Status,
                    Reason = reason,
                    DeletedBy = deletedBy,
                    AssignedTo = ticket.AssignedTo
                },
                transaction
            );

            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    // Ticket history
    public async Task<IEnumerable<TicketHistory>>
        GetHistoryByTicketIdAsync(int ticketId)
    {
        using var connection = CreateConnection();

        const string sql = @"
            SELECT
                id AS Id,
                ticket_id AS TicketId,
                previous_status AS PreviousStatus,
                new_status AS NewStatus,
                comment AS Comment,
                created_at AS CreatedAt,
                ChangedBy,
                PreviousAssignedTo,
                NewAssignedTo,
                EventType
            FROM ticket_history
            WHERE ticket_id = @TicketId
            ORDER BY created_at DESC;
        ";

        return await connection.QueryAsync<TicketHistory>(
            sql,
            new { TicketId = ticketId }
        );
    }
}
