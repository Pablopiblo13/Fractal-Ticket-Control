using TicketControl.Api.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register Repository Dependency Injection
builder.Services.AddScoped<ITicketRepository, TicketRepository>();

// Configure CORS for Angular Frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
// Habilitamos Swagger y lo configuramos en la raíz (/) para que funcione en producción en Railway
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "TicketControl API V1");
    c.RoutePrefix = string.Empty; 
});

app.UseCors("AllowAngular");
app.UseAuthorization();
app.MapControllers();

app.Run();