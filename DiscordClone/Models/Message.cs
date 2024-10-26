using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Net.Mail;

namespace DiscordClone.Models
{
    public class Message
    {
        [Key]
        // Unique identifier for the message
        public int MessageId { get; set; }

        // Content of the message
        public string Content { get; set; } = null!;

        // Date when the message was created
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Indicates if the message has been edited
        public bool IsEdited { get; set; } = false;

        // Foreign key referencing the user who sent the message
        [ForeignKey("User")]
        public string UserId { get; set; } = null!;

        // The user who sent the message
        public User User { get; set; } = null!;

        // Foreign key referencing the channel where the message was sent
        [ForeignKey("Channel")]
        public int ChannelId { get; set; }

        // The channel where the message was sent
        public Channel Channel { get; set; } = null!;

        // Collection of reactions to the message
        public ICollection<Reaction>? Reactions { get; set; }

        // Collection of attachments (e.g., files, images) linked to the message
        public ICollection<Attachment>? Attachments { get; set; }

        // Collection of edit history records for the message
        public ICollection<MessageEditHistory>? EditHistory { get; set; }
    }
}
