namespace DiscordClone.Models.Dtos
{
    public class NotificationDto
    {
        public ICollection<Guid> ReceiversId { get; set;}
        public string Type { get; set; }
        public object Payload { get; set; }
    }
}