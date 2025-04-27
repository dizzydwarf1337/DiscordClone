namespace DiscordClone.Models.Dtos
{
    public class AttachmentDto
    {
        public Guid AttachmentId { get; set; }
        public string AttachmentUrl { get; set; } = string.Empty;
        public string AttachmentType { get; set; } = string.Empty;
    }
}