using Xunit;
using CompareAnything.Backend.DTOs;
using CompareAnything.Backend.Services.AI;

namespace CompareAnything.Backend.Tests;

public class AIResponseValidatorTests
{
    private static CompareRequest CreateSampleRequest() => new()
    {
        InstallId = "install-123",
        Goal = "Best battery life",
        Pages = new List<PageInputDto>
        {
            new() { Id = "p1", Title = "Phone A", Url = "https://example.com/a", Domain = "example.com" },
            new() { Id = "p2", Title = "Phone B", Url = "https://example.com/b", Domain = "example.com" }
        }
    };

    [Fact]
    public void ValidateAndSanitize_ValidJson_ParsesCorrectly()
    {
        var request = CreateSampleRequest();
        var json = @"{
          ""comparisonTitle"": ""Phone A vs Phone B"",
          ""comparisonType"": ""Product"",
          ""items"": [
            { ""id"": ""p1"", ""displayName"": ""Phone A"", ""shortDescription"": ""Flagship phone"" },
            { ""id"": ""p2"", ""displayName"": ""Phone B"", ""shortDescription"": ""Budget phone"" }
          ],
          ""criteria"": [
            {
              ""name"": ""Battery"",
              ""importance"": ""high"",
              ""values"": [
                { ""itemId"": ""p1"", ""value"": ""5000 mAh"", ""confidence"": ""high"" },
                { ""itemId"": ""p2"", ""value"": ""4000 mAh"", ""confidence"": ""high"" }
              ],
              ""winnerItemIds"": [""p1""]
            }
          ],
          ""bestOverall"": {
            ""itemId"": ""p1"",
            ""reason"": ""Superior battery life and display.""
          }
        }";

        var response = AIResponseValidator.ValidateAndSanitize(json, request);

        Assert.Equal("Phone A vs Phone B", response.ComparisonTitle);
        Assert.Equal(2, response.Items.Count);
        Assert.Single(response.Criteria);
        Assert.Equal("p1", response.BestOverall.ItemId);
        Assert.Equal("p1", response.Criteria[0].WinnerItemIds[0]);
    }

    [Fact]
    public void ValidateAndSanitize_NoWinner_AllowsNullItemId()
    {
        var request = CreateSampleRequest();
        var json = @"{
          ""comparisonTitle"": ""Phone A vs Phone B"",
          ""bestOverall"": {
            ""itemId"": null,
            ""reason"": ""Insufficient evidence to determine a winner.""
          }
        }";

        var response = AIResponseValidator.ValidateAndSanitize(json, request);

        Assert.Null(response.BestOverall.ItemId);
        Assert.Contains("Insufficient evidence", response.BestOverall.Reason);
    }

    [Fact]
    public void ValidateAndSanitize_InvalidItemId_SanitizesToNull()
    {
        var request = CreateSampleRequest();
        var json = @"{
          ""comparisonTitle"": ""Phone A vs Phone B"",
          ""bestOverall"": {
            ""itemId"": ""non-existent-id"",
            ""reason"": ""Winner reason""
          }
        }";

        var response = AIResponseValidator.ValidateAndSanitize(json, request);

        // Invalid item ID must be stripped / replaced with null
        Assert.Null(response.BestOverall.ItemId);
    }

    [Fact]
    public void ValidateAndSanitize_MissingFieldOnPage_YieldsNotStated()
    {
        var request = CreateSampleRequest();
        var json = @"{
          ""comparisonTitle"": ""Comparison"",
          ""criteria"": [
            {
              ""name"": ""Water Resistance"",
              ""values"": [
                { ""itemId"": ""p1"", ""value"": ""IP68"" }
              ]
            }
          ]
        }";

        var response = AIResponseValidator.ValidateAndSanitize(json, request);

        var crit = Assert.Single(response.Criteria);
        var p2Val = crit.Values.FirstOrDefault(v => v.ItemId == "p2");
        Assert.NotNull(p2Val);
        Assert.Equal("Not stated", p2Val.Value);
    }

    [Fact]
    public void ValidateAndSanitize_MalformedJson_ThrowsFriendlyError()
    {
        var request = CreateSampleRequest();
        var malformed = "{ this is not valid json ]";

        var ex = Assert.Throws<InvalidOperationException>(() =>
            AIResponseValidator.ValidateAndSanitize(malformed, request)
        );

        Assert.Equal("Comparison couldn't be generated. Please try again.", ex.Message);
    }

    [Fact]
    public void ValidateAndSanitize_MarkdownCodeFences_StripsAndParses()
    {
        var request = CreateSampleRequest();
        var markdownWrapped = @"```json
        {
          ""comparisonTitle"": ""Cleaned JSON"",
          ""items"": []
        }
        ```";

        var response = AIResponseValidator.ValidateAndSanitize(markdownWrapped, request);
        Assert.Equal("Cleaned JSON", response.ComparisonTitle);
    }
}
