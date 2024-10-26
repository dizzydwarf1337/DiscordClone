using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace DiscordClone.Models
{
    public class ChannelPermission
    {
        //tabela posrednia
        [Key]
        // Unique identifier for the channel permission
        public int ChannelPermissionId { get; set; }

        // Foreign key referencing the channel
        [ForeignKey("Channel")]
        public int ChannelId { get; set; }

        // The channel to which the permission applies
        public Channel Channel { get; set; } = null!;

        // Foreign key referencing the role (nullable if permission applies to a user)
        [ForeignKey("Role")]
        public int? RoleId { get; set; }

        // The role to which the permission applies
        public Role? Role { get; set; }

        // Foreign key referencing the user (nullable if permission applies to a role)
        [ForeignKey("User")]
        public string? UserId { get; set; }

        // The user to whom the permission applies
        public User? User { get; set; }

        // Permissions associated with the channel (comma-separated list)
        public string Permissions { get; set; } = null!;
    }
}
