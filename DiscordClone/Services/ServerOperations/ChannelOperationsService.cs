using DiscordClone.Db;
using DiscordClone.Hubs;
using DiscordClone.Models;
using DiscordClone.Models.Dtos;
using DiscordClone.Utils;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace DiscordClone.Services.ServerOperations
{
    public interface IChannelOperationsService
    {
        Task<Result<ChannelDto>> CreateChannelAsync(ChannelCreateDto channelDto);
        Task<Result<string>> DeleteChannelAsync(ChannelDto channelDto);
        Task<Result<string>> DeleteChannelByIdAsync(Guid Id);
        Task<Result<List<MessageDto>>> GetAllMessagesAsync(Guid channelId);
        Task<Result<List<MessageDto>>> GetMessagesFromLastNDays(Guid channelId, int days);
    }

    public class ChannelOperationsService : IChannelOperationsService
    {
        private readonly ApplicationContext _context;
        private readonly IHubContext<ChatHub> _hubContext;

        public ChannelOperationsService(ApplicationContext context, IHubContext<ChatHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        public async Task<Result<ChannelDto>> CreateChannelAsync(ChannelCreateDto channelDto)
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

            return Result<ChannelDto>.Success(channelDtoResult);
        }

        public async Task<Result<string>> DeleteChannelAsync(ChannelDto channelDto)
        {
            var channel = await _context.Channels.FindAsync(channelDto.ChannelId);
            if (channel == null)
            {
                return Result<string>.Failure("Channel not found");
            }

            _context.Channels.Remove(channel);
            await _context.SaveChangesAsync();

            return Result<string>.Success("Channel removed successfully!");
        }

        public async Task<Result<string>> DeleteChannelByIdAsync(Guid Id)
        {
            var channel = await _context.Channels.FindAsync(Id);
            if (channel == null)
            {
                return Result<string>.Failure("Channel not found");
            }

            _context.Channels.Remove(channel);
            await _context.SaveChangesAsync();

            return Result<string>.Success("Channel removed successfully!");
        }

        public async Task<Result<List<MessageDto>>> GetAllMessagesAsync(Guid channelId)
        {
            var messages = await _context.Messages
                .Where(m => m.ChannelId == channelId)
                .ToListAsync();

            if (messages == null || messages.Count == 0)
            {
                return Result<List<MessageDto>>.Failure("No messages found for this channel");
            }

            var messageDtos = messages.Select(m => new MessageDto
            {
                MessageId = m.MessageId,
                Content = m.Content,
                CreatedAt = m.CreatedAt,
                SenderId = m.UserId
            }).ToList();

            return Result<List<MessageDto>>.Success(messageDtos);
        }

        public async Task<Result<List<MessageDto>>> GetMessagesFromLastNDays(Guid channelId, int days)
        {
            var fromDate = DateTime.UtcNow.AddDays(-days);
            var messages = await _context.Messages
                .Where(m => m.ChannelId == channelId && m.CreatedAt >= fromDate)
                .ToListAsync();

            if (messages == null || messages.Count == 0)
            {
                return Result<List<MessageDto>>.Failure($"No messages found in the last {days} days");
            }

            var messageDtos = messages.Select(m => new MessageDto
            {
                MessageId = m.MessageId,
                Content = m.Content,
                CreatedAt = m.CreatedAt,
                SenderId = m.UserId
            }).ToList();

            return Result<List<MessageDto>>.Success(messageDtos);
        }
    }
}