namespace DiscordClone.Models.Dtos
{
    public class ServerBanDto
    {
        public string Reason;

        public Guid ServerId;

        public Guid BanningUserId;

        public Guid BannedUserId;
    }
}