
using DiscordClone.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace DiscordClone.Db
{
    public class ApplicationContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>
    {
        public ApplicationContext(DbContextOptions options) : base(options) { }
        public DbSet<User> appUsers { get; set; }
        public DbSet<Server> Servers { get; set; }
        public DbSet<Channel> Channels { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Reaction> Reactions { get; set; }
        public DbSet<ServerMember> ServerMembers { get; set; }
        public DbSet<UserActivityLog> UserActivityLogs { get; set; }
        public DbSet<VoiceSession> VoiceSessions { get; set; }
        public DbSet<ChannelPermission> ChannelPermissions { get; set; }
        public DbSet<Poll> Polls { get; set; }
        public DbSet<Role> ServersRoles { get; set; }
        public DbSet<Invite> Invites { get; set; }
        public DbSet<ServerBan> ServerBans { get; set; }
        public DbSet<DirectMessage> DirectMessages { get; set; }
        public DbSet<UserRole> UserServerRole { get; set; }
        public DbSet<PollOption> PollOptions { get; set; }
        public DbSet<PollVote> PollVotes { get; set; }
        public DbSet<MessageEditHistory> messageEditHistories { get; set; }
        public DbSet<Attachment> Attachments { get; set; }

        public DbSet<PinnedMessage> PinnedMessages { get; set; }
        public DbSet<Friendship> Friendships { get; set; }
        public DbSet<PrivateMessage> PrivateMessages { get; set; }

        public DbSet<GroupMessage> GroupMessages {get; set;}
        public DbSet<FriendGroup> FriendGroups { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Server>()
                .HasOne(s => s.Owner)
                .WithMany()
                .HasForeignKey(s => s.OwnerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DirectMessage>()
                .HasOne(dm => dm.Sender)
                .WithMany(u => u.SentDirectMessages)
                .HasForeignKey(dm => dm.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<DirectMessage>()
                .HasOne(dm => dm.Receiver)
                .WithMany(u => u.ReceivedDirectMessages)
                .HasForeignKey(dm => dm.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<User>()
            .HasMany(u => u.SentFriendRequests)
            .WithOne(f => f.Sender)
            .HasForeignKey(f => f.SenderId)
            .OnDelete(DeleteBehavior.Restrict);

            // Add this configuration to your OnModelCreating method
            modelBuilder.Entity<ServerBan>()
                .HasOne(sb => sb.BannedUser)
                .WithMany() // Or WithMany(u => u.ServerBans) if you have this navigation property
                .HasForeignKey(sb => sb.BannedUserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<ServerBan>()
                .HasOne(sb => sb.BanningUser)
                .WithMany() // Or WithMany(u => u.IssuedBans) if you have this navigation property
                .HasForeignKey(sb => sb.BanningUserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<ServerBan>()
                .HasOne(sb => sb.Server)
                .WithMany(s => s.Bans) // Assuming Server has a Bans collection
                .HasForeignKey(sb => sb.ServerId)
                .OnDelete(DeleteBehavior.Cascade); // Or NoAction depending on your needs

            // Add this configuration to your OnModelCreating method
            modelBuilder.Entity<ServerMember>()
                .HasOne(sm => sm.Server)
                .WithMany(s => s.ServerMembers) // Assuming Server has a Members collection
                .HasForeignKey(sm => sm.ServerId)
                .OnDelete(DeleteBehavior.NoAction); // Changed from default Cascade

            modelBuilder.Entity<Message>()
    .HasOne(m => m.Channel)
    .WithMany(c => c.Messages)
    .HasForeignKey(m => m.ChannelId)
    .OnDelete(DeleteBehavior.Restrict); // or DeleteBehavior.NoAction

            modelBuilder.Entity<VoiceSession>()
    .HasOne(vs => vs.Channel)
    .WithMany(c => c.VoiceSessions)
    .HasForeignKey(vs => vs.ChannelId)
    .OnDelete(DeleteBehavior.Restrict); // prevents cascade path conflict

            modelBuilder.Entity<Reaction>()
                            .HasOne(r => r.Message)
                            .WithMany(m => m.Reactions)
                            .HasForeignKey(r => r.MessageId)
                            .OnDelete(DeleteBehavior.Cascade); // Or NoAction depending on your needs

            modelBuilder.Entity<UserRole>()
    .HasOne(usr => usr.Role)
    .WithMany(r => r.UserRoles)
    .HasForeignKey(usr => usr.RoleId)
    .OnDelete(DeleteBehavior.Restrict); // or DeleteBehavior.NoAction

            modelBuilder.Entity<UserRole>()
                .HasOne(ur => ur.Role)
                .WithMany(r => r.UserRoles) // Assuming Role has UserRoles collection
                .HasForeignKey(ur => ur.RoleId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<UserRole>(entity =>
            {

                // Configure the Role relationship
                entity.HasOne(ur => ur.Role)
                      .WithMany(r => r.UserRoles)
                      .HasForeignKey(ur => ur.RoleId)
                      .OnDelete(DeleteBehavior.NoAction);

                // Optional: Composite key configuration if needed
                entity.HasIndex(ur => new { ur.UserId, ur.RoleId, ur.ServerId })
                      .IsUnique();
            });
            modelBuilder.Entity<UserRole>()
    .HasOne(ur => ur.Server)
    .WithMany()
    .OnDelete(DeleteBehavior.Restrict); // or DeleteBehavior.NoAction

            modelBuilder.Entity<UserRole>()
                .HasOne(ur => ur.Role)
                .WithMany(r => r.UserRoles)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserRole>()
                .HasOne(ur => ur.User)
                .WithMany()
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<User>()
                .HasMany(u => u.ReceivedFriendRequests)
                .WithOne(f => f.Receiver)
                .HasForeignKey(f => f.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<GroupMessage>()
                .HasOne(gm => gm.Group)
                .WithMany() // Assuming no navigation property from Group to GroupMessages
                .HasForeignKey(gm => gm.GroupId)
                .OnDelete(DeleteBehavior.NoAction);  // Disable cascade delete

            modelBuilder.Entity<UserRole>()
    .HasOne(ur => ur.Role)
    .WithMany(r => r.UserRoles)
    .HasForeignKey(ur => ur.RoleId)
    .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<PinnedMessage>()
    .HasOne(pm => pm.Channel)
    .WithMany()
    .HasForeignKey(pm => pm.ChannelId)
    .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<UserRole>()
                .HasOne(ur => ur.Server)
                .WithMany()
                .HasForeignKey(ur => ur.ServerId)
                .OnDelete(DeleteBehavior.NoAction);
            modelBuilder.Entity<GroupMessage>()
                .HasMany(gm => gm.ReadBy)
                .WithMany()
                .UsingEntity<Dictionary<string, object>>(
                    "GroupMessageReadBy",
                    j => j.HasOne<User>()
                          .WithMany()
                          .HasForeignKey("UserId")
                          .OnDelete(DeleteBehavior.NoAction),  // Prevent cascading delete on UserId
                    j => j.HasOne<GroupMessage>()
                          .WithMany()
                          .HasForeignKey("GroupMessageId")
                          .OnDelete(DeleteBehavior.NoAction)   // Prevent cascading delete on GroupMessageId
                );

            // Add this to your OnModelCreating method
            modelBuilder.Entity<Invite>()
                .HasOne(i => i.Server)
                .WithMany(s => s.Invites) // Assuming Server has a collection of Invites
                .HasForeignKey(i => i.ServerId)
                .OnDelete(DeleteBehavior.NoAction); // Or Restrict


            modelBuilder.Entity<FriendGroup>()
                .HasOne(fg => fg.Creator)
                .WithMany() // Assuming no navigation property from User to FriendGroups
                .HasForeignKey(fg => fg.CreatorId)
                .OnDelete(DeleteBehavior.NoAction);  // Disable cascade delete

            modelBuilder.Entity<PrivateMessage>()
    .HasOne(pm => pm.Sender)
    .WithMany() // Assuming no navigation property in User to PrivateMessages
    .HasForeignKey(pm => pm.SenderId)
    .OnDelete(DeleteBehavior.NoAction); // Prevent cascade delete

            modelBuilder.Entity<FriendGroup>()
    .HasMany(fg => fg.Members)
    .WithMany(u => u.FriendGroups)
    .UsingEntity<Dictionary<string, object>>(
        "FriendGroupUser",
        j => j.HasOne<User>().WithMany().HasForeignKey("UserId"),
        j => j.HasOne<FriendGroup>().WithMany().HasForeignKey("FriendGroupId")
    );
            // Configure PinnedMessages relationships
            modelBuilder.Entity<PinnedMessage>(entity =>
            {
                // Message relationship
                entity.HasOne(pm => pm.Message)
                    .WithMany() // Assuming Message doesn't have a PinnedMessages navigation property
                    .HasForeignKey(pm => pm.MessageId)
                    .OnDelete(DeleteBehavior.NoAction);

                // Optional: Add unique constraint
                entity.HasIndex(pm => new { pm.MessageId, pm.ChannelId })
                    .IsUnique();
            });

            modelBuilder.Entity<PollVote>(entity =>
            {

                // User relationship
                entity.HasOne(pv => pv.User)
                    .WithMany()
                    .HasForeignKey(pv => pv.UserId)
                    .OnDelete(DeleteBehavior.NoAction);

                // Composite unique constraint (user can only vote once per poll)
                entity.HasIndex(pv => new { pv.PollId, pv.UserId })
                    .IsUnique();
            });

            // Configure PollOption relationships
            modelBuilder.Entity<PollOption>(entity =>
            {
                entity.HasOne(po => po.Poll)
                    .WithMany(p => p.Options)
                    .HasForeignKey(po => po.PollId)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            modelBuilder.Entity<Reaction>(entity =>
            {
                // Message relationship
                entity.HasOne(r => r.Message)
                    .WithMany(m => m.Reactions)
                    .HasForeignKey(r => r.MessageId)
                    .OnDelete(DeleteBehavior.ClientCascade); // Or DeleteBehavior.NoAction

                // User relationship
                entity.HasOne(r => r.User)
                    .WithMany()
                    .HasForeignKey(r => r.UserId)
                    .OnDelete(DeleteBehavior.NoAction);
            });


            modelBuilder.Entity<GroupMessage>()
    .HasOne(gm => gm.Group)
    .WithMany()
    .HasForeignKey(gm => gm.GroupId)
    .OnDelete(DeleteBehavior.Cascade); // This sets up cascading delete
        }
    }

}
