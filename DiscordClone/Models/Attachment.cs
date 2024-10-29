using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace DiscordClone.Models
{
    public class Attachment
    {
        [Key]
        // Unique identifier for the attachment
        public Guid AttachmentId { get; set; }

        // URL to the attachment (e.g., image, document)
        [Url(ErrorMessage = "Please enter a valid URL.")]
        public string AttachmentUrl { get; set; } = null!;

        // Type of the attachment (e.g., "image", "document")
        [StringLength(50, ErrorMessage = "Attachment type cannot exceed 50 characters.")]
        public string AttachmentType { get; set; } = null!;

        // Foreign key referencing the message to which the attachment belongs
        [ForeignKey("Message")]
        public Guid MessageId { get; set; }

        // The message to which the attachment belongs
        public Message Message { get; set; } = null!;
    }
}
