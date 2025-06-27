using DiscordClone.Db;
using DiscordClone.Hubs;
using DiscordClone.Models.Dtos;
using DiscordClone.Utils;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace DiscordClone.Services
{
    public class NotificationService
    {
        private readonly ApplicationContext _context;
        private readonly ILogger<NotificationService> _logger;
        private readonly IHubContext<ChatHub> _chatHubContext;

        public NotificationService(
            ApplicationContext context,
            ILogger<NotificationService> logger,
            IHubContext<ChatHub> chatHubContext)
        {
            _context = context;
            _logger = logger;
            _chatHubContext = chatHubContext;
        }

        public async Task<Result<bool>> SendNotification(NotificationDto notification)
        {
            if (notification.ReceiversId == null || !notification.ReceiversId.Any())
            {
                _logger.LogWarning("SendNotification: No receivers specified.");
                return Result<bool>.Failure("No receivers specified.");
            }

            if (notification.Payload == null)
            {
                _logger.LogWarning("SendNotification: Notification payload is null.");
                return Result<bool>.Failure("Notification payload is required.");
            }

            const string clientNotificationMethod = "ReceiveNotification";

            foreach (var receiverId in notification.ReceiversId)
            {
                if (receiverId == Guid.Empty)
                {
                    _logger.LogWarning($"SendNotification: Skipping empty Guid receiverId for type {notification.Type}.");
                    continue;
                }

                try
                {
                    await _chatHubContext.Clients.User(receiverId.ToString()).SendAsync(
                        clientNotificationMethod,
                        new { Type = notification.Type, Payload = notification.Payload }
                    );
                    _logger.LogInformation($"Notification (Type: {notification.Type}) sent to user {receiverId}.");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error sending notification (Type: {notification.Type}) to user {receiverId}.");
                }
            }

            return Result<bool>.Success(true);
        }
    }
}