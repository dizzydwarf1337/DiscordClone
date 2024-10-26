using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace DiscordClone.Models
{
    public class DirectMessage
    {
        //tabela posrednia
        [Key]
        // Unique identifier for the direct message
        public int DirectMessageId { get; set; }

        // Content of the direct message
        public string Content { get; set; } = null!;

        // Date when the direct message was created
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Indicates if the direct message has been read by the recipient
        public bool IsRead { get; set; } = false;

        // Foreign key referencing the sender of the direct message
        [ForeignKey("Sender")]
        public string SenderId { get; set; } = null!;

        // The user who sent the direct message
        public User Sender { get; set; } = null!;

        // Foreign key referencing the receiver of the direct message
        [ForeignKey("Receiver")]
        public string ReceiverId { get; set; } = null!;

        // The user who received the direct message
        public User Receiver { get; set; } = null!;
    }
}
