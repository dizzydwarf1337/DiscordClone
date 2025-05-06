using DiscordClone.Db;
using DiscordClone.Hubs;
using DiscordClone.Models;
using DiscordClone.Models.Dtos;
using DiscordClone.Utils;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;


namespace DiscordClone.Services
{
    public class NotificationService
    {
        private readonly ApplicationContext _context;
        private readonly ILogger<FriendshipService> _logger;
        
        private readonly ChatHub _chatHub;
        public NotificationService(ApplicationContext context, ILogger<FriendshipService> logger, ChatHub chatHub)
        {
            _context = context;
            _logger = logger;
            _chatHub = chatHub;
        }

        public async Task<Result<bool>> SendNotification(NotificationDto notification)
        {
            if (notification.ReceiversId == null || !notification.ReceiversId.Any())
            {
                return Result<bool>.Failure("No receivers specified.");
            }

            if (notification.Payload == null)
            {
                return Result<bool>.Failure("Notification payload is required.");
            }

            foreach(var receiverId in notification.ReceiversId) {
                await _chatHub.SendNotification(receiverId.ToString(), notification.Type, notification.Payload);
                _logger.LogInformation($"Notification sent to {receiverId}");
            }

            return Result<bool>.Success(true);
        }
    }
}
