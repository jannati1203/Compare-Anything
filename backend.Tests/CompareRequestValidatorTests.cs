using Xunit;
using CompareAnything.Backend.DTOs;
using CompareAnything.Backend.Validators;

namespace CompareAnything.Backend.Tests;

public class CompareRequestValidatorTests
{
    private static PageInputDto CreateValidPage(string id, string url, string title = "Title") => new()
    {
        Id = id,
        Url = url,
        Domain = new Uri(url).Host,
        Title = title,
        ImportantText = "Specifications and product details here for comparison testing."
    };

    [Fact]
    public void Validate_TwoValidPages_Passes()
    {
        var request = new CompareRequest
        {
            InstallId = "install-123",
            Pages = new List<PageInputDto>
            {
                CreateValidPage("p1", "https://example.com/item1"),
                CreateValidPage("p2", "https://example.com/item2")
            }
        };

        var result = CompareRequestValidator.Validate(request);
        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_FourValidPages_Passes()
    {
        var request = new CompareRequest
        {
            InstallId = "install-123",
            Pages = new List<PageInputDto>
            {
                CreateValidPage("p1", "https://example.com/item1"),
                CreateValidPage("p2", "https://example.com/item2"),
                CreateValidPage("p3", "https://example.com/item3"),
                CreateValidPage("p4", "https://example.com/item4")
            }
        };

        var result = CompareRequestValidator.Validate(request);
        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_OnePage_FailsWithFriendlyError()
    {
        var request = new CompareRequest
        {
            InstallId = "install-123",
            Pages = new List<PageInputDto>
            {
                CreateValidPage("p1", "https://example.com/item1")
            }
        };

        var result = CompareRequestValidator.Validate(request);
        Assert.False(result.IsValid);
        Assert.Equal("Add at least one more page to compare.", result.ErrorMessage);
    }

    [Fact]
    public void Validate_FivePages_FailsWithFriendlyError()
    {
        var request = new CompareRequest
        {
            InstallId = "install-123",
            Pages = new List<PageInputDto>
            {
                CreateValidPage("p1", "https://example.com/item1"),
                CreateValidPage("p2", "https://example.com/item2"),
                CreateValidPage("p3", "https://example.com/item3"),
                CreateValidPage("p4", "https://example.com/item4"),
                CreateValidPage("p5", "https://example.com/item5")
            }
        };

        var result = CompareRequestValidator.Validate(request);
        Assert.False(result.IsValid);
        Assert.Equal("Maximum 4 pages can be compared.", result.ErrorMessage);
    }

    [Fact]
    public void Validate_InvalidUrl_Fails()
    {
        var request = new CompareRequest
        {
            InstallId = "install-123",
            Pages = new List<PageInputDto>
            {
                new() { Id = "p1", Url = "not-a-url", ImportantText = "Details" },
                CreateValidPage("p2", "https://example.com/item2")
            }
        };

        var result = CompareRequestValidator.Validate(request);
        Assert.False(result.IsValid);
        Assert.Contains("Invalid webpage URL", result.ErrorMessage);
    }

    [Fact]
    public void Validate_DuplicateNormalizedUrls_FailsWithFriendlyError()
    {
        var request = new CompareRequest
        {
            InstallId = "install-123",
            Pages = new List<PageInputDto>
            {
                CreateValidPage("p1", "https://example.com/product/"),
                CreateValidPage("p2", "https://example.com/product")
            }
        };

        var result = CompareRequestValidator.Validate(request);
        Assert.False(result.IsValid);
        Assert.Equal("This page is already in your comparison.", result.ErrorMessage);
    }

    [Fact]
    public void Validate_EmptyImportantTextAcrossPages_FailsWithFriendlyError()
    {
        var request = new CompareRequest
        {
            InstallId = "install-123",
            Pages = new List<PageInputDto>
            {
                new() { Id = "p1", Url = "https://example.com/1", ImportantText = "" },
                new() { Id = "p2", Url = "https://example.com/2", ImportantText = "   " }
            }
        };

        var result = CompareRequestValidator.Validate(request);
        Assert.False(result.IsValid);
        Assert.Equal("We couldn't extract enough information from this page.", result.ErrorMessage);
    }
}
