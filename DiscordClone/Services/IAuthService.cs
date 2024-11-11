using DiscordClone.Models;

namespace DiscordClone.Services
{
    public interface IAuthService
    {
        Task<string> GenerateJwtTokenAsync(User user);
    }
}