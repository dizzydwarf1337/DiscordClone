namespace DiscordClone.Models.Dtos
{
    public class GroupMessageDto
    {
        public Guid MessageId { get; set; }
        public Guid SenderId { get; set; }
        public Guid GroupId { get; set; }
        public string Content { get; set; }
        public DateTime SentAt { get; set; }
        public DateTime? ReceivedAt { get; set; }
    }
}
