using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace DiscordClone.Models
{
    public class UserRole
    {
        //tabela posrednia
        [Key]
        // Unique identifier for the user-role assignment
        public int UserRoleId { get; set; }

        // Foreign key referencing the user
        [ForeignKey("User")]
        public string UserId { get; set; } = null!;

        // The user to whom the role is assigned
        public User User { get; set; } = null!;

        // Foreign key referencing the role
        [ForeignKey("Role")]
        public int RoleId { get; set; }

        // The role assigned to the user
        public Role Role { get; set; } = null!;
    }
}
