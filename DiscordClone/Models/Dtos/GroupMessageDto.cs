namespace DiscordClone.Models.Dtos
{
    public class GroupMessageDto
    {
        public Guid MessageId { get; set; }
        public Guid SenderId { get; set; }
        public string SenderName {get; set;}
        public Guid GroupId { get; set; }
        public string Content { get; set; }
        public DateTime SentAt { get; set; }
        public DateTime? ReceivedAt { get; set; }
        public List<ReactionDto> Reactions { get; set; } = new List<ReactionDto>();
    }
}
