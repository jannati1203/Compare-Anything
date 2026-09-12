using System.Collections.Concurrent;
using Microsoft.Extensions.Options;
using CompareAnything.Backend.Configuration;

namespace CompareAnything.Backend.Services;

public interface IRateLimiterService
{
    (bool Allowed, string? ErrorMessage) CheckAndRecord(string installId, string ipAddress);
}

public class RateLimiterService : IRateLimiterService
{
    private readonly RateLimitSettings _settings;
    private readonly ConcurrentDictionary<string, List<DateTime>> _installTimestamps = new(StringComparer.OrdinalIgnoreCase);
    private readonly ConcurrentDictionary<string, List<DateTime>> _ipTimestamps = new(StringComparer.OrdinalIgnoreCase);
    private readonly object _lock = new();

    public RateLimiterService(IOptions<RateLimitSettings> options)
    {
        _settings = options.Value;
    }

    public (bool Allowed, string? ErrorMessage) CheckAndRecord(string installId, string ipAddress)
    {
        if (!_settings.Enabled)
        {
            return (true, null);
        }

        var now = DateTime.UtcNow;
        var oneDayAgo = now.AddHours(-24);
        var oneHourAgo = now.AddHours(-1);

        lock (_lock)
        {
            // 1. Check Install ID limit (daily window)
            if (!string.IsNullOrWhiteSpace(installId))
            {
                var installList = _installTimestamps.GetOrAdd(installId, _ => new List<DateTime>());
                installList.RemoveAll(dt => dt < oneDayAgo);

                if (installList.Count >= _settings.ComparisonsPerInstallPerDay)
                {
                    return (false, "Today's free comparison limit has been reached. Please try again later.");
                }
            }

            // 2. Check IP address limit (hourly window)
            if (!string.IsNullOrWhiteSpace(ipAddress))
            {
                var ipList = _ipTimestamps.GetOrAdd(ipAddress, _ => new List<DateTime>());
                ipList.RemoveAll(dt => dt < oneHourAgo);

                if (ipList.Count >= _settings.ComparisonsPerIpPerHour)
                {
                    return (false, "Rate limit exceeded. Please try again later.");
                }
            }

            // Record this request
            if (!string.IsNullOrWhiteSpace(installId))
            {
                _installTimestamps[installId].Add(now);
            }
            if (!string.IsNullOrWhiteSpace(ipAddress))
            {
                _ipTimestamps[ipAddress].Add(now);
            }

            return (true, null);
        }
    }
}
