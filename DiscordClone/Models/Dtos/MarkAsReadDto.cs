namespace DiscordClone.Models.Dtos
{
    public class MarkAsReadDto
    {
        public Guid UserId { get; set; }
        public Guid GroupId { get; set; }
        public Guid FriendId { get; set; }
    }
}