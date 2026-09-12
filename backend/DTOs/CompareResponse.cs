using System.Text.Json.Serialization;

namespace CompareAnything.Backend.DTOs;

public class CompareResponse
{
    [JsonPropertyName("comparisonTitle")]
    public string ComparisonTitle { get; set; } = string.Empty;

    [JsonPropertyName("comparisonType")]
    public string ComparisonType { get; set; } = string.Empty;

    [JsonPropertyName("goal")]
    public string Goal { get; set; } = string.Empty;

    [JsonPropertyName("items")]
    public List<ComparisonItemDto> Items { get; set; } = new();

    [JsonPropertyName("criteria")]
    public List<ComparisonCriterionDto> Criteria { get; set; } = new();

    [JsonPropertyName("bestOverall")]
    public BestOverallDto BestOverall { get; set; } = new();

    [JsonPropertyName("bestFor")]
    public List<BestForDto> BestFor { get; set; } = new();

    [JsonPropertyName("keyDifferences")]
    public List<string> KeyDifferences { get; set; } = new();

    [JsonPropertyName("missingInformation")]
    public List<MissingInformationDto> MissingInformation { get; set; } = new();
}

public class ComparisonItemDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("displayName")]
    public string DisplayName { get; set; } = string.Empty;

    [JsonPropertyName("shortDescription")]
    public string ShortDescription { get; set; } = string.Empty;
}

public class ComparisonCriterionDto
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("importance")]
    public string Importance { get; set; } = "medium"; // "high", "medium", "low"

    [JsonPropertyName("values")]
    public List<CriterionValueDto> Values { get; set; } = new();

    [JsonPropertyName("winnerItemIds")]
    public List<string> WinnerItemIds { get; set; } = new();
}

public class CriterionValueDto
{
    [JsonPropertyName("itemId")]
    public string ItemId { get; set; } = string.Empty;

    [JsonPropertyName("value")]
    public string Value { get; set; } = string.Empty;

    [JsonPropertyName("confidence")]
    public string Confidence { get; set; } = "high"; // "high", "medium", "low"
}

public class BestOverallDto
{
    [JsonPropertyName("itemId")]
    public string? ItemId { get; set; } // MUST allow null

    [JsonPropertyName("reason")]
    public string Reason { get; set; } = string.Empty;
}

public class BestForDto
{
    [JsonPropertyName("label")]
    public string Label { get; set; } = string.Empty;

    [JsonPropertyName("itemId")]
    public string ItemId { get; set; } = string.Empty;

    [JsonPropertyName("reason")]
    public string Reason { get; set; } = string.Empty;
}

public class MissingInformationDto
{
    [JsonPropertyName("itemId")]
    public string ItemId { get; set; } = string.Empty;

    [JsonPropertyName("fields")]
    public List<string> Fields { get; set; } = new();
}
