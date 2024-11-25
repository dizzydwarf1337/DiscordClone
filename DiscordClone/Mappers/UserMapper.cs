using DiscordClone.Models.Dtos;
using DiscordClone.Models;

namespace DiscordClone.Mappers
{
    public static class UserMapper
    {
        public static UserDto MapToDto(User user)
        {
            return new UserDto
            {
                Id = user.Id.ToString(),
                Username = user.UserName,
                Email = user.Email,
                Role = "User",
                AvatarUrl = user.AvatarUrl // Mapowanie pola AvatarUrl
            };
        }
    }
}
