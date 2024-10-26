using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace DiscordClone.Models
{
    public class PollOption
    {
        //tabela posrednia
        [Key]
        // Unique identifier for the poll option
        public int PollOptionId { get; set; }

        // Text of the poll option
        public string OptionText { get; set; } = null!;

        // Foreign key referencing the poll to which the option belongs
        [ForeignKey("Poll")]
        public int PollId { get; set; }

        // The poll to which the option belongs
        public Poll Poll { get; set; } = null!;
    }
}
