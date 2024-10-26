using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace DiscordClone.Models
{
    public class PollVote
    {
        //tabela posrednia
        [Key]
        // Unique identifier for the poll vote
        public int PollVoteId { get; set; }

        // Foreign key referencing the poll in which the vote was cast
        [ForeignKey("Poll")]
        public int PollId { get; set; }

        // The poll in which the vote was cast
        public Poll Poll { get; set; } = null!;

        // Foreign key referencing the user who cast the vote
        [ForeignKey("User")]
        public string UserId { get; set; } = null!;

        // The user who cast the vote
        public User User { get; set; } = null!;

        // Foreign key referencing the poll option for which the vote was cast
        [ForeignKey("PollOption")]
        public int PollOptionId { get; set; }

        // The poll option for which the vote was cast
        public PollOption PollOption { get; set; } = null!;
    }
}
