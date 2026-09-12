using System.Net;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;
using CompareAnything.Backend.Configuration;
using CompareAnything.Backend.DTOs;
using CompareAnything.Backend.Services;
using CompareAnything.Backend.Services.AI;

namespace CompareAnything.Backend.Tests;

public class MockAiProvider : IAIProvider
{
    public string ProviderName { get; }
    public CompareResponse ReturnResponse { get; set; }
    public bool ShouldThrow { get; set; }

    public MockAiProvider(string name, CompareResponse response)
    {
        ProviderName = name;
        ReturnResponse = response;
    }

    public Task<CompareResponse> CompareAsync(CompareRequest request, CancellationToken cancellationToken)
    {
        if (ShouldThrow)
        {
            throw new InvalidOperationException("Comparison couldn't be generated. Please try again.");
        }
        return Task.FromResult(ReturnResponse);
    }
}

public class ComparisonServiceTests
{
    private static CompareRequest CreateSampleRequest() => new()
    {
        InstallId = "install-test",
        Goal = "Best camera",
        Pages = new List<PageInputDto>
        {
            new()
            {
                Id = "p1",
                Url = "https://example.com/phone1",
                Domain = "example.com",
                Title = "Phone 1",
                ImportantText = "Camera: 50MP main sensor with OIS"
            },
            new()
            {
                Id = "p2",
                Url = "https://example.com/phone2",
                Domain = "example.com",
                Title = "Phone 2",
                ImportantText = "Camera: 48MP sensor"
            }
        }
    };

    [Fact]
    public async Task ProcessComparisonAsync_ValidRequest_CallsConfiguredProvider()
    {
        var expectedResponse = new CompareResponse
        {
            ComparisonTitle = "Phone 1 vs Phone 2",
            ComparisonType = "Product",
            Items = new List<ComparisonItemDto>
            {
                new() { Id = "p1", DisplayName = "Phone 1" },
                new() { Id = "p2", DisplayName = "Phone 2" }
            },
            Criteria = new List<ComparisonCriterionDto>
            {
                new() { Name = "Camera", Importance = "high" }
            }
        };

        var groqMock = new MockAiProvider("Groq", expectedResponse);
        var openRouterMock = new MockAiProvider("OpenRouter", expectedResponse);

        var options = Options.Create(new AISettings { Provider = "Groq", Model = "openai/gpt-oss-20b" });
        var rateLimiterOptions = Options.Create(new RateLimitSettings { Enabled = false });
        var rateLimiter = new RateLimiterService(rateLimiterOptions);

        var service = new ComparisonService(
            new IAIProvider[] { groqMock, openRouterMock },
            rateLimiter,
            options,
            NullLogger<ComparisonService>.Instance
        );

        var result = await service.ProcessComparisonAsync(CreateSampleRequest(), "127.0.0.1", CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Phone 1 vs Phone 2", result.ComparisonTitle);
        Assert.Equal(2, result.Items.Count);
    }

    [Fact]
    public async Task ProcessComparisonAsync_ChangeProviderToOpenRouter_SwitchesCleanly()
    {
        var groqResponse = new CompareResponse { ComparisonTitle = "Groq Result" };
        var orResponse = new CompareResponse { ComparisonTitle = "OpenRouter Result" };

        var groqMock = new MockAiProvider("Groq", groqResponse);
        var openRouterMock = new MockAiProvider("OpenRouter", orResponse);

        // Configure OpenRouter as the active provider
        var options = Options.Create(new AISettings { Provider = "OpenRouter" });
        var rateLimiterOptions = Options.Create(new RateLimitSettings { Enabled = false });
        var rateLimiter = new RateLimiterService(rateLimiterOptions);

        var service = new ComparisonService(
            new IAIProvider[] { groqMock, openRouterMock },
            rateLimiter,
            options,
            NullLogger<ComparisonService>.Instance
        );

        var result = await service.ProcessComparisonAsync(CreateSampleRequest(), "127.0.0.1", CancellationToken.None);

        Assert.Equal("OpenRouter Result", result.ComparisonTitle);
    }

    [Fact]
    public async Task ProcessComparisonAsync_RateLimitExceeded_ThrowsHttpRequestExceptionWith429()
    {
        var dummyResponse = new CompareResponse { ComparisonTitle = "Result" };
        var groqMock = new MockAiProvider("Groq", dummyResponse);

        var options = Options.Create(new AISettings { Provider = "Groq" });
        var rateLimiterOptions = Options.Create(new RateLimitSettings
        {
            Enabled = true,
            ComparisonsPerInstallPerDay = 1
        });
        var rateLimiter = new RateLimiterService(rateLimiterOptions);

        var service = new ComparisonService(
            new IAIProvider[] { groqMock },
            rateLimiter,
            options,
            NullLogger<ComparisonService>.Instance
        );

        var req = CreateSampleRequest();

        // 1st call succeeds
        await service.ProcessComparisonAsync(req, "127.0.0.1", CancellationToken.None);

        // 2nd call should trigger rate limit
        var ex = await Assert.ThrowsAsync<HttpRequestException>(() =>
            service.ProcessComparisonAsync(req, "127.0.0.1", CancellationToken.None)
        );

        Assert.Equal(HttpStatusCode.TooManyRequests, ex.StatusCode);
        Assert.Equal("Today's free comparison limit has been reached. Please try again later.", ex.Message);
    }

    [Fact]
    public async Task ProcessComparisonAsync_InvalidPageCount_ThrowsArgumentException()
    {
        var options = Options.Create(new AISettings { Provider = "Groq" });
        var rateLimiter = new RateLimiterService(Options.Create(new RateLimitSettings { Enabled = false }));

        var service = new ComparisonService(
            new IAIProvider[] { new MockAiProvider("Groq", new CompareResponse()) },
            rateLimiter,
            options,
            NullLogger<ComparisonService>.Instance
        );

        var badReq = new CompareRequest
        {
            InstallId = "id-1",
            Pages = new List<PageInputDto>
            {
                new() { Id = "p1", Url = "https://example.com/1", ImportantText = "Text" }
            }
        };

        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            service.ProcessComparisonAsync(badReq, "127.0.0.1", CancellationToken.None)
        );

        Assert.Equal("Add at least one more page to compare.", ex.Message);
    }
}
