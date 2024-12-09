public class ChannelCreateDto
{
    public string Name { get; set; }
    public string? ChannelType { get; set; }
    public Guid ServerId { get; set; }
    public string? Topic { get; set; }
}