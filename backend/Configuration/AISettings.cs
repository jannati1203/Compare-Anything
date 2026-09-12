namespace CompareAnything.Backend.Configuration;

public class AISettings
{
    public const string SectionName = "AI";

    public string Provider { get; set; } = "Groq"; // "Groq" or "OpenRouter"
    public string Model { get; set; } = "openai/gpt-oss-20b";
    public string? GroqApiKey { get; set; }
    public string GroqBaseUrl { get; set; } = "https://api.groq.com/openai/v1";
    public string? OpenRouterApiKey { get; set; }
    public string OpenRouterBaseUrl { get; set; } = "https://openrouter.ai/api/v1";
    public int TimeoutSeconds { get; set; } = 45;
    public int MaxRetries { get; set; } = 2;
    public int MaxTokens { get; set; } = 8192;
}
