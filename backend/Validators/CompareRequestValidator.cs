using System.Text.RegularExpressions;
using CompareAnything.Backend.DTOs;

namespace CompareAnything.Backend.Validators;

public class ValidationResult
{
    public bool IsValid { get; set; }
    public string? ErrorMessage { get; set; }
    public int StatusCode { get; set; } = 400;

    public static ValidationResult Success() => new() { IsValid = true };
    public static ValidationResult Fail(string message, int statusCode = 400) => new() 
    { 
        IsValid = false, 
        ErrorMessage = message, 
        StatusCode = statusCode 
    };
}

public static class CompareRequestValidator
{
    private const int MaxCharactersPerPage = 15000;
    private const int MaxGoalCharacters = 1000;

    public static ValidationResult Validate(CompareRequest? request)
    {
        if (request == null)
        {
            return ValidationResult.Fail("Invalid request payload.");
        }

        if (string.IsNullOrWhiteSpace(request.InstallId))
        {
            return ValidationResult.Fail("Install ID is required.");
        }

        if (request.Goal != null && request.Goal.Length > MaxGoalCharacters)
        {
            return ValidationResult.Fail($"User goal cannot exceed {MaxGoalCharacters} characters.");
        }

        if (request.Pages == null || request.Pages.Count < 2)
        {
            return ValidationResult.Fail("Add at least one more page to compare.");
        }

        if (request.Pages.Count > 4)
        {
            return ValidationResult.Fail("Maximum 4 pages can be compared.");
        }

        var seenIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var seenUrls = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        bool hasAnyMeaningfulText = false;

        foreach (var page in request.Pages)
        {
            if (string.IsNullOrWhiteSpace(page.Id))
            {
                return ValidationResult.Fail("Page ID is required for each page.");
            }

            if (!seenIds.Add(page.Id))
            {
                return ValidationResult.Fail($"Duplicate page ID detected: {page.Id}");
            }

            if (string.IsNullOrWhiteSpace(page.Url) || !Uri.TryCreate(page.Url, UriKind.Absolute, out var parsedUri) || 
                (parsedUri.Scheme != Uri.UriSchemeHttp && parsedUri.Scheme != Uri.UriSchemeHttps))
            {
                return ValidationResult.Fail($"Invalid webpage URL: '{page.Url}'");
            }

            // Normalize URL for duplicate detection (strip query & fragment)
            var normalizedUrl = $"{parsedUri.Scheme}://{parsedUri.Authority}{parsedUri.AbsolutePath}".TrimEnd('/');
            if (!seenUrls.Add(normalizedUrl))
            {
                return ValidationResult.Fail("This page is already in your comparison.");
            }

            if (page.ImportantText != null && page.ImportantText.Length > MaxCharactersPerPage)
            {
                return ValidationResult.Fail($"Page content for '{page.Title}' exceeds maximum allowed length.");
            }

            if (!string.IsNullOrWhiteSpace(page.ImportantText) && page.ImportantText.Trim().Length > 20)
            {
                hasAnyMeaningfulText = true;
            }
        }

        if (!hasAnyMeaningfulText)
        {
            return ValidationResult.Fail("We couldn't extract enough information from this page.");
        }

        return ValidationResult.Success();
    }
}
