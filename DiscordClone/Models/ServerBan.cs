using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace DiscordClone.Models
{
    public class ServerBan
    {
        //tabela posrednia
        [Key]
        // Unique identifier for the server ban
        public int BanId { get; set; }

        // Date when the user was banned
        public DateTime BannedAt { get; set; } = DateTime.UtcNow;

        // Reason for the ban
        public string Reason { get; set; } = null!;

        // Foreign key referencing the server from which the user is banned
        [ForeignKey("Server")]
        public int ServerId { get; set; }

        // The server from which the user is banned
        public Server Server { get; set; } = null!;

        // Foreign key referencing the banned user
        [ForeignKey("User")]
        public string UserId { get; set; } = null!;

        // The user who is banned
        public User User { get; set; } = null!;
    }
}
