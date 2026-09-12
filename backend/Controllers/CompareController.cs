using Microsoft.AspNetCore.Mvc;
using CompareAnything.Backend.DTOs;
using CompareAnything.Backend.Services;

namespace CompareAnything.Backend.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class CompareController : ControllerBase
{
    private readonly IComparisonService _comparisonService;

    public CompareController(IComparisonService comparisonService)
    {
        _comparisonService = comparisonService;
    }

    [HttpPost]
    [ProducesResponseType(typeof(CompareResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Compare([FromBody] CompareRequest request, CancellationToken cancellationToken)
    {
        var clientIp = GetClientIpAddress();
        var result = await _comparisonService.ProcessComparisonAsync(request, clientIp, cancellationToken);
        return Ok(result);
    }

    private string GetClientIpAddress()
    {
        if (Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor))
        {
            var ip = forwardedFor.FirstOrDefault()?.Split(',').FirstOrDefault()?.Trim();
            if (!string.IsNullOrWhiteSpace(ip)) return ip;
        }

        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
    }
}
