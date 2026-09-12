using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using CompareAnything.Backend.Configuration;
using CompareAnything.Backend.DTOs;
using CompareAnything.Backend.Models;

namespace CompareAnything.Backend.Services.AI;

public class OpenRouterProvider : IAIProvider
{
    private readonly HttpClient _httpClient;
    private readonly AISettings _settings;
    private readonly ILogger<OpenRouterProvider> _logger;

    public string ProviderName => "OpenRouter";

    public OpenRouterProvider(
        HttpClient httpClient,
        IOptions<AISettings> options,
        ILogger<OpenRouterProvider> logger)
    {
        _httpClient = httpClient;
        _settings = options.Value;
        _logger = logger;
    }

    public async Task<CompareResponse> CompareAsync(CompareRequest request, CancellationToken cancellationToken)
    {
        var apiKey = _settings.OpenRouterApiKey ?? Environment.GetEnvironmentVariable("OPENROUTER_API_KEY");
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogError("OpenRouter API key is missing. Set OPENROUTER_API_KEY environment variable.");
            throw new InvalidOperationException("OpenRouter API key is not configured. Please set the OPENROUTER_API_KEY environment variable.");
        }

        var model = string.IsNullOrWhiteSpace(_settings.Model) ? "openai/gpt-oss-20b" : _settings.Model;
        var endpoint = $"{_settings.OpenRouterBaseUrl.TrimEnd('/')}/chat/completions";

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
            _logger.LogWarning("OpenRouter API request timed out or was cancelled.");
            throw new TimeoutException("Comparison couldn't be generated. Please try again.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Network error contacting OpenRouter API.");
            throw new InvalidOperationException("Comparison couldn't be generated. Please try again.");
        }

        if (response.StatusCode == HttpStatusCode.TooManyRequests)
        {
            _logger.LogWarning("OpenRouter API returned HTTP 429.");
            throw new HttpRequestException("Free AI capacity is temporarily unavailable.", null, HttpStatusCode.TooManyRequests);
        }

        var rawResponse = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("OpenRouter API error HTTP {StatusCode}: {ErrorBody}", response.StatusCode, rawResponse);
            throw new InvalidOperationException("Comparison couldn't be generated. Please try again.");
        }

        ChatCompletionResponse? completion;
        try
        {
            completion = JsonSerializer.Deserialize<ChatCompletionResponse>(rawResponse);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to parse OpenRouter completion envelope JSON.");
            throw new InvalidOperationException("Comparison couldn't be generated. Please try again.");
        }

        var choice = completion?.Choices?.FirstOrDefault();
        var content = choice?.Message?.Content;

        if (string.IsNullOrWhiteSpace(content))
        {
            _logger.LogWarning("OpenRouter returned empty response content.");
            throw new InvalidOperationException("Comparison couldn't be generated. Please try again.");
        }

        return AIResponseValidator.ValidateAndSanitize(content, request);
    }
}
