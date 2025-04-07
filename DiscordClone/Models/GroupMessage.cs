using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DiscordClone.Models
{
    public class GroupMessage
    {
        [Key]
        public Guid MessageId { get; set; }
        public Guid SenderId { get; set; }
        public Guid GroupId { get; set; }
        public string Content { get; set; } = null!;
        public DateTime SentAt { get; set; }
        public DateTime ReceivedAt { get; set; }
        [ForeignKey("SenderId")]
        public virtual User Sender { get; set; } = null!;
        [ForeignKey("GroupId")]
        public virtual FriendGroup Group { get; set; } = null!;

        public ICollection<Reaction>? Reactions { get; set; }
    }
}
