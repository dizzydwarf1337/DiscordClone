using DiscordClone.Db;
using DiscordClone.Hubs;
using DiscordClone.Models;
using DiscordClone.Models.Dtos;
using DiscordClone.Utils;
using Microsoft.EntityFrameworkCore;

namespace DiscordClone.Services
{
    public class MessageService
    {
        private readonly ApplicationContext _applicationContext;
        private readonly ChatHub _chatHub;

        public MessageService(ApplicationContext applicationContext, ChatHub chatHub)
        {
            _applicationContext = applicationContext;
            _chatHub = chatHub;
        }

        public async Task SendMessageAsync(MessageDto messageDto)
        {
            var channel = await _applicationContext.Channels.FindAsync(messageDto.ChannelId)
                          ?? throw new Exception("Channel not found");
            var server = await _applicationContext.Servers.FindAsync(channel.ServerId)
                         ?? throw new Exception("Server not found");

            var groupName = $"{server.Name}:{channel.Name}";
            var message = new Message
            {
                Content = messageDto.Content,
                CreatedAt = DateTime.UtcNow,
                ChannelId = messageDto.ChannelId,
                UserId = messageDto.SenderId
            };
            _applicationContext.Messages.Add(message);
            await _applicationContext.SaveChangesAsync();
            Console.WriteLine($"Sending message to group {groupName}: {messageDto.Content}");

            await _chatHub.SendMessage(messageDto, groupName);

        }
        public async Task<Result<List<MessageDto>>> GetAllMessagesAsync(Guid channelId)
        {
            var messages = await _applicationContext.Messages
                .Where(m => m.ChannelId == channelId)
                .ToListAsync();

            if (messages == null || messages.Count == 0)
            {
                return Result<List<MessageDto>>.Success(new List<MessageDto>());
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
            var messages = await _applicationContext.Messages.Include(x=>x.User)
                .Where(m => m.ChannelId == channelId && m.CreatedAt >= fromDate)
                .ToListAsync();

            if (messages == null || messages.Count == 0)
            {
                return Result<List<MessageDto>>.Success(new List<MessageDto>());
            }

            var messageDtos = messages.Select(m => new MessageDto
            {
                MessageId = m.MessageId,
                Content = m.Content,
                CreatedAt = m.CreatedAt,
                SenderId = m.UserId,
                SenderName = m.User.UserName
            }).OrderBy(x=>x.CreatedAt).ToList();

            return Result<List<MessageDto>>.Success(messageDtos);
        }
    }
}
