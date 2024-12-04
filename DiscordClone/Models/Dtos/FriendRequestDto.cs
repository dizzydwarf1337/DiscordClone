using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace DiscordClone.Models.Dtos
{
    public class FriendRequestDto
    {
        [Required]
        public Guid SenderId { get; set; }
        [Required]
        public Guid ReceiverId { get; set; }
    }
}
