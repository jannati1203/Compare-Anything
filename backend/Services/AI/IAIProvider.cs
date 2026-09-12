using CompareAnything.Backend.DTOs;

namespace CompareAnything.Backend.Services.AI;

public interface IAIProvider
{
    string ProviderName { get; }

    Task<CompareResponse> CompareAsync(
        CompareRequest request,
        CancellationToken cancellationToken);
}
