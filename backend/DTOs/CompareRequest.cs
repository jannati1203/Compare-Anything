using System.Text.Json.Serialization;

namespace CompareAnything.Backend.DTOs;

public class CompareRequest
{
    [JsonPropertyName("installId")]
    public string InstallId { get; set; } = string.Empty;

    [JsonPropertyName("goal")]
    public string? Goal { get; set; }

    [JsonPropertyName("pages")]
    public List<PageInputDto> Pages { get; set; } = new();
}

public class PageInputDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("url")]
    public string Url { get; set; } = string.Empty;

    [JsonPropertyName("domain")]
    public string Domain { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("importantText")]
    public string ImportantText { get; set; } = string.Empty;
}
