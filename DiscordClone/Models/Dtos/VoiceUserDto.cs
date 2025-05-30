namespace DiscordClone.Models.Dtos
{
    public class VoiceUserDto
    {
        public string Id { get; set; } = null!;
        public string Username { get; set; } = null!;
        public string? Image { get; set; } = null!;
        public bool IsMuted { get; set; }
        public bool IsDeafened { get; set; }
        public bool IsSpeaking { get; set; }
    }
}