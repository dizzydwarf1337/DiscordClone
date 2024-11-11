using System.ComponentModel.DataAnnotations;

namespace DiscordClone.Models.Dtos
{
    public class UpdateUserDto
    {
        public string? Username { get; set; }

        [EmailAddress]
        public string? Email { get; set; }
    }
}