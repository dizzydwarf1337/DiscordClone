using DiscordClone.Db;
using DiscordClone.Hubs;
using DiscordClone.Models;
using DiscordClone.Models.Dtos;
using DiscordClone.Utils;
using Microsoft.EntityFrameworkCore;

namespace DiscordClone.Services.ServerOperations
{
    public interface IServerOperationsService
    {
        Task<Result<ServerDto>> CreateServerAsync(ServerCreateDto serverDto);
        Task<Result<string>> JoinServerAsync(Guid userId, Guid serverId);
        Task<Result<string>> LeaveServerAsync(Guid userId, Guid serverId);
        Task<Result<string>> DeleteServerAsync(Guid userId, Guid serverId);
        Task<Result<string>> BanUserAsync(ServerBanDto serverban);
        Task<Result<string>> RemoveBanAsync(Guid serverId, Guid removerId, Guid bannedUserId);
        Task<Result<ServerDto>> GetServerByIdAsync(Guid serverId);
        Task<Result<ICollection<ServerDto>>> GetServersByUserIdAsync(Guid userId);
    }

    public class ServerOperationsService : IServerOperationsService
    {
        private readonly ApplicationContext _context;
        private readonly IChannelOperationsService _channelOperationService;
        private readonly ChatHub _chatHub;

        public ServerOperationsService(ApplicationContext context, IChannelOperationsService channelOperationService, ChatHub chatHub)
        {
            _context = context;
            _channelOperationService = channelOperationService;
            _chatHub = chatHub;
        }

        public async Task<Result<ServerDto>> CreateServerAsync(ServerCreateDto serverDto)
        {
            var owner = await _context.Users.FindAsync(serverDto.OwnerId);
            if (owner == null)
            {
                return Result<ServerDto>.Failure("Owner not found");
            }

            var server = new Server
            {
                OwnerId = serverDto.OwnerId,
                Name = serverDto.Name,
                Description = serverDto.Description,
                IconUrl = serverDto.IconUrl,
                IsPublic = serverDto.IsPublic
            };

            await _context.Servers.AddAsync(server);
            await _context.SaveChangesAsync();
            var serverMember = new ServerMember
            {
                ServerMemberId = Guid.NewGuid(),
                ServerId = server.ServerId,
                UserId = serverDto.OwnerId,
                JoinedAt = DateTime.UtcNow,
                IsMuted = false
            };
            await _context.ServerMembers.AddAsync(serverMember);
            await _channelOperationService.CreateChannelAsync(new ChannelCreateDto { ServerId = server.ServerId, Name = "Default", ChannelType = "Default" }, owner.Id);

            var serverAdminRole = new Role
            {
                RoleId = Guid.NewGuid(),
                Name = "Admin",
                ServerId = server.ServerId,
                Permissions = "ADMINISTRATOR",
                Color = "Red",
                CreatedAt = DateTime.UtcNow
            };
            var serverUserRole = new Role
            {
                RoleId = Guid.NewGuid(),
                Name = "User",
                ServerId = server.ServerId,
                Permissions = "SEND_MESSAGES",
                Color = "Blue",
            };
            await _context.ServersRoles.AddRangeAsync([serverAdminRole, serverUserRole]);
            await _context.SaveChangesAsync();
            var serverDtoResult = new ServerDto
            {
                ServerId = server.ServerId,
                Name = server.Name,
                Description = server.Description,
                IconUrl = server.IconUrl,
                IsPublic = server.IsPublic
            };
            return Result<ServerDto>.Success(serverDtoResult);
        }

        public async Task<Result<string>> JoinServerAsync(Guid userId, Guid serverId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return Result<string>.Failure("User not found");
            }

            var server = await _context.Servers.FindAsync(serverId);
            if (server == null)
            {
                return Result<string>.Failure("Server not found");
            }

            var ban = await _context.ServerBans
             .FirstOrDefaultAsync(sb => sb.ServerId == serverId && sb.BannedUserId == userId);

            if (ban != null)
            {
                return Result<string>.Failure("User is banned from this server");
            }

            var userServer = await _context.ServerMembers
                .FirstOrDefaultAsync(sm => sm.UserId == userId && sm.ServerId == serverId);

            if (userServer != null)
            {
                return Result<string>.Failure("User is already a member of this server");
            }

            var serverMember = new ServerMember
            {
                ServerId = serverId,
                UserId = userId,
                JoinedAt = DateTime.UtcNow,
                IsMuted = false
            };
            var channels = await _context.Channels.Where(x => x.ServerId == serverId).ToListAsync();
            foreach (var channel in channels)
            {
                await _channelOperationService.JoinChannelAsync($"{server.Name}:{channel.Name}");
                await _context.ServerMembers.AddAsync(serverMember);
            }
            var message = new MessageDto { CreatedAt = DateTime.UtcNow, Content = $"{user.UserName} has connected to the server", MessageId = Guid.NewGuid(), SenderId = user.Id, SenderName = "Server" };
            await _context.Messages.AddAsync(new Message { MessageId = message.MessageId, Content = message.Content, UserId = message.SenderId, ChannelId = server.Channels.FirstOrDefault(x => x.Name == "Default").ChannelId });
            await _chatHub.SendMessage(message, $"{server.Name}:Default");
            await _context.SaveChangesAsync();

            return Result<string>.Success("User successfully joined the server");
        }


        public async Task<Result<string>> LeaveServerAsync(Guid userId, Guid serverId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return Result<string>.Failure("User not found");
            }

            var server = await _context.Servers.FindAsync(serverId);
            if (server == null)
            {
                return Result<string>.Failure("Server not found");
            }

            var userServer = await _context.ServerMembers
                .FirstOrDefaultAsync(sm => sm.UserId == userId && sm.ServerId == serverId);

            if (userServer == null)
            {
                return Result<string>.Failure("User is not a member of this server");
            }

            _context.ServerMembers.Remove(userServer);
            await _context.SaveChangesAsync();

            return Result<string>.Success("User successfully left the server");
        }

        public async Task<Result<string>> DeleteServerAsync(Guid userId, Guid serverId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return Result<string>.Failure("User not found");
            }

            var server = await _context.Servers
                .FirstOrDefaultAsync(s => s.ServerId == serverId);

            if (server == null)
            {
                return Result<string>.Failure("Server not found");
            }

            if (server.OwnerId != userId)
            {
                return Result<string>.Failure("Only the owner can delete the server");
            }

            _context.Servers.Remove(server);
            await _context.SaveChangesAsync();

            return Result<string>.Success("Server successfully deleted");
        }

        public async Task<Result<string>> BanUserAsync(ServerBanDto serverban)
        {
            var server = await _context.Servers
                .FirstOrDefaultAsync(s => s.ServerId == serverban.ServerId);

            if (server == null)
            {
                return Result<string>.Failure("Server not found");
            }

            var banningUser = await _context.Users.FindAsync(serverban.BanningUserId);
            if (banningUser == null)
            {
                return Result<string>.Failure("Banning user not found");
            }

            var bannedUser = await _context.Users.FindAsync(serverban.BannedUserId);
            if (bannedUser == null)
            {
                return Result<string>.Failure("Banned user not found");
            }

            // TODO Dodac autoryzzacje tutaj, sprawdzic czy uzytkownik ma permisje do zbanowania

            var serverBan = new ServerBan
            {
                Reason = serverban.Reason,
                ServerId = serverban.ServerId,
                BanningUserId = serverban.BanningUserId,
                BannedUserId = serverban.BannedUserId
            };

            _context.ServerBans.Add(serverBan);
            await _context.SaveChangesAsync();

            return Result<string>.Success("User banned successfully");
        }

        public async Task<Result<string>> RemoveBanAsync(Guid serverId, Guid removerId, Guid bannedUserId)
        {
            var server = await _context.Servers
                .FirstOrDefaultAsync(s => s.ServerId == serverId);

            if (server == null)
            {
                return Result<string>.Failure("Server not found");
            }

            var serverBan = await _context.ServerBans
                .FirstOrDefaultAsync(sb => sb.ServerId == serverId && sb.BannedUserId == bannedUserId);

            if (serverBan == null)
            {
                return Result<string>.Failure("Ban not found");
            }

            var banningUser = await _context.Users.FindAsync(removerId);
            if (banningUser == null)
            {
                return Result<string>.Failure("Remover user not found");
            }

            // TODO Dodac autoryzzacje tutaj, sprawdzic czy uzytkownik ma permisje do odbanowania

            _context.ServerBans.Remove(serverBan);
            await _context.SaveChangesAsync();

            return Result<string>.Success("Ban removed successfully");
        }
        public async Task<bool> IsUserAdminAsync(Guid serverId, Guid userId)
        {
            var server = await _context.Servers.Include(s => s.Owner)
                .FirstOrDefaultAsync(s => s.ServerId == serverId);
            if (server != null)
            {
                if (server.Owner.Id == userId) return true;
            }
            return false;
        }

        public async Task<Result<ICollection<ServerDto>>> GetServersByUserIdAsync(Guid userId)
        {
            var ServerMember = await _context.ServerMembers.Where(x => x.UserId == userId).ToListAsync();
            var serversDto = new List<ServerDto>();
            foreach (var serverMember in ServerMember)
            {
                var server = await _context.Servers.FindAsync(serverMember.ServerId);
                serversDto.Add(new ServerDto { Description = server.Description, IconUrl = server.IconUrl, IsPublic = server.IsPublic, Name = server.Name, ServerId = server.ServerId });
            }
            return Result<ICollection<ServerDto>>.Success(serversDto);
        }

        public async Task<Result<ServerDto>> GetServerByIdAsync(Guid serverId)
        {
            var server = await _context.Servers.FindAsync(serverId);

            if (server != null)
            {
                var serverDto = new ServerDto
                {
                    ServerId = server.ServerId,
                    Name = server.Name,
                    Description = server.Description,
                    IconUrl = server.IconUrl,
                    IsPublic = server.IsPublic
                };
                return Result<ServerDto>.Success(serverDto);
            }
            else return Result<ServerDto>.Failure("No server found");
        }
    }
}