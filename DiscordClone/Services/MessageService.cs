using System.Text.RegularExpressions;
using DiscordClone.Db;
using DiscordClone.Hubs;
using DiscordClone.Models;
using DiscordClone.Models.Dtos;
using DiscordClone.Utils;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DiscordClone.Services
{
    public class MessageService
    {
        private readonly ApplicationContext _applicationContext;
        private readonly ChatHub _chatHub;
        private readonly ILogger<MessageService> _logger;
        private readonly NotificationService _notificationService;

        public MessageService(ApplicationContext applicationContext, ChatHub chatHub, ILogger<MessageService> logger,
         NotificationService notificationService)
        {
            _applicationContext = applicationContext;
            _chatHub = chatHub;
            _logger = logger;
            _notificationService = notificationService;
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

            var unreadMessages = await _applicationContext.PrivateMessages
                .Where(m => m.SenderId == messageDto.ReceiverId && m.ReceiverId == messageDto.SenderId && !m.Read)
                .ToListAsync();

            foreach (var msg in unreadMessages)
            {
                msg.Read = true;
                msg.ReceivedAt = DateTime.UtcNow;
            }

            var message = new PrivateMessage
            {
                SenderId = messageDto.SenderId,
                ReceiverId = messageDto.ReceiverId,
                SentAt = DateTime.UtcNow,
                Content = messageDto.Content,
                Read = false
            };

            await _applicationContext.PrivateMessages.AddAsync(message);
            await _applicationContext.SaveChangesAsync();

            var notification = new NotificationDto
            {
                ReceiversId = new List<Guid> { messageDto.ReceiverId },
                Type = "NewPrivateMessage",
                Payload = new { messageDto }
            };

            await _notificationService.SendNotification(notification);
            await _chatHub.SendPrivateMessage(messageDto);
        }

        public async Task<Result<List<UnreadPrivateMessageCountDto>>> GetUnreadPrivateMessageCountsAsync(Guid userId)
        {
            var unreadCounts = await _applicationContext.PrivateMessages
                .Where(m => m.ReceiverId == userId && !m.Read && m.SenderId != userId)
                .GroupBy(m => m.SenderId)
                .Select(g => new UnreadPrivateMessageCountDto 
                { 
                    FriendId = g.Key, 
                    Count = g.Count() 
                })
                .ToListAsync();

            return Result<List<UnreadPrivateMessageCountDto>>.Success(unreadCounts);
        }

        public async Task<Result<List<UnreadGroupMessageCountDto>>> GetUnreadGroupMessageCountsAsync(Guid userId)
        {
            var userGroupIds = await _applicationContext.FriendGroups
                .Where(g => g.Members.Any(m => m.Id == userId))
                .Select(g => g.Id)
                .ToListAsync();

            var unreadCounts = await _applicationContext.GroupMessages
                .Where(m => userGroupIds.Contains(m.GroupId))
                .Where(m => m.SenderId != userId)
                .Include(m => m.ReadBy)
                .Where(m => !m.ReadBy.Any(r => r.Id == userId))
                .GroupBy(m => m.GroupId)
                .Select(g => new UnreadGroupMessageCountDto
                {
                    GroupId = g.Key,
                    Count = g.Count()
                })
                .ToListAsync();

            return Result<List<UnreadGroupMessageCountDto>>.Success(unreadCounts);
        }
        public async Task SendGroupMessage(GroupMessageDto messageDto)
        {
            var sender = await _applicationContext.Users.FindAsync(messageDto.SenderId)
                        ?? throw new Exception("Sender not found");
            var receiver = await _applicationContext.FriendGroups
                        .Include(g => g.Members)
                        .FirstOrDefaultAsync(g => g.Id == messageDto.GroupId)
                    ?? throw new Exception("Receiving group not found");

            var newMessage = new GroupMessage
            {
                SenderId = messageDto.SenderId,
                GroupId = messageDto.GroupId,
                SentAt = DateTime.UtcNow,
                Content = messageDto.Content,
                ReadBy = new List<User> { sender }
            };
            await _applicationContext.GroupMessages.AddAsync(newMessage);
            await _applicationContext.SaveChangesAsync();

            var groupMembers = receiver.Members
                .Where(u => u.Id != messageDto.SenderId)
                .Select(u => u.Id)
                .ToList();

            var notification = new NotificationDto
            {
                ReceiversId = groupMembers,
                Type = "NewGroupMessage",
                Payload = new { messageDto }
            };

            await _notificationService.SendNotification(notification);
            await _chatHub.SendGroupMessage(messageDto);
        }
        public async Task MarkGroupMessagesAsReadAsync(Guid userId, Guid groupId)
        {
            var unreadMessages = await _applicationContext.GroupMessages
                .Where(m => m.GroupId == groupId && !m.ReadBy.Any(u => u.Id == userId))
                .Include(m => m.ReadBy)
                .ToListAsync();

            if (!unreadMessages.Any())
            {
                return;
            }

            var user = await _applicationContext.Users
                .FirstOrDefaultAsync(u => u.Id == userId)
                    ?? throw new Exception("User not found");

            foreach (var message in unreadMessages)
            {
                message.ReadBy ??= new List<User>();
                
                if (!message.ReadBy.Any(u => u.Id == userId))
                {
                    message.ReadBy.Add(user);
                }
            }

            await _applicationContext.SaveChangesAsync();
        }

        public async Task MarkPrivateMessagesAsReadAsync(Guid userId, Guid friendId)
        {
            var unreadMessages = await _applicationContext.PrivateMessages
            .Where(m => m.ReceiverId == userId && m.SenderId == friendId && !m.Read)
            .ToListAsync();

            foreach (var message in unreadMessages)
            {
            message.Read = true;
            message.ReceivedAt = DateTime.UtcNow;
            }

            await _applicationContext.SaveChangesAsync();
        }
        public async Task AddReactionAsync(AddReactionDto addReactionDto)
        {
            // Sprawdzenie, czy wiadomość jest prywatna
            var privateMessage = await _applicationContext.PrivateMessages
                .Include(m => m.Reactions)
                .FirstOrDefaultAsync(m => m.MessageId == addReactionDto.MessageId);

            if (privateMessage != null)
            {
                var existingReaction = privateMessage.Reactions
                    .FirstOrDefault(r => r.UserId == addReactionDto.UserId && r.ReactionType == addReactionDto.ReactionType);

                if (existingReaction != null)
                {
                    privateMessage.Reactions.Remove(existingReaction);
                }
                else
                {
                    privateMessage.Reactions.Add(new Reaction
                    {
                        UserId = addReactionDto.UserId,
                        ReactionType = addReactionDto.ReactionType
                    });
                }

                await _applicationContext.SaveChangesAsync();
                return;
            }

            // Jeśli to nie jest prywatna wiadomość, sprawdza zwykłą wiadomość w kanale
            var message = await _applicationContext.Messages
                .Include(m => m.Reactions)
                .FirstOrDefaultAsync(m => m.MessageId == addReactionDto.MessageId);

            if (message == null)
            {
                throw new Exception("Message not found");
            }

            var existingReactionInChannel = message.Reactions
                .FirstOrDefault(r => r.UserId == addReactionDto.UserId && r.ReactionType == addReactionDto.ReactionType);

            if (existingReactionInChannel != null)
            {
                message.Reactions.Remove(existingReactionInChannel);
            }
            else
            {
                message.Reactions.Add(new Reaction
                {
                    UserId = addReactionDto.UserId,
                    ReactionType = addReactionDto.ReactionType
                });
            }

            await _applicationContext.SaveChangesAsync();
        }



        public async Task RemoveReactionAsync(RemoveReactionDto removeReactionDto)
        {
            // Sprawdzenie, czy wiadomość jest prywatna
            var privateMessage = await _applicationContext.PrivateMessages
                .Include(m => m.Reactions)
                .FirstOrDefaultAsync(m => m.MessageId == removeReactionDto.MessageId);

            if (privateMessage != null)
            {
                var reaction = privateMessage.Reactions
                    .FirstOrDefault(r => r.UserId == removeReactionDto.UserId && r.ReactionType == removeReactionDto.ReactionType);

                if (reaction != null)
                {
                    privateMessage.Reactions.Remove(reaction);
                    await _applicationContext.SaveChangesAsync();
                }

                return;
            }

            var message = await _applicationContext.Messages
                .Include(m => m.Reactions)
                .FirstOrDefaultAsync(m => m.MessageId == removeReactionDto.MessageId);

            if (message == null)
            {
                throw new Exception("Message not found");
            }

            var reactionInChannel = message.Reactions
                .FirstOrDefault(r => r.UserId == removeReactionDto.UserId && r.ReactionType == removeReactionDto.ReactionType);

            if (reactionInChannel != null)
            {
                message.Reactions.Remove(reactionInChannel);
                await _applicationContext.SaveChangesAsync();
            }
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
                SenderId = m.UserId,
                Reactions = m.Reactions
                .Select(r => new ReactionDto
                {
                    UserId = r.UserId, 
                    ReactionType = r.ReactionType
                })
        .ToList() 
            }).ToList();
            return Result<List<MessageDto>>.Success(messageDtos);
        }
        public async Task<Result<List<MessageDto>>> GetMessagesFromLastNDays(Guid channelId, int days)
        {
            var fromDate = DateTime.UtcNow.AddDays(-days);
            var messages = await _applicationContext.Messages
                .Include(m => m.User)
                .Include(m => m.Reactions)
                .Where(m => m.ChannelId == channelId && m.CreatedAt >= fromDate)
                .OrderByDescending(m => m.CreatedAt) 
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
                SenderName = m.User.UserName,
                Reactions = m.Reactions != null ? m.Reactions.Select(r => new ReactionDto
                {
                    UserId = r.UserId,
                    ReactionType = r.ReactionType,
                }).ToList() : new List<ReactionDto>() // Ensure to handle null Reactions
            }).OrderByDescending(x => x.CreatedAt).ToList(); 

            return Result<List<MessageDto>>.Success(messageDtos);
        }
        public async Task<Result<List<PrivateMessageDto>>> GetPrivateMessagesFromLastNDays(Guid user1, Guid user2, int days)
        {
            var fromDate = DateTime.UtcNow.AddDays(-days);
            var user1SendedMessages = await _applicationContext.PrivateMessages.Where(x => x.SenderId == user1 && x.ReceiverId == user2 && x.SentAt >= fromDate).ToListAsync();
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

        public async Task<Result<List<GroupMessageDto>>> GetGroupMessagesFromLastDays(Guid userId, Guid groupId, int days)
        {
            var fromDate = DateTime.UtcNow.AddDays(-days);
            var messages = await _applicationContext.GroupMessages
                .Include(m => m.Sender)          
                .Include(m => m.Reactions)   
                .Where(m => m.GroupId == groupId && m.SentAt >= fromDate)
                .ToListAsync();

            if (messages == null || messages.Count == 0)
            {
                return Result<List<GroupMessageDto>>.Success(new List<GroupMessageDto>());
            }

            var messageDtos = messages.Select(m => new GroupMessageDto
            {
                MessageId = m.MessageId,
                Content = m.Content,
                SentAt = m.SentAt,
                SenderId = m.SenderId,
            }).OrderBy(x => x.SentAt).ToList();

            return Result<List<GroupMessageDto>>.Success(messageDtos);
        }
    }
}
