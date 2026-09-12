using System.Text.Json;
using CompareAnything.Backend.DTOs;

namespace CompareAnything.Backend.Services.AI;

public static class AIResponseValidator
{
    public static CompareResponse ValidateAndSanitize(string rawJson, CompareRequest originalRequest)
    {
        if (string.IsNullOrWhiteSpace(rawJson))
        {
            throw new InvalidOperationException("Comparison couldn't be generated. Please try again.");
        }

        // Strip any markdown fences if the LLM accidentally included them
        var cleanedJson = rawJson.Trim();
        if (cleanedJson.StartsWith("```json", StringComparison.OrdinalIgnoreCase))
        {
            cleanedJson = cleanedJson.Substring(7);
        }
        else if (cleanedJson.StartsWith("```"))
        {
            cleanedJson = cleanedJson.Substring(3);
        }

        if (cleanedJson.EndsWith("```"))
        {
            cleanedJson = cleanedJson.Substring(0, cleanedJson.Length - 3);
        }
        cleanedJson = cleanedJson.Trim();

        CompareResponse? response;
        try
        {
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                AllowTrailingCommas = true
            };
            response = JsonSerializer.Deserialize<CompareResponse>(cleanedJson, options);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException("Comparison couldn't be generated. Please try again.", ex);
        }

        if (response == null)
        {
            throw new InvalidOperationException("Comparison couldn't be generated. Please try again.");
        }

        // Build valid set of input page IDs
        var validPageIds = new HashSet<string>(
            originalRequest.Pages.Select(p => p.Id),
            StringComparer.OrdinalIgnoreCase
        );

        // 1. Ensure comparisonTitle & comparisonType
        if (string.IsNullOrWhiteSpace(response.ComparisonTitle))
        {
            response.ComparisonTitle = "Page Comparison";
        }
        if (string.IsNullOrWhiteSpace(response.ComparisonType))
        {
            response.ComparisonType = "General";
        }
        response.Goal = originalRequest.Goal ?? string.Empty;

        // 2. Validate Items: map or filter to only valid input IDs
        var itemMap = response.Items?.ToDictionary(i => i.Id, i => i, StringComparer.OrdinalIgnoreCase) 
                      ?? new Dictionary<string, ComparisonItemDto>();

        var sanitizedItems = new List<ComparisonItemDto>();
        foreach (var page in originalRequest.Pages)
        {
            if (itemMap.TryGetValue(page.Id, out var existingItem))
            {
                sanitizedItems.Add(new ComparisonItemDto
                {
                    Id = page.Id,
                    DisplayName = string.IsNullOrWhiteSpace(existingItem.DisplayName) ? page.Title : existingItem.DisplayName,
                    ShortDescription = existingItem.ShortDescription ?? string.Empty
                });
            }
            else
            {
                sanitizedItems.Add(new ComparisonItemDto
                {
                    Id = page.Id,
                    DisplayName = page.Title,
                    ShortDescription = string.Empty
                });
            }
        }
        response.Items = sanitizedItems;

        // 3. Validate Criteria and criterion values
        response.Criteria ??= new List<ComparisonCriterionDto>();
        var sanitizedCriteria = new List<ComparisonCriterionDto>();

        foreach (var criterion in response.Criteria)
        {
            if (string.IsNullOrWhiteSpace(criterion.Name)) continue;

            var valMap = criterion.Values?.ToDictionary(v => v.ItemId, v => v, StringComparer.OrdinalIgnoreCase)
                         ?? new Dictionary<string, CriterionValueDto>();

            var sanitizedValues = new List<CriterionValueDto>();
            foreach (var page in originalRequest.Pages)
            {
                if (valMap.TryGetValue(page.Id, out var existingVal) && !string.IsNullOrWhiteSpace(existingVal.Value))
                {
                    sanitizedValues.Add(new CriterionValueDto
                    {
                        ItemId = page.Id,
                        Value = existingVal.Value,
                        Confidence = string.IsNullOrWhiteSpace(existingVal.Confidence) ? "medium" : existingVal.Confidence
                    });
                }
                else
                {
                    // If page does not contain field, set to "Not stated"
                    sanitizedValues.Add(new CriterionValueDto
                    {
                        ItemId = page.Id,
                        Value = "Not stated",
                        Confidence = "low"
                    });
                }
            }

            // Filter winnerItemIds to only valid page IDs
            var validWinners = (criterion.WinnerItemIds ?? new List<string>())
                .Where(id => validPageIds.Contains(id))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            sanitizedCriteria.Add(new ComparisonCriterionDto
            {
                Name = criterion.Name,
                Importance = string.IsNullOrWhiteSpace(criterion.Importance) ? "medium" : criterion.Importance,
                Values = sanitizedValues,
                WinnerItemIds = validWinners
            });
        }
        response.Criteria = sanitizedCriteria;

        // 4. Validate BestOverall
        response.BestOverall ??= new BestOverallDto();
        if (response.BestOverall.ItemId != null && !validPageIds.Contains(response.BestOverall.ItemId))
        {
            // Invalid reference -> reset to null
            response.BestOverall.ItemId = null;
            response.BestOverall.Reason = "Insufficient or inconclusive evidence to select an overall winner.";
        }

        // 5. Validate BestFor
        response.BestFor ??= new List<BestForDto>();
        response.BestFor = response.BestFor
            .Where(bf => !string.IsNullOrWhiteSpace(bf.ItemId) && validPageIds.Contains(bf.ItemId))
            .ToList();

        // 6. Validate KeyDifferences
        response.KeyDifferences ??= new List<string>();

        // 7. Validate MissingInformation
        response.MissingInformation ??= new List<MissingInformationDto>();
        response.MissingInformation = response.MissingInformation
            .Where(m => validPageIds.Contains(m.ItemId))
            .ToList();

        return response;
    }
}
