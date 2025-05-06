namespace DiscordClone.Models.Dtos
{
    public class UnreadGroupMessageCountDto
    {
        public Guid GroupId { get; set; }
        public int Count { get; set; }
    }
}