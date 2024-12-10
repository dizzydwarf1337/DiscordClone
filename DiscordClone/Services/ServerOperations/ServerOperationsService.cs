using DiscordClone.Db;
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
    }

    public class ServerOperationsService : IServerOperationsService
    {
        private readonly ApplicationContext _context;

        public ServerOperationsService(ApplicationContext context)
        {
            _context = context;
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

            _context.ServerMembers.Add(serverMember);
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
    }
}