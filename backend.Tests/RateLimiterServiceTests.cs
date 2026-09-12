using Microsoft.Extensions.Options;
using Xunit;
using CompareAnything.Backend.Configuration;
using CompareAnything.Backend.Services;

namespace CompareAnything.Backend.Tests;

public class RateLimiterServiceTests
{
    [Fact]
    public void CheckAndRecord_UnderLimit_AllowsRequests()
    {
        var options = Options.Create(new RateLimitSettings
        {
            Enabled = true,
            ComparisonsPerInstallPerDay = 3,
            ComparisonsPerIpPerHour = 10
        });

        var limiter = new RateLimiterService(options);

        var (allowed1, _) = limiter.CheckAndRecord("user-1", "127.0.0.1");
        var (allowed2, _) = limiter.CheckAndRecord("user-1", "127.0.0.1");

        Assert.True(allowed1);
        Assert.True(allowed2);
    }

    [Fact]
    public void CheckAndRecord_ExceedingInstallLimit_ReturnsFriendlyRateLimitMessage()
    {
        var options = Options.Create(new RateLimitSettings
        {
            Enabled = true,
            ComparisonsPerInstallPerDay = 2,
            ComparisonsPerIpPerHour = 100
        });

        var limiter = new RateLimiterService(options);

        limiter.CheckAndRecord("user-max", "127.0.0.1");
        limiter.CheckAndRecord("user-max", "127.0.0.1");

        // 3rd attempt should be rejected
        var (allowed3, error3) = limiter.CheckAndRecord("user-max", "127.0.0.1");

        Assert.False(allowed3);
        Assert.Equal("Today's free comparison limit has been reached. Please try again later.", error3);
    }
}
