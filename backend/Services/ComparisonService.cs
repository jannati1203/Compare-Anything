using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using CompareAnything.Backend.Configuration;
using CompareAnything.Backend.DTOs;
using CompareAnything.Backend.Services.AI;
using CompareAnything.Backend.Validators;

namespace CompareAnything.Backend.Services;

public interface IComparisonService
{
    Task<CompareResponse> ProcessComparisonAsync(
        CompareRequest request, 
        string clientIp, 
        CancellationToken cancellationToken);
}

public class ComparisonService : IComparisonService
{
    private readonly IEnumerable<IAIProvider> _providers;
    private readonly IRateLimiterService _rateLimiter;
    private readonly AISettings _aiSettings;
    private readonly ILogger<ComparisonService> _logger;

    public ComparisonService(
        IEnumerable<IAIProvider> providers,
        IRateLimiterService rateLimiter,
        IOptions<AISettings> aiOptions,
        ILogger<ComparisonService> logger)
    {
        _providers = providers;
        _rateLimiter = rateLimiter;
        _aiSettings = aiOptions.Value;
        _logger = logger;
    }

    public async Task<CompareResponse> ProcessComparisonAsync(
        CompareRequest request, 
        string clientIp, 
        CancellationToken cancellationToken)
    {
        var stopwatch = Stopwatch.StartNew();
        var hashedInstallId = HashInstallId(request.InstallId);

        // 1. Validate request
        var validation = CompareRequestValidator.Validate(request);
        if (!validation.IsValid)
        {
            _logger.LogWarning(
                "Request validation failed for InstallId {HashedInstallId}: {ErrorMessage}", 
                hashedInstallId, 
                validation.ErrorMessage
            );
            throw new ArgumentException(validation.ErrorMessage);
        }

        // 2. Check Rate Limits
        var (rateAllowed, rateError) = _rateLimiter.CheckAndRecord(request.InstallId, clientIp);
        if (!rateAllowed)
        {
            _logger.LogWarning(
                "Rate limit reached for InstallId {HashedInstallId} (IP: {IpAddress})", 
                hashedInstallId, 
                clientIp
            );
            throw new HttpRequestException(rateError, null, System.Net.HttpStatusCode.TooManyRequests);
        }

        // 3. Select configured AI Provider
        var targetProviderName = string.IsNullOrWhiteSpace(_aiSettings.Provider) ? "Groq" : _aiSettings.Provider;
        var provider = _providers.FirstOrDefault(p => 
            p.ProviderName.Equals(targetProviderName, StringComparison.OrdinalIgnoreCase)
        );

        if (provider == null)
        {
            _logger.LogError(
                "Configured AI provider '{TargetProvider}' was not found among registered providers.", 
                targetProviderName
            );
            throw new InvalidOperationException($"AI provider '{targetProviderName}' is not available.");
        }

        _logger.LogInformation(
            "Starting comparison. InstallId: {HashedInstallId}, Pages: {PageCount}, Provider: {Provider}, Model: {Model}",
            hashedInstallId,
            request.Pages.Count,
            provider.ProviderName,
            _aiSettings.Model
        );

        // 4. Delegate to AI Provider
        CompareResponse response;
        try
        {
            response = await provider.CompareAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(
                ex,
                "Comparison failed. InstallId: {HashedInstallId}, DurationMs: {DurationMs}, Provider: {Provider}",
                hashedInstallId,
                stopwatch.ElapsedMilliseconds,
                provider.ProviderName
            );
            throw;
        }

        stopwatch.Stop();
        _logger.LogInformation(
            "Comparison completed successfully. InstallId: {HashedInstallId}, DurationMs: {DurationMs}, CriteriaCount: {CriteriaCount}",
            hashedInstallId,
            stopwatch.ElapsedMilliseconds,
            response.Criteria.Count
        );

        return response;
    }

    private static string HashInstallId(string? installId)
    {
        if (string.IsNullOrWhiteSpace(installId)) return "anonymous";
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(installId));
        return Convert.ToHexString(bytes)[..12].ToLowerInvariant();
    }
}
