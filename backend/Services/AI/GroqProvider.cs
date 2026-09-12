using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using CompareAnything.Backend.Configuration;
using CompareAnything.Backend.DTOs;
using CompareAnything.Backend.Models;

namespace CompareAnything.Backend.Services.AI;

public class GroqProvider : IAIProvider
{
    private readonly HttpClient _httpClient;
    private readonly AISettings _settings;
    private readonly ILogger<GroqProvider> _logger;

    public string ProviderName => "Groq";

    public GroqProvider(
        HttpClient httpClient,
        IOptions<AISettings> options,
        ILogger<GroqProvider> logger)
    {
        _httpClient = httpClient;
        _settings = options.Value;
        _logger = logger;
    }

    public async Task<CompareResponse> CompareAsync(CompareRequest request, CancellationToken cancellationToken)
    {
        var apiKey = _settings.GroqApiKey 
            ?? Environment.GetEnvironmentVariable("GROQ_API_KEY")
            ?? Environment.GetEnvironmentVariable("GroqApiKey")
            ?? Environment.GetEnvironmentVariable("AI__GroqApiKey")
            ?? Environment.GetEnvironmentVariable("AI:GroqApiKey");
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogError("Groq API key is missing. Set GROQ_API_KEY environment variable.");
            throw new InvalidOperationException("Groq API key is not configured. Please set the GROQ_API_KEY environment variable.");
        }

        var model = string.IsNullOrWhiteSpace(_settings.Model) ? "openai/gpt-oss-20b" : _settings.Model;
        var endpoint = $"{_settings.GroqBaseUrl.TrimEnd('/')}/chat/completions";

        var chatRequest = new ChatCompletionRequest
        {
            Model = model,
            Temperature = 0.1,
            MaxTokens = _settings.MaxTokens > 0 ? _settings.MaxTokens : 8192,
            ResponseFormat = new ResponseFormat { Type = "json_object" },
            Messages = new List<ChatMessage>
            {
                new() { Role = "system", Content = PromptBuilder.SystemPrompt },
                new() { Role = "user", Content = PromptBuilder.BuildUserPrompt(request) }
            }
        };

        var requestJson = JsonSerializer.Serialize(chatRequest);
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, endpoint);
        httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        httpRequest.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        httpRequest.Content = new StringContent(requestJson, Encoding.UTF8, "application/json");

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.SendAsync(httpRequest, cancellationToken);
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Groq API request timed out or was cancelled.");
            throw new TimeoutException("Comparison couldn't be generated. Please try again.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Network error contacting Groq API.");
            throw new InvalidOperationException("Comparison couldn't be generated. Please try again.");
        }

        if (response.StatusCode == HttpStatusCode.TooManyRequests)
        {
            _logger.LogWarning("Groq API returned HTTP 429 (Rate limited).");
            throw new HttpRequestException("Free AI capacity is temporarily unavailable.", null, HttpStatusCode.TooManyRequests);
        }

        var rawResponse = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Groq API error HTTP {StatusCode}: {ErrorBody}", response.StatusCode, rawResponse);
            throw new InvalidOperationException("Comparison couldn't be generated. Please try again.");
        }

        ChatCompletionResponse? completion;
        try
        {
            completion = JsonSerializer.Deserialize<ChatCompletionResponse>(rawResponse);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to parse Groq completion envelope JSON.");
            throw new InvalidOperationException("Comparison couldn't be generated. Please try again.");
        }

        var choice = completion?.Choices?.FirstOrDefault();
        var content = choice?.Message?.Content;

        if (string.IsNullOrWhiteSpace(content))
        {
            _logger.LogWarning("Groq returned empty response content.");
            throw new InvalidOperationException("Comparison couldn't be generated. Please try again.");
        }

        // Log token usage without exposing sensitive content
        if (completion?.Usage != null)
        {
            _logger.LogInformation(
                "Groq completion successful. Prompt tokens: {PromptTokens}, Completion tokens: {CompletionTokens}, FinishReason: {FinishReason}",
                completion.Usage.PromptTokens,
                completion.Usage.CompletionTokens,
                choice?.FinishReason ?? "unknown"
            );
        }

        // Validate and sanitize AI JSON
        return AIResponseValidator.ValidateAndSanitize(content, request);
    }
}
