using TicketControl.Api.Repositories;
using Microsoft.Extensions.FileProviders;
var builder = WebApplication.CreateBuilder(args);


builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();


builder.Services.AddScoped<ITicketRepository, TicketRepository>();


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

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "TicketControl API V1");
    c.RoutePrefix = "swagger"; 
});

app.UseCors("AllowAngular");

app.UseRouting();

app.UseAuthorization();

app.UseStaticFiles();

app.MapControllers();


app.MapFallbackToFile("index.html");

app.Run();