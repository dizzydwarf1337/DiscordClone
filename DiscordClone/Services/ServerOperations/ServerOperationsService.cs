using DiscordClone.Db;
using DiscordClone.Hubs;
using DiscordClone.Models;
using DiscordClone.Models.Dtos;
using DiscordClone.Utils;
using Microsoft.AspNetCore.SignalR;
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
        Task<Result<ICollection<UserDto>>> GetServerMembersAsync(Guid serverId);
        Task<bool> IsUserAdminAsync(Guid serverId, Guid userId);
    }

    public class ServerOperationsService : IServerOperationsService
    {
        private readonly ApplicationContext _context;
        private readonly IChannelOperationsService _channelOperationService;
        private readonly IHubContext<ChatHub> _hubContext;

        public ServerOperationsService(ApplicationContext context,
                                     IChannelOperationsService channelOperationService,
                                     IHubContext<ChatHub> hubContext)
        {
            _context = context;
            _channelOperationService = channelOperationService;
            _hubContext = hubContext;
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

            await _channelOperationService.CreateChannelAsync(new ChannelCreateDto { ServerId = server.ServerId, Name = "Default", ChannelType = "text" }, owner.Id);


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
                CreatedAt = DateTime.UtcNow
            };
            await _context.ServersRoles.AddRangeAsync(serverAdminRole, serverUserRole);

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

            var server = await _context.Servers.Include(s => s.Channels).FirstOrDefaultAsync(s => s.ServerId == serverId);
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
            await _context.ServerMembers.AddAsync(serverMember);

            var defaultChannel = server.Channels.FirstOrDefault(c => c.Name == "Default" && c.ChannelType == "text");
            if (defaultChannel != null)
            {
                var messageDto = new MessageDto
                {
                    MessageId = Guid.NewGuid(),
                    ChannelId = defaultChannel.ChannelId,
                    Content = $"{user.UserName} has joined the server!",
                    SenderId = userId,
                    SenderName = "System",
                    CreatedAt = DateTime.UtcNow
                };

                var messageEntity = new Message
                {
                    MessageId = messageDto.MessageId,
                    Content = messageDto.Content,
                    UserId = messageDto.SenderId,
                    ChannelId = defaultChannel.ChannelId,
                    CreatedAt = messageDto.CreatedAt
                };
                await _context.Messages.AddAsync(messageEntity);

                await _hubContext.Clients.Group(defaultChannel.ChannelId.ToString())
                    .SendAsync("ReceiveMessage", messageDto);
            }

            await _context.SaveChangesAsync();

            return Result<string>.Success("User successfully joined the server");
        }

        public async Task<Result<string>> LeaveServerAsync(Guid userId, Guid serverId)
        {
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
            var server = await _context.Servers.FindAsync(serverId);
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
            var server = await _context.Servers.FindAsync(serverban.ServerId);
            if (server == null) return Result<string>.Failure("Server not found");

            if (!await _context.Users.AnyAsync(u => u.Id == serverban.BanningUserId))
                return Result<string>.Failure("Banning user not found");

            if (!await _context.Users.AnyAsync(u => u.Id == serverban.BannedUserId))
                return Result<string>.Failure("Banned user not found");

            // TODO: Authorization: Check if BanningUserId has permission to ban on this server

            var existingBan = await _context.ServerBans
                .FirstOrDefaultAsync(sb => sb.ServerId == serverban.ServerId && sb.BannedUserId == serverban.BannedUserId);
            if (existingBan != null) return Result<string>.Failure("User is already banned");

            var serverBan = new ServerBan
            {
                Reason = serverban.Reason,
                ServerId = serverban.ServerId,
                BanningUserId = serverban.BanningUserId,
                BannedUserId = serverban.BannedUserId,
                BannedAt = DateTime.UtcNow
            };

            _context.ServerBans.Add(serverBan);

            var memberToRemove = await _context.ServerMembers
                .FirstOrDefaultAsync(sm => sm.ServerId == serverban.ServerId && sm.UserId == serverban.BannedUserId);
            if (memberToRemove != null)
            {
                _context.ServerMembers.Remove(memberToRemove);
            }

            await _context.SaveChangesAsync();
            // TODO: Notify user (if online) and server members about the ban via SignalR
            return Result<string>.Success("User banned successfully");
        }

        public async Task<Result<string>> RemoveBanAsync(Guid serverId, Guid removerId, Guid bannedUserId)
        {
            var serverBan = await _context.ServerBans
                .FirstOrDefaultAsync(sb => sb.ServerId == serverId && sb.BannedUserId == bannedUserId);

            if (serverBan == null)
            {
                return Result<string>.Failure("Ban not found");
            }

            // TODO: Authorization: Check if removerId has permission to unban

            _context.ServerBans.Remove(serverBan);
            await _context.SaveChangesAsync();
            // TODO: Notify relevant parties via SignalR
            return Result<string>.Success("Ban removed successfully");
        }

        public async Task<bool> IsUserAdminAsync(Guid serverId, Guid userId)
        {
            var server = await _context.Servers.FindAsync(serverId);
            if (server != null && server.OwnerId == userId)
            {
                return true;
            }
            // TODO: Extend this to check for users with an "Admin" role on the server
            return false;
        }

        public async Task<Result<ICollection<ServerDto>>> GetServersByUserIdAsync(Guid userId)
        {
            var servers = await _context.ServerMembers
                .Where(sm => sm.UserId == userId)
                .Select(sm => sm.Server)
                .Select(s => new ServerDto
                {
                    ServerId = s.ServerId,
                    Name = s.Name,
                    Description = s.Description,
                    IconUrl = s.IconUrl,
                    IsPublic = s.IsPublic
                })
                .ToListAsync();

            return Result<ICollection<ServerDto>>.Success(servers);
        }

        public async Task<Result<ServerDto>> GetServerByIdAsync(Guid serverId)
        {
            var server = await _context.Servers.FindAsync(serverId);
            if (server == null)
            {
                return Result<ServerDto>.Failure("No server found");
            }

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

        public async Task<Result<ICollection<UserDto>>> GetServerMembersAsync(Guid serverId)
        {
            var serverMembers = await _context.ServerMembers
                .Where(sm => sm.ServerId == serverId)
                .Select(sm => sm.User)
                .Select(u => new UserDto
                {
                    Id = u.Id.ToString(),
                    Username = u.UserName,
                    Email = u.Email,
                    Image = u.AvatarUrl
                })
                .ToListAsync();

            return Result<ICollection<UserDto>>.Success(serverMembers);
        }
    }
}