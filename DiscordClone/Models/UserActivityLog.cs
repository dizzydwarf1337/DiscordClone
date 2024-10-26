using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace DiscordClone.Models
{
    public class UserActivityLog
    {
        [Key]
        // Unique identifier for the user activity log
        public int ActivityLogId { get; set; }

        // Type of activity (e.g., "Joined Server", "Sent Message")
        public string ActivityType { get; set; } = null!;

        // Timestamp of when the activity occurred
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        // Foreign key referencing the user who performed the activity
        [ForeignKey("User")]
        public string UserId { get; set; } = null!;

        // The user who performed the activity
        public User User { get; set; } = null!;
    }
}
