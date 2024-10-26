using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace DiscordClone.Models
{
    public class Channel
    {
        [Key]
        // Unique identifier for the channel
        public int ChannelId { get; set; }

        // Name of the channel
        public string Name { get; set; } = null!;

        // Type of the channel (e.g., "text" or "voice")
        public string ChannelType { get; set; } = "text";

        // Date when the channel was created
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Topic or description of the channel
        public string? Topic { get; set; }

        // Foreign key referencing the server to which the channel belongs
        [ForeignKey("Server")]
        public int ServerId { get; set; }

        // The server to which the channel belongs
        public Server Server { get; set; } = null!;

        // Collection of messages sent in the channel
        public ICollection<Message>? Messages { get; set; }

        // Collection of permissions for roles or users within the channel
        public ICollection<ChannelPermission>? ChannelPermissions { get; set; }

        // Collection of voice sessions related to the channel
        public ICollection<VoiceSession>? VoiceSessions { get; set; }

        // Collection of polls conducted in the channel
        public ICollection<Poll>? Polls { get; set; }
    }
}
