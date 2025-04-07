using DiscordClone.Models.Dtos;

public class FriendGroupDto
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public Guid CreatorId { get; set; }
    public ICollection<UserDto> Members { get; set; } 
}