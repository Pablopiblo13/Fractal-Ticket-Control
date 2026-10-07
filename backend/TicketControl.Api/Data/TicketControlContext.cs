using Microsoft.EntityFrameworkCore;

namespace TicketControl.Api.Data
{
    public class TicketControlContext : DbContext
    {
        public TicketControlContext(DbContextOptions<TicketControlContext> options) : base(options)
        {
        }

        public DbSet<Ticket> Tickets { get; set; }
        public DbSet<TicketHistory> TicketHistories { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Mapeo explícito a los nombres reales de las tablas en MySQL
            modelBuilder.Entity<Ticket>().ToTable("tickets");
            modelBuilder.Entity<TicketHistory>().ToTable("ticket_history");
        }
    }

    // Clases modelo correspondientes a tus tablas
    public class Ticket
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Equipment { get; set; }
        public string Description { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class TicketHistory
    {
        public int Id { get; set; }
        public int TicketId { get; set; }
        public string PreviousStatus { get; set; }
        public string NewStatus { get; set; }
        public string Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}