using DiscordClone.Db;
using DiscordClone.Hubs;
using DiscordClone.Models;
using DiscordClone.Models.Dtos;
using DiscordClone.Utils;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace DiscordClone.Services.ServerOperations
{
    public interface IChannelOperationsService
    {
        Task<Result<ChannelDto>> CreateChannelAsync(ChannelCreateDto channelDto, Guid userId);
        Task<Result<string>> DeleteChannelAsync(ChannelDto channelDto, Guid userId);
        Task<Result<string>> DeleteChannelByIdAsync(Guid Id, Guid userId);
        Task<Result<ChannelDto>> GetChannelByIdAsync(Guid channelId);
        Task<Result<ICollection<ChannelDto>>> GetChannelsByServerIdAsync(Guid serverId);
        Task<Result<string>> JoinChannelAsync(string groupName);
        Task<Result<ICollection<String>>> GetUserChannelsGroupNameByUserIdAsync(Guid userId);
    }

    public class ChannelOperationsService : IChannelOperationsService
    {
        private readonly ApplicationContext _context;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly ChatHub _chatHub;

        public ChannelOperationsService(ApplicationContext context, IHubContext<ChatHub> hubContext, ChatHub chatHub)
        {
            _context = context;
            _hubContext = hubContext;
            _chatHub = chatHub;
        }
        public async Task<Result<ChannelDto>> GetChannelByIdAsync(Guid channelId)
        {
            var channel = await _context.Channels.FindAsync(channelId);
            if (channel == null)
            {
                return Result<ChannelDto>.Failure("Channel not found");
            }
            var channelDto = new ChannelDto
            {
                ChannelId = channel.ChannelId,
                Name = channel.Name,
                ChannelType = channel.ChannelType,
                Topic = channel.Topic,
                CreatedAt = channel.CreatedAt
            };
            return Result<ChannelDto>.Success(channelDto);
        }
        public async Task<Result<ChannelDto>> CreateChannelAsync(ChannelCreateDto channelDto, Guid userId)
        {
            var server = await _context.Servers.FindAsync(channelDto.ServerId);
            if (server == null)
            {
                return Result<ChannelDto>.Failure("Server not found");
            }

            var channel = new Channel
            {
                Name = channelDto.Name,
                ChannelType = channelDto.ChannelType ?? "text",
                ServerId = channelDto.ServerId,
                Topic = channelDto.Topic,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Channels.AddAsync(channel);
            await _context.SaveChangesAsync();

            var channelDtoResult = new ChannelDto
            {
                ChannelId = channel.ChannelId,
                Name = channel.Name,
                ChannelType = channel.ChannelType,
                Topic = channel.Topic,
                CreatedAt = channel.CreatedAt
            };

            await _hubContext.Clients.Group(channelDto.ServerId.ToString())
                .SendAsync("ChannelCreated", channelDtoResult);

            return Result<ChannelDto>.Success(channelDtoResult);
        }

        public async Task<Result<string>> DeleteChannelAsync(ChannelDto channelDto, Guid userId)
        {
            var channel = await _context.Channels.FindAsync(channelDto.ChannelId);
            if (channel == null)
            {
                return Result<string>.Failure("Channel not found");
            }


            _context.Channels.Remove(channel);
            await _context.SaveChangesAsync();

            await _hubContext.Clients.Group(channel.ServerId.ToString())
                .SendAsync("ChannelDeleted", channelDto);

            return Result<string>.Success("Channel removed successfully!");
        }

        public async Task<Result<string>> DeleteChannelByIdAsync(Guid Id, Guid userId)
        {
            var channel = await _context.Channels.FindAsync(Id);
            if (channel == null)
            {
                return Result<string>.Failure("Channel not found");
            }

            _context.Channels.Remove(channel);
            await _context.SaveChangesAsync();

            await _hubContext.Clients.Group(channel.ServerId.ToString())
                .SendAsync("ChannelDeleted", new { ChannelId = Id });

            return Result<string>.Success("Channel removed successfully!");
        }

        public async Task<Result<ICollection<ChannelDto>>> GetChannelsByServerIdAsync(Guid serverId)
        {
            var server = await _context.Servers.FindAsync(serverId) ?? throw new Exception("Server Not Found");
            var channels = await _context.Channels
                .Where(c => c.ServerId == serverId)
                .ToListAsync();
            return Result<ICollection<ChannelDto>>.Success(channels.Select(c => new ChannelDto
            {
                ChannelId = c.ChannelId,
                Name = c.Name,
                ChannelType = c.ChannelType,
                Topic = c.Topic,
                CreatedAt = c.CreatedAt
            }).ToList());
        }
        public async Task<Result<string>> JoinChannelAsync(string groupName)
        {
            try
            {
                await _chatHub.JoinChannel(groupName);
                return Result<string>.Success("Joined channel successfully!");
            }
            catch (Exception e)
            {
                return Result<string>.Failure(e.Message);

            }
        }

        public async Task<Result<ICollection<string>>> GetUserChannelsGroupNameByUserIdAsync(Guid userId)
        {
            var serverMembers = await _context.ServerMembers.Where(sm => sm.UserId == userId).ToListAsync();
            var channels = await _context.Channels.Include(x => x.Server).Where(x => serverMembers.Select(s => s.ServerId).Contains(x.ServerId)).ToListAsync();
            List<string> result = new List<string>();
            foreach (var channel in channels)
            {
                result.Add($"{channel.Server.Name}:{channel.Name}");
            }
            return Result<ICollection<string>>.Success(result);
        }
    }
}
