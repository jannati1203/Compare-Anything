using System.Net;
using System.Text.Json;

namespace CompareAnything.Backend.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var statusCode = HttpStatusCode.InternalServerError;
        string userMessage;

        switch (exception)
        {
            case ArgumentException argEx:
                statusCode = HttpStatusCode.BadRequest;
                userMessage = argEx.Message;
                break;

            case HttpRequestException httpEx when httpEx.StatusCode == HttpStatusCode.TooManyRequests:
                statusCode = HttpStatusCode.TooManyRequests;
                userMessage = string.IsNullOrWhiteSpace(httpEx.Message) 
                    ? "Free AI capacity is temporarily unavailable." 
                    : httpEx.Message;
                break;

            case TimeoutException:
                statusCode = HttpStatusCode.GatewayTimeout;
                userMessage = "Comparison couldn't be generated. Please try again.";
                break;

            case InvalidOperationException invEx:
                statusCode = HttpStatusCode.BadGateway;
                userMessage = string.IsNullOrWhiteSpace(invEx.Message) 
                    ? "Comparison couldn't be generated. Please try again." 
                    : invEx.Message;
                break;

            default:
                _logger.LogError(exception, "Unhandled exception caught in pipeline.");
                statusCode = HttpStatusCode.InternalServerError;
                userMessage = "Compare Anything is temporarily unavailable.";
                break;
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var errorResponse = new
        {
            error = userMessage,
            status = (int)statusCode
        };

        var json = JsonSerializer.Serialize(errorResponse);
        await context.Response.WriteAsync(json);
    }
}
