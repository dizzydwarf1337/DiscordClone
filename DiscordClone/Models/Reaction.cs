﻿using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace DiscordClone.Models
{
    public class Reaction
    {
        [Key]
        // Unique identifier for the reaction
        public int ReactionId { get; set; }

        // Type of the reaction (e.g., 👍, ❤️)
        public string ReactionType { get; set; } = null!;

        // Date when the reaction was created
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Foreign key referencing the message to which the reaction was added
        [ForeignKey("Message")]
        public int MessageId { get; set; }

        // The message to which the reaction was added
        public Message Message { get; set; } = null!;

        // Foreign key referencing the user who added the reaction
        [ForeignKey("User")]
        public string UserId { get; set; } = null!;

        // The user who added the reaction
        public User User { get; set; } = null!;
    }
}