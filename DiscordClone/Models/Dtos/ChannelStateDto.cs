using DiscordClone.Models.Dtos;

public class ChannelStateDto
{
    public string ChannelId { get; set; }
    public List<VoiceUserDto> Users { get; set; }
}