public class ServerCreateDto
{
    public string Name { get; set; }
    public string? Description { get; set; }
    public string? IconUrl { get; set; }
    public bool IsPublic { get; set; }
    public Guid OwnerId { get; set; }  // To jest wymagane
}
