namespace DiscordClone.Models.Dtos
{
    public class UnreadPrivateMessageCountDto
    {
        public Guid FriendId { get; set; }
        public int Count { get; set; }
    }
}