﻿using DiscordClone.Db;
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
        private readonly ILogger<MessageService> _logger;

        public MessageService(ApplicationContext applicationContext, ChatHub chatHub, ILogger<MessageService> logger)
        {
            _applicationContext = applicationContext;
            _chatHub = chatHub;
            _logger = logger;
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
            await _chatHub.SendMessage(messageDto, groupName);

        }
        public async Task SendPrivateMessage(PrivateMessageDto messageDto)
        {
            var sender = await _applicationContext.Users.FindAsync(messageDto.SenderId)
                         ?? throw new Exception("Sender not found");
            var receiver = await _applicationContext.Users.FindAsync(messageDto.ReceiverId)
                           ?? throw new Exception("Receiver not found");

            var message = new PrivateMessage
            {
                SenderId = messageDto.SenderId,
                ReceiverId = messageDto.ReceiverId,
                SentAt = DateTime.UtcNow,
                Content = messageDto.Content,
            };
            await _applicationContext.PrivateMessages.AddAsync(message);
            await _applicationContext.SaveChangesAsync();
            await _chatHub.SendPrivateMessage(messageDto);
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
            var messages = await _applicationContext.Messages.Include(x => x.User)
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
            }).OrderBy(x => x.CreatedAt).ToList();

            return Result<List<MessageDto>>.Success(messageDtos);
        }
        public async Task<Result<List<PrivateMessageDto>>> GetPrivateMessagesFromLastNDays(Guid user1, Guid user2, int days)
        {
            var fromDate = DateTime.UtcNow.AddDays(-days);
            var user1SendedMessages = await _applicationContext.PrivateMessages.Where(x=>x.SenderId==user1 && x.ReceiverId== user2 && x.SentAt >= fromDate).ToListAsync();
            _logger.LogInformation($"User1 sended messages: {user1SendedMessages.Count}");
            _logger.LogInformation($"user1 sended messages:{user1SendedMessages}");
            var user2SendedMessages = await _applicationContext.PrivateMessages.Where(x => x.SenderId == user2 && x.ReceiverId == user1 && x.SentAt >= fromDate).ToListAsync();
            _logger.LogInformation($"User2 sended messages: {user2SendedMessages.Count}");
            _logger.LogInformation($"User2 sended messages:{user2SendedMessages}");
            int i = 0, j = 0;
            List<PrivateMessageDto> privateMessageDtos = new();
            var allMessages = user1SendedMessages.Concat(user2SendedMessages)
                                      .OrderByDescending(m => m.SentAt) 
                                      .ToList();

            foreach (var message in allMessages)
            {
                privateMessageDtos.Add(new PrivateMessageDto
                {
                    MessageId = message.MessageId,
                    SenderId = message.SenderId,
                    ReceiverId = message.ReceiverId,
                    Content = message.Content,
                    SentAt = message.SentAt,
                    ReceivedAt = message.ReceivedAt
                });
            }
            _logger.LogInformation($"private messagesdtos count:{privateMessageDtos.Count}");
            return Result<List<PrivateMessageDto>>.Success(privateMessageDtos);
        }
    }
}
