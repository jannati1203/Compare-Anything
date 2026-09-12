using CompareAnything.Backend.Configuration;
using CompareAnything.Backend.Middleware;
using CompareAnything.Backend.Services;
using CompareAnything.Backend.Services.AI;

// Automatically load .env files from current or parent directories
EnvLoader.Load();

var builder = WebApplication.CreateBuilder(args);

// Load environment variables (from .env or system environment)
builder.Configuration.AddEnvironmentVariables();

// Bind Configuration Options
builder.Services.Configure<AISettings>(
    builder.Configuration.GetSection(AISettings.SectionName)
);
builder.Services.Configure<RateLimitSettings>(
    builder.Configuration.GetSection(RateLimitSettings.SectionName)
);

// Register HTTP Clients with reasonable timeouts
builder.Services.AddHttpClient<GroqProvider>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(60);
});

builder.Services.AddHttpClient<OpenRouterProvider>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(60);
});

// Register AI Providers (modular provider selection)
builder.Services.AddSingleton<IAIProvider, GroqProvider>();
builder.Services.AddSingleton<IAIProvider, OpenRouterProvider>();

// Register Core Services
builder.Services.AddSingleton<IRateLimiterService, RateLimiterService>();
builder.Services.AddScoped<IComparisonService, ComparisonService>();

// Add Controllers
builder.Services.AddControllers();

// Configure CORS narrowly
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
                     ?? new[] { "http://localhost:5173", "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("ExtensionPolicy", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
        {
            if (string.IsNullOrEmpty(origin)) return true;

            // Allow Chrome extension origins (e.g., chrome-extension://<extension-id>)
            if (origin.StartsWith("chrome-extension://", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            // Allow localhost and 127.0.0.1 origins
            if (origin.StartsWith("http://localhost", StringComparison.OrdinalIgnoreCase) ||
                origin.StartsWith("http://127.0.0.1", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            // Allow configured local origins
            if (allowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
            {
                return true;
            }

            return false;
        })
        .WithMethods("POST", "GET", "OPTIONS")
        .AllowAnyHeader()
        .SetPreflightMaxAge(TimeSpan.FromHours(1));
    });
});

var app = builder.Build();

// CORS first to ensure preflight and error responses include Access-Control-Allow-Origin
app.UseCors("ExtensionPolicy");

// Security Headers Middleware
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    await next();
});

// Production HTTPS redirection and HSTS
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

// Centralized error handling
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Health check
app.MapGet("/health", () => Results.Ok(new 
{ 
    status = "healthy", 
    service = "Compare Anything AI Backend",
    timestamp = DateTime.UtcNow 
}));

app.MapControllers();

app.Run();

// For integration testing support
public partial class Program { }
