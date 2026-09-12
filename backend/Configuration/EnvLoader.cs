namespace CompareAnything.Backend.Configuration;

public static class EnvLoader
{
    public static void Load()
    {
        var searchDirs = new List<string>
        {
            Directory.GetCurrentDirectory(),
            AppContext.BaseDirectory
        };

        var current = new DirectoryInfo(Directory.GetCurrentDirectory());
        while (current != null)
        {
            searchDirs.Add(current.FullName);
            current = current.Parent;
        }

        foreach (var dir in searchDirs.Distinct())
        {
            var envPath = Path.Combine(dir, ".env");
            if (File.Exists(envPath))
            {
                try
                {
                    foreach (var line in File.ReadAllLines(envPath))
                    {
                        var trimmed = line.Trim();
                        if (string.IsNullOrWhiteSpace(trimmed) || trimmed.StartsWith("#"))
                            continue;

                        var equalIndex = trimmed.IndexOf('=');
                        if (equalIndex > 0)
                        {
                            var key = trimmed.Substring(0, equalIndex).Trim();
                            var value = trimmed.Substring(equalIndex + 1).Trim();

                            // Strip surrounding single or double quotes
                            if ((value.StartsWith("\"") && value.EndsWith("\"")) ||
                                (value.StartsWith("'") && value.EndsWith("'")))
                            {
                                if (value.Length >= 2)
                                    value = value.Substring(1, value.Length - 2);
                            }

                            if (!string.IsNullOrWhiteSpace(key))
                            {
                                Environment.SetEnvironmentVariable(key, value);
                                // Also map double underscore to colon for ASP.NET Core IConfiguration
                                if (key.Contains("__"))
                                {
                                    Environment.SetEnvironmentVariable(key.Replace("__", ":"), value);
                                }
                            }
                        }
                    }
                }
                catch
                {
                    // Silently continue if cannot read
                }
            }
        }
    }
}
