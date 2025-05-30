using DiscordClone.Models.Dtos;
public class VoiceChannelService
{
    private readonly Dictionary<string, List<VoiceUserDto>> _channels = new();

    public void JoinChannel(string channelId, VoiceUserDto user)
    {
        LeaveChannel(user.Id);

        if (!_channels.ContainsKey(channelId))
            _channels[channelId] = new List<VoiceUserDto>();

        _channels[channelId].Add(user);
    }

    public void LeaveChannel(string userId)
    {
        foreach (var channel in _channels)
        {
            var user = channel.Value.FirstOrDefault(u => u.Id == userId);
            if (user != null)
            {
                channel.Value.Remove(user);
                break;
            }
        }
    }

    public List<VoiceUserDto> GetUsersInChannel(string channelId)
    {
        return _channels.TryGetValue(channelId, out var users) ? users : new List<VoiceUserDto>();
    }

    public Dictionary<string, List<VoiceUserDto>> GetAll()
    {
        return _channels;
    }
}
