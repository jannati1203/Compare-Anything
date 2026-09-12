namespace CompareAnything.Backend.Configuration;

public class RateLimitSettings
{
    public const string SectionName = "RateLimit";

    public int ComparisonsPerInstallPerDay { get; set; } = 10;
    public int ComparisonsPerIpPerHour { get; set; } = 30;
    public bool Enabled { get; set; } = true;
}
