using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DiscordClone.Models;

public class FriendGroup
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid CreatorId { get; set; }

    [ForeignKey(nameof(CreatorId))]
    public User Creator { get; set; }

    public ICollection<User> Members { get; set; } = new List<User>();
}
